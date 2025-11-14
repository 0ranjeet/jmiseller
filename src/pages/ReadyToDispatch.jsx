// pages/ReadyToDispatch.jsx
import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useSeller } from '../contexts/SellerContext';
import PageHeader from '../components/PageHeader';
import './ReadyToDispatch.css';
import productData from '../pages/productData.json';

const ReadyToDispatch = () => {
  const { seller } = useSeller();
  const sellerId = seller?.sellerId;

  const [category, setCategory] = useState('916HUID');
  const [subCategory, setSubCategory] = useState('KATAKI');
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showSelection, setShowSelection] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dispatching, setDispatching] = useState(false);

  const categories = productData?.categoriesBySegment?.['GOLD'] || [];
  const subCategories = productData?.productSources || [];

  // --- 🔁 Helper: Calculate physical totals from orderDetail ---
  const calculateOrderTotals = (order) => {
    let totalGross = 0;
    let totalSets = 0;
    let totalnetWt = 0;

    if (order.orderDetail && typeof order.orderDetail === 'object') {
      Object.values(order.orderDetail).forEach((variant) => {
        totalGross += parseFloat(variant.grossWt) || 0;
        totalSets += parseInt(variant.set) || 0;
        totalnetWt += parseFloat(variant.netWt) || 0;
      });
    }

    return { totalGross, totalSets, totalnetWt };
  };

  // --- 🔍 Helper: Calculate fine weight for a SINGLE order ---
  const getOrderFineWeight = (order) => {
    const num = (v) => parseFloat(v) || 0;

    const westage =
      num(order.purity) +
      num(order.wastage) +
      num(order.specificationMC);

    let totalnetWt = 0;
    if (order.orderDetail && typeof order.orderDetail === 'object') {
      Object.values(order.orderDetail).forEach((variant) => {
        totalnetWt += parseFloat(variant.netWt) || 0;
      });
    }

    const fineWeight = totalnetWt * (westage / 100);
    return fineWeight;
  };

  // --- 💰 Helper: Calculate financial total for a SINGLE order ---
  const getOrderTotalAmount = (order) => {
    const fineWeight = getOrderFineWeight(order);
    const goldRate = 6345; // Consider making dynamic later
    const amount = fineWeight * goldRate;
    const gst = amount * 0.03;
    const totalAmount = amount + gst;

    return totalAmount; // raw number
  };

  // --- 📊 Helper: Calculate summary for selected orders ---
  const calculateSummary = () => {
    const selectedItems = orders.filter((order) =>
      selectedOrders.includes(order.firestoreId)
    );

    let totalSets = 0;
    let totalWeight = 0;
    let totalnetWt = 0;
    let totalFineWt = 0;

    selectedItems.forEach((order) => {
      const { totalGross, totalSets: sets, totalnetWt: netWt } = calculateOrderTotals(order);
      const fineWt = getOrderFineWeight(order);
      
      totalWeight += totalGross;
      totalSets += sets;
      totalnetWt += netWt;
      totalFineWt += fineWt;
    });

    const totalAmountRaw = selectedItems.reduce(
      (sum, order) => sum + getOrderTotalAmount(order),
      0
    );

    return {
      sets: totalSets,
      weight: totalWeight.toFixed(3),
      totalnetWt: totalnetWt.toFixed(3),
      fineWt: totalFineWt.toFixed(3), // NEW: Total fine weight
      amount: (totalAmountRaw / 1.03).toFixed(2),
      gst: (totalAmountRaw * 0.03 / 1.03).toFixed(2),
      totalAmount: totalAmountRaw.toFixed(2),
      totalAmountRaw,
    };
  };

  // --- 🔍 Helper: Find online sellerside JRE by operatorId ---
  const findSellersideJre = async (operatorId) => {
    try {
      const jreQuery = query(
        collection(db, 'jreStatus'),
        where('role', '==', 'sellerside'),
        where('operatorId', '==', operatorId),
        where('isOnline', '==', true)
      );
      const snapshot = await getDocs(jreQuery);
      if (snapshot.empty) return null;
      const docSnap = snapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() };
    } catch (err) {
      console.error('Error fetching JRE:', err);
      return null;
    }
  };

  // --- 🚚 Main dispatch function ---
  const dispatchOrders = async (dispatchType) => {
    if (selectedOrders.length === 0) return;

    const selectedOrderObjects = orders.filter((order) =>
      selectedOrders.includes(order.firestoreId)
    );

    const operatorId = selectedOrderObjects[0]?.operatorId;
    if (!operatorId) {
      alert('Operator ID missing on selected order(s).');
      return;
    }

    setDispatching(true);

    try {
      const jre = await findSellersideJre(operatorId);
      if (!jre || !jre.id) {
        alert(`❌ No active JRE found for operator: ${operatorId}`);
        return;
      }

      // --- Courier: must have courior === true ---
      if (dispatchType === 'courier') {
        if (jre.courior !== true) {
          alert('❌ Courier dispatch blocked: JRE has courier disabled.');
          return;
        }
      }

      let totalOrderValue = 0;
      // --- Pickup: validate against maxValue/currentValue ---
      if (dispatchType === 'pickup') {
        totalOrderValue = selectedOrderObjects.reduce(
          (sum, order) => sum + getOrderTotalAmount(order),
          0
        );

        const currentValue = jre.currentValue ?? 0;
        const maxValue = jre.maxValue ?? 0;

        if (currentValue + totalOrderValue > maxValue) {
          alert(
            `❌ Pickup limit exceeded!\n` +
            `Assigned: ₹${currentValue.toFixed(2)}, Max: ₹${maxValue}\n` +
            `Your selection: ₹${totalOrderValue.toFixed(2)}`
          );
          return;
        }
      }

      // --- Batch update ---
      const batch = writeBatch(db);

      // Update orders
      selectedOrderObjects.forEach((order) => {
        batch.update(doc(db, 'orderList', order.firestoreId), {
          orderStatus: 'Assigned',
          jreId: jre.id,
          assignedAt: new Date(),
          dispatchedAt: new Date(),
          dispatchType,
        });
      });

      // Update JRE currentValue for pickup
      if (dispatchType === 'pickup') {
        const jreRef = doc(db, 'jreStatus', jre.id);
        const newCurrentValue = (jre.currentValue ?? 0) + totalOrderValue;
        batch.update(jreRef, { currentValue: newCurrentValue });
      }

      await batch.commit();

      // Update UI
      const remainingOrders = orders.filter(
        (order) => !selectedOrders.includes(order.firestoreId)
      );
      setOrders(remainingOrders);
      setFilteredOrders(
        remainingOrders.filter(
          (o) => o.category === category && o.productSource === subCategory
        )
      );
      setSelectedOrders([]);

      alert(`✅ Successfully dispatched via ${dispatchType} to JRE ${jre.id}!`);

    } catch (err) {
      console.error('Dispatch error:', err);
      alert(`❌ Dispatch failed: ${err.message}`);
    } finally {
      setDispatching(false);
    }
  };

  // --- 📥 Fetch orders ---
  useEffect(() => {
    if (!sellerId) return;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, 'orderList'),
          where('sellerId', '==', sellerId),
          where('orderStatus', '==', 'RTD')
        );
        const snapshot = await getDocs(q);

        const fetchedOrders = [];
        snapshot.forEach((docSnap) => {
          fetchedOrders.push({
            firestoreId: docSnap.id,
            ...docSnap.data(),
          });
        });

        setOrders(fetchedOrders);
        setFilteredOrders(
          fetchedOrders.filter(
            (order) =>
              order.category === category && order.productSource === subCategory
          )
        );
      } catch (err) {
        console.error('Fetch orders error:', err);
        setError('Failed to load ready-to-dispatch orders.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [sellerId, category, subCategory]);

  useEffect(() => {
    setFilteredOrders(
      orders.filter(
        (order) =>
          order.category === category && order.productSource === subCategory
      )
    );
  }, [category, subCategory, orders]);

  const toggleOrderSelection = (orderId) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Ready to Dispatch" />
        <div className="dispatch-container">Loading...</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title="Ready to Dispatch" />
        <div className="dispatch-container">
          <p className="error">{error}</p>
        </div>
      </>
    );
  }

  const summary = calculateSummary();

  return (
    <>
      <PageHeader title="Ready to Dispatch" />
      <div className="filters">
        <div className="filter-group">
          <h3>Category</h3>
          <div className="horizontal-scroll-container">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-button ${category === cat ? 'active' : ''}`}
                onClick={() => setCategory(cat)}
                type="button"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <h3>Subcategory</h3>
          <div className="horizontal-scroll-container">
            {subCategories.map((sub) => (
              <button
                key={sub}
                className={`category-button ${subCategory === sub ? 'active' : ''}`}
                onClick={() => setSubCategory(sub)}
                type="button"
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="dispatch-container">
        <p className="results-count">
          {filteredOrders.length} request{filteredOrders.length !== 1 ? 's' : ''} found
        </p>

        <div className="dispatch-grid">
          {filteredOrders.length === 0 ? (
            <p className="no-results">No orders ready to dispatch.</p>
          ) : (
            filteredOrders.map((order) => {
              const { totalGross, totalSets, totalnetWt } = calculateOrderTotals(order);
              const isSelected = selectedOrders.includes(order.firestoreId);
              const imageUrl = order.images?.[0]?.url?.trim();

              return (
                <div
                  key={order.firestoreId}
                  className={`order-card ${isSelected ? 'selected' : ''}`}
                >
                  {order.buyerConfirmation ? <div
                    className="selection-checkbox"
                    onClick={() => toggleOrderSelection(order.firestoreId)}
                  >
                    {isSelected ? (
                      <span className="tick-icon">✔</span>
                    ) : (
                      <span className="empty-box">○</span>
                    )}
                  </div> : ""}

                  <div className="order-image">
                    {imageUrl ? (
                      <img src={imageUrl.trim()} alt={order.productName} />
                    ) : (
                      <div className="image-placeholder">No Image</div>
                    )}
                  </div>
                  <h3>{order.productName}</h3>
                  <p>
                    {order.category} • {totalGross.toFixed(3)}g • Net {totalnetWt.toFixed(3)}g • Set {totalSets}
                  </p>
                </div>
              );
            })
          )}
        </div>

        <div className="selection-section">
          <div className="selection-header">
            <span>Selected: {selectedOrders.length}</span>
            <button
              className="toggle-selection"
              onClick={() => setShowSelection(!showSelection)}
            >
              {showSelection ? 'Hide Selection' : 'Show Selection'} ✔
            </button>
          </div>

          {showSelection && selectedOrders.length > 0 && (
            <div className="selection-summary">
              <h2>Selection Summary ({selectedOrders.length} items)</h2>
              <div className="summary-section">
                <h3>{category}</h3>
                <div className="summary-table">
                  <div className="summary-row">
                    <span>SETS</span>
                    <span>{summary.sets}</span>
                  </div>
                  <div className="summary-row">
                    <span>GR. WEIGHT</span>
                    <span>{summary.weight}</span>
                  </div>
                  <div className="summary-row">
                    <span>NET. WEIGHT</span>
                    <span>{summary.totalnetWt}</span>
                  </div>
                  <div className="summary-row">
                    <span>FINE WEIGHT</span>
                    <span>{summary.fineWt}</span>
                  </div>
                  <div className="summary-row">
                    <span>AMOUNT</span>
                    <span>₹{summary.amount}</span>
                  </div>
                  <div className="summary-row total">
                    <span>TOTAL AMOUNT</span>
                    <span>₹{summary.totalAmount}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="rtd-action-buttons">
            <button
              className="courier-btn"
              onClick={() => dispatchOrders('courier')}
              disabled={selectedOrders.length === 0 || dispatching}
            >
              {dispatching ? 'Processing...' : 'Send By Courier'}
            </button>
            <button
              className="dispatch-btn"
              onClick={() => dispatchOrders('pickup')}
              disabled={selectedOrders.length === 0 || dispatching}
            >
              {dispatching ? 'Processing...' : 'Request To Pickup'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReadyToDispatch;