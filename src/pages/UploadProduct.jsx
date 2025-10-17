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
import './FinalCorrection.css';
import PageHeader from '../components/PageHeader';
import { useNavigate } from 'react-router-dom';

const FinalCorrection = () => {
  const { seller } = useSeller();
  const sellerId = seller?.sellerId;
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingOrderId, setSavingOrderId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tempEdits, setTempEdits] = useState({}); // { orderId: { size: { grossWt, netWt, set } } }

  // Helper: Check if all variants of an order have been edited
  const areAllVariantsEdited = (orderId, selectedVariants) => {
    const edits = tempEdits[orderId] || {};
    if (!selectedVariants || selectedVariants.length === 0) return false;
    return selectedVariants.every(variant => edits.hasOwnProperty(variant.size));
  };

  useEffect(() => {
    const fetchOrders = async () => {
      if (!sellerId) return;

      try {
        setLoading(true);
        const q = query(
          collection(db, 'orderList'),
          where('sellerId', '==', sellerId),
          where('orderStatus', '==', 'Assorted')
        );
        const snapshot = await getDocs(q);

        const fetchedOrders = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetchedOrders.push({
            firestoreId: docSnap.id,
            ...data,
            orderDetail: data.orderDetail || {},
          });
        });

        setOrders(fetchedOrders);
        // Initialize tempEdits from existing orderDetail (if any)
        const initialTemp = {};
        fetchedOrders.forEach((order) => {
          initialTemp[order.firestoreId] = { ...order.orderDetail };
        });
        setTempEdits(initialTemp);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [sellerId]);

  const handleProductClick = (product) => {
    navigate(`/product/${product.id}`, { state: { product } });
  };

  // Open drawer to edit a variant — load current or default values
  const openDrawer = (order, variant) => {
    const size = variant.size;
    const currentEdit = tempEdits[order.firestoreId]?.[size] || {};
    const defaultGross = currentEdit.grossWt !== undefined
      ? currentEdit.grossWt
      : order.grossWt || 0;
    const defaultNet = currentEdit.netWt !== undefined
      ? currentEdit.netWt
      : order.netWt || 0;
    const defaultSet = currentEdit.set !== undefined
      ? currentEdit.set
      : 1;

    setSelectedVariant({ order, variant, size, defaultGross, defaultNet, defaultSet });
    setGrossWt(String(defaultGross));
    setNetWt(String(defaultNet));
    setSetCount(String(defaultSet));
    setDrawerOpen(true);
  };

  // Drawer state
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [grossWt, setGrossWt] = useState('0');
  const [netWt, setNetWt] = useState('0');
  const [setCount, setSetCount] = useState('1');

  // Apply edits from drawer to tempEdits (local only)
  const applyDrawerEdits = () => {
    if (!selectedVariant) return;

    const { order, variant, size } = selectedVariant;
    let gross = parseFloat(grossWt) || 0;
    let net = parseFloat(netWt) || 0;
    let setVal = parseInt(setCount) || 1;

    // Enforce constraints
    const maxSet = variant.quantity;
    setVal = Math.max(1, Math.min(setVal, maxSet));
    gross = Math.max(0, gross);
    net = Math.max(0, Math.min(net, gross));

    setTempEdits((prev) => ({
      ...prev,
      [order.firestoreId]: {
        ...prev[order.firestoreId],
        [size]: { grossWt: gross, netWt: net, set: setVal },
      },
    }));

    setDrawerOpen(false);
  };

  // Mark order as RTD — save tempEdits to Firestore
  const handleMarkAsRTD = async (orderId) => {
    const order = orders.find(o => o.firestoreId === orderId);
    if (!order) return;

    if (!areAllVariantsEdited(orderId, order.selectedVariants)) {
      alert('Please edit all variants before marking as RTD.');
      return;
    }

    const edits = tempEdits[orderId] || {};

    setSavingOrderId(orderId);
    try {
      const orderRef = doc(db, 'orderList', orderId);
      await updateDoc(orderRef, {
        orderDetail: edits,
        orderStatus: 'RTD',
        updatedAt: new Date(),
      });

      // Update local state
      setOrders((prev) => prev.filter((o) => o.firestoreId !== orderId));
      setTempEdits((prev) => {
        const newTemp = { ...prev };
        delete newTemp[orderId];
        return newTemp;
      });

      alert('✅ Order marked as RTD!');
    } catch (err) {
      console.error('RTD save error:', err);
      alert(`❌ Failed to mark as RTD: ${err.message}`);
    } finally {
      setSavingOrderId(null);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Final Correction" />
        <div className="final-correction-container">Loading...</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title="Final Correction" />
        <div className="final-correction-container">
          <p className="error">{error}</p>
        </div>
      </>
    );
  }

  // Helper to format numbers to 3 decimals
  const fmt = (num) => (typeof num === 'number' ? num.toFixed(3) : '0.000');

  return (
    <>
      <PageHeader title="Final Correction" />

      <div className="final-correction-container">
        <div className="instruction">
          <p>
            Click a row to edit variant details. You must edit <strong>all variants</strong> before clicking{' '}
            <strong>“Mark as RTD”</strong>.
          </p>
        </div>

        {orders.length === 0 ? (
          <p className="no-orders">No orders need final correction.</p>
        ) : (
          orders.map((order) => {
            const imageUrl = order.images?.[0]?.url?.trim();
            const allEdited = areAllVariantsEdited(order.firestoreId, order.selectedVariants);

            // Compute display data per variant using tempEdits
            const displayVariants = order.selectedVariants.map(variant => {
              const edit = tempEdits[order.firestoreId]?.[variant.size] || {};
              const setVal = edit.set !== undefined ? edit.set : 1;
              const gross = edit.grossWt !== undefined ? edit.grossWt : (order.grossWt || 0);
              const net = edit.netWt !== undefined ? edit.netWt : (order.netWt || 0);
              return { ...variant, set: setVal, grossWt: gross, netWt: net };
            });

            // Compute totals
            const totalSets = displayVariants.reduce((sum, v) => sum + v.set, 0);
            const totalGross = displayVariants.reduce((sum, v) => sum + v.grossWt * v.set, 0);
            const totalNet = displayVariants.reduce((sum, v) => sum + v.netWt * v.set, 0);

            return (
              <div key={order.firestoreId} className="correction-card">
                <div className="order-image">
                  {imageUrl ? (
                    <img
                      src={imageUrl.trim()}
                      alt={order.productName}
                      onClick={() => handleProductClick(order)}
                    />
                  ) : (
                    <div className="image-placeholder">No Image</div>
                  )}
                </div>

                <div className="product-header">
                  <h5>{order.category} / {order.productName}</h5>
                  <p>{order.specification} / {order.styleType}</p>
                </div>

                <p>
                  <span className="spec-label">Wastage: {order.wastage}% </span>
                  {order.specification !== 'PLANE' && (
                    <span className="spec-label">
                      {order.specification} Gram Rate: ₹{order.specificationGramRate}/g
                    </span>
                  )}
                </p>
                <span className="spec-label">Net Gm. MC Rate: ₹{order.netGramMc}/g </span>
                <span className="spec-label">Set MC: ₹{order.setMc} </span>

                {/* Detailed Table */}
                <div className="variant-table">
                  <table className="lot-table">
                    <thead>
                      <tr>
                        <th>Size</th>
                        <th>Sets</th>
                        <th>Gross(g)</th>
                        <th>Net(g)</th>
                        <th>
                          Avg Gross-Net-
                          {order.specification === 'PLANE' ? '' : order.specification}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayVariants.map((variant) => (
                        <tr
                          key={variant.size}
                          className="clickable-row"
                          onClick={() => openDrawer(order, variant)}
                        >
                          <td>{variant.size}</td>
                          <td>{variant.set}</td>
                          <td>{fmt(variant.grossWt)}</td>
                          <td>{fmt(variant.netWt)}</td>
                          <td>
                            {fmt(variant.grossWt)}-{fmt(variant.netWt)}-
                            {order.specification === 'PLANE'
                              ? ''
                              : fmt(variant.grossWt - variant.netWt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="totals-row">
                        <td>Total</td>
                        <td>{totalSets}</td>
                        <td>{fmt(totalGross)}</td>
                        <td>{fmt(totalNet)}</td>
                        {order.specification && order.specification !== 'PLANE' && (
                          <td>({order.specification}) {fmt(totalGross - totalNet)}</td>
                        )}
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <button
                  className="rtd-btn"
                  onClick={() => handleMarkAsRTD(order.firestoreId)}
                  disabled={!allEdited || savingOrderId === order.firestoreId}
                  style={allEdited ? { backgroundColor: '#28a745' } : { backgroundColor: '#dc3545' }}
                >
                  {savingOrderId === order.firestoreId ? 'Marking RTD...' : 'Mark as RTD'}
                </button>
              </div>
            );
          })
        )}

        {/* Bottom Drawer — Edit Only */}
        {drawerOpen && (
          <div className="drawer-overlay" onClick={() => setDrawerOpen(false)}>
            <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
              <h3>
                Edit: {selectedVariant?.variant.size} • Max Qty: {selectedVariant?.variant.quantity}
              </h3>

              <div className="drawer-field">
                <label>Gross Weight (g)</label>
                <input
                  type="number"
                  step="0.001"
                  value={grossWt}
                  onChange={(e) => setGrossWt(e.target.value)}
                />
              </div>

              <div className="drawer-field">
                <label>Net Weight (g) ≤ Gross</label>
                <input
                  type="number"
                  step="0.001"
                  value={netWt}
                  onChange={(e) => setNetWt(e.target.value)}
                />
              </div>

              <div className="drawer-field">
                <label>Set (1 – {selectedVariant?.variant.quantity})</label>
                <input
                  type="number"
                  min="1"
                  max={selectedVariant?.variant.quantity}
                  value={setCount}
                  onChange={(e) => setSetCount(e.target.value)}
                />
              </div>

              <div className="drawer-actions">
                <button
                  className="btn-cancel"
                  onClick={() => setDrawerOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-apply"
                  onClick={applyDrawerEdits}
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default FinalCorrection;