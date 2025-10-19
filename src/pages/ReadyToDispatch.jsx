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

  const categories = productData?.categoriesBySegment?.["GOLD"] || [];
  const subCategories = productData?.productSources || [];

  // --- 🔁 Helper: Calculate totals from orderDetail ---
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

  // --- 📊 Helper: Calculate financial summary ---
  const calculateSummary = () => {
    const selectedItems = orders.filter((order) =>
      selectedOrders.includes(order.firestoreId)
    );
    const num = (v) => parseFloat(v) || 0;
    let totalSets = 0;
    let totalWeight = 0;
    let totalnetWt = 0;
    let totalWestage = 0;
    selectedItems.forEach((order) => {
      totalWestage += num(order.purity) +
      num(order.wastage) +
      num(order.specificationMC) +
      (order.specification && order.specification !== "Plane"
        ? 0
        : 0);
      const { totalGross, totalSets: sets, totalnetWt: netWt } = calculateOrderTotals(order);
      totalWeight += totalGross;
      totalSets += sets;
      totalnetWt += netWt;
    });

    const fineWeight = totalnetWt * totalWestage / 100;
    const goldRate = 6345;
    const amount = fineWeight * goldRate;
    const gst = amount * 0.03;
    const totalAmount = amount + gst;

    return {
      sets: totalSets,
      weight: totalWeight.toFixed(3),
      fineWeight: fineWeight.toFixed(2),
      totalnetWt: totalnetWt.toFixed(3),
      amount: amount.toFixed(2),
      gst: gst.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      totalAmountRaw: totalAmount,
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

  // --- 🚚 Dispatch Logic (shared for both actions) ---
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
      if (!jre) {
        alert(
          `❌ No active sellerside JRE found for your operator (ID: ${operatorId}).`
        );
        return;
      }

      const batch = writeBatch(db);
      selectedOrderObjects.forEach((order) => {
        batch.update(doc(db, 'orderList', order.firestoreId), {
          orderStatus: 'Assigned',
          jreId: jre.id,
          assignedAt: new Date(),
          dispatchedAt: new Date(),
          dispatchType,
        });
      });

      await batch.commit();

      // Update local state
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

      alert(`✅ Orders assigned to JRE ${jre.id} via ${dispatchType}!`);

    } catch (err) {
      console.error('Dispatch error:', err);
      alert(`❌ Failed to dispatch: ${err.message}`);
    } finally {
      setDispatching(false);
    }
  };

  // --- 📥 Fetch RTD Orders ---
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
        console.log(fetchedOrders);
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
      <div className="dispatch-container">
        <div className="filters">
          <div className="filter-group">
            <h3>Category</h3>
            <div className="horizontal-scroll-container">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`category-button ${category === cat ? 'active' : ''
                    }`}
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
                  className={`category-button ${subCategory === sub ? 'active' : ''
                    }`}
                  onClick={() => setSubCategory(sub)}
                  type="button"
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="results-count">
          {filteredOrders.length} request
          {filteredOrders.length !== 1 ? 's' : ''} found
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
                  {/* ✅ Tick Checkbox in Top-Right */}
                  <div className="selection-checkbox" onClick={() => toggleOrderSelection(order.firestoreId)}>
                    {isSelected ? (
                      <span className="tick-icon">✔</span>
                    ) : (
                      <span className="empty-box">○</span>
                    )}
                  </div>

                  <div className="order-image">
                    {imageUrl ? (
                      <img src={imageUrl.trim()} alt={order.productName} />
                    ) : (
                      <div className="image-placeholder">No Image</div>
                    )}
                  </div>
                  <h3>{order.productName}</h3>
                  <p>
                    {order.category} •{totalGross.toFixed(3)}g {totalnetWt.toFixed(3)}g • Set {totalSets}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Selection Summary & Actions */}
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
                  <span>{summary.fineWeight}</span>
                </div>
                <div className="summary-row">
                  <span>AMOUNT</span>
                  <span>₹{summary.amount}</span>
                </div>
                <div className="summary-row">
                  <span>GST</span>
                  <span>₹{summary.gst}</span>
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
    </>
  );
};

export default ReadyToDispatch;