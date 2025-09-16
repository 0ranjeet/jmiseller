import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useSeller } from '../contexts/SellerContext';
import Header from '../components/Header';
import './ReadyToDispatch.css';

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

  const categories = ['916HUID', '840ORNA', '750HUID', '680'];
  const subCategories = ['KATAKI', 'MACHINE MADE', 'CASTING', 'CNC'];

  // Fetch orders with RTD status
  useEffect(() => {
    const fetchOrders = async () => {
      if (!sellerId) return;

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
          const orderData = docSnap.data();
          fetchedOrders.push({
            firestoreId: docSnap.id,
            ...orderData,
          });
        });

        setOrders(fetchedOrders);
        console.log(fetchedOrders);
        setFilteredOrders(
          fetchedOrders.filter(
            (order) =>
              order.category === category && order.productSource === subCategory
          )
        );
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load ready to dispatch orders.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [sellerId]);

  // Update filtered orders when category or subcategory changes
  useEffect(() => {
    setFilteredOrders(
      orders.filter(
        (order) =>
          order.category === category && order.productSource === subCategory
      )
    );
  }, [category, subCategory, orders]);

  // Toggle order selection
  const toggleOrderSelection = (orderId) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    } else {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  };

  // Calculate summary data
  const calculateSummary = () => {
    const selectedItems = orders.filter(order => selectedOrders.includes(order.firestoreId));

    // Calculate total sets
    const totalSets = selectedItems.reduce((sum, order) => {
      return sum + (parseInt(order.orderPiece) || 1);
    }, 0);

    // Calculate total weight
    const totalWeight = selectedItems.reduce((sum, order) => {
      return sum + (parseFloat(order.orderWeight) || parseFloat(order.grossWt) || 0);
    }, 0);

    // Calculate fine weight (assuming 91.6% purity for 916HUID)
    const fineWeight = totalWeight * 0.916;

    // Calculate amount (using sample rate)
    const goldRate = 6345; // Sample gold rate
    const amount = fineWeight * goldRate;

    // Calculate GST (3% of amount)
    const gst = amount * 0.03;

    // Calculate total amount
    const totalAmount = amount + gst;

    return {
      sets: totalSets,
      weight: totalWeight.toFixed(3),
      fineWeight: fineWeight.toFixed(2),
      amount: amount.toFixed(2),
      gst: gst.toFixed(2),
      totalAmount: totalAmount.toFixed(2)
    };
  };

  // Mark selected orders as dispatched
  const markAsDispatched = async () => {
    if (selectedOrders.length === 0) return;

    setDispatching(true);

    try {
      // Update each selected order
      const updatePromises = selectedOrders.map(async (orderId) => {
        const orderRef = doc(db, 'orderList', orderId);
        await updateDoc(orderRef, {
          orderStatus: 'Dispatched',
          dispatchedAt: new Date(),
        });
      });

      await Promise.all(updatePromises);

      // Remove dispatched orders from local state
      setOrders(orders.filter(order => !selectedOrders.includes(order.firestoreId)));
      setFilteredOrders(filteredOrders.filter(order => !selectedOrders.includes(order.firestoreId)));
      setSelectedOrders([]);

      alert('✅ Orders marked as dispatched successfully!');
    } catch (err) {
      console.error('Error marking orders as dispatched:', err);
      alert(`❌ Failed to mark orders as dispatched: ${err.message}`);
    } finally {
      setDispatching(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header title="Ready to Dispatch" />
        <div className="dispatch-container">Loading...</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header title="Ready to Dispatch" />
        <div className="dispatch-container">
          <p className="error">{error}</p>
        </div>
      </>
    );
  }

  const summary = calculateSummary();

  return (
    <>
      <Header title="Ready to Dispatch" />

      <div className="dispatch-container">
        {/* Filters */}
        <div className="filters">
          <div className="filter-group">
            <h3>Category</h3>
            <div className="filter-buttons">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`filter-btn ${category === cat ? 'active' : ''}`}
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
            <div className="filter-buttons">
              {subCategories.map((sub) => (
                <button
                  key={sub}
                  className={`filter-btn ${subCategory === sub ? 'active' : ''}`}
                  onClick={() => setSubCategory(sub)}
                  type="button"
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results count */}
        <p className="results-count">
          {filteredOrders.length} request{filteredOrders.length !== 1 ? 's' : ''} found
        </p>

        {/* Orders Grid */}
        <div className="orders-grid">
          {filteredOrders.length === 0 ? (
            <p className="no-results">No orders ready to dispatch.</p>
          ) : (
            filteredOrders.map((order) => {
              const isSelected = selectedOrders.includes(order.firestoreId);
              const weight = order.orderWeight || order.grossWt || '0';
              const setInfo = order.moqSet ? `Set ${order.moqSet}/${order.moqSet}` : 'Set 1/1';
              const imageUrl = order.images?.[0]?.url?.trim();
              return (
                <div
                  key={order.firestoreId}
                  className={`order-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleOrderSelection(order.firestoreId)}
                ><div className="order-image">
                    {imageUrl ? (
                      <img src={imageUrl} alt={order.productName} />
                    ) : (
                      <div className="image-placeholder">No Image</div>
                    )}
                  </div>
                  <h3>{order.productName}</h3>
                  <p>
                    {order.category} • {weight}g • {setInfo}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Selection Summary */}
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

          <button
            className="dispatch-btn"
            onClick={markAsDispatched}
            disabled={selectedOrders.length === 0 || dispatching}
          >
            {dispatching ? 'Dispatching...' : 'Mark as Dispatched'}
          </button>
        </div>
      </div>
    </>
  );
};

export default ReadyToDispatch;