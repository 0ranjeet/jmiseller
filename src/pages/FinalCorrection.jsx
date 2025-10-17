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

  // Helper: Check if all lotDetails variants have been edited
  const areAllLotsEdited = (orderId, lotDetails) => {
    const edits = tempEdits[orderId] || {};
    if (!lotDetails || lotDetails.length === 0) return false;
    return lotDetails.every(lot => edits.hasOwnProperty(lot.size));
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
            lotDetails: data.lotDetails || [],
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

  // Open drawer to edit a lot — load current or default values
  const openDrawer = (order, lot) => {
    const size = lot.size;
    const currentEdit = tempEdits[order.firestoreId]?.[size] || {};

    const defaultGross = currentEdit.grossWt !== undefined
      ? currentEdit.grossWt
      : parseFloat(lot.grossWt) || 0;

    const defaultNet = currentEdit.netWt !== undefined
      ? currentEdit.netWt
      : parseFloat(lot.netWt) || 0;

    // Use edited value, else ordered quantity, else 0
    let defaultSet;
    if (currentEdit.set !== undefined) {
      defaultSet = currentEdit.set;
    } else {
      const orderedVariant = order.selectedVariants?.find(v => v.size === size);
      defaultSet = orderedVariant ? parseInt(orderedVariant.quantity) || 0 : 0;
    }

    setSelectedVariant({ order, lot, size });
    setGrossWt(String(defaultGross));
    setNetWt(String(defaultNet));
    setSetCount(String(defaultSet));
    setDrawerOpen(true);
  };

  // Drawer state
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [grossWt, setGrossWt] = useState('0');
  const [netWt, setNetWt] = useState('0');
  const [setCount, setSetCount] = useState('0');

  // Apply edits from drawer to tempEdits
  const applyDrawerEdits = () => {
    if (!selectedVariant) return;

    const { order, size } = selectedVariant;
    let setVal = parseInt(setCount) || 0;
    let gross = parseFloat(grossWt) || 0;
    let net = parseFloat(netWt) || 0;

    if (setVal === 0) {
      gross = 0;
      net = 0;
    } else {
      gross = Math.max(0, gross);
      net = Math.max(0, Math.min(net, gross));
    }

    setTempEdits((prev) => ({
      ...prev,
      [order.firestoreId]: {
        ...prev[order.firestoreId],
        [size]: { grossWt: gross, netWt: net, set: setVal },
      },
    }));

    setDrawerOpen(false);
  };

  // Mark order as RTD
  const handleMarkAsRTD = async (orderId) => {
    const order = orders.find(o => o.firestoreId === orderId);
    if (!order) return;

    if (!areAllLotsEdited(orderId, order.lotDetails)) {
      alert('Please edit all lot variants before marking as RTD.');
      return;
    }

    const edits = tempEdits[orderId] || {};

    setSavingOrderId(orderId);
    try {
      // 1. Update order status
      const orderRef = doc(db, 'orderList', orderId);
      await updateDoc(orderRef, {
        orderDetail: edits,
        orderStatus: 'RTD',
        updatedAt: new Date(),
      });

      // 2. Prepare product update data
      const productUpdate = {};
      const ProductRef = doc(db, 'products', order.id);

      if (order.Lot) {
        // ✅ Lot product: update lotDetails array
        const finalLotDetails = order.lotDetails.map(lot => {
          const size = lot.size;
          const edit = edits[size] || {};

          // Use edited values or fallback to original (shouldn't happen due to validation)
          const setVal = edit.set !== undefined ? edit.set : parseInt(lot.set) || 0;
          const gross = edit.grossWt !== undefined ? edit.grossWt : parseFloat(lot.grossWt) || 0;
          const net = edit.netWt !== undefined ? edit.netWt : parseFloat(lot.netWt) || 0;

          // Recompute averages
          const avgGross = setVal > 0 ? (gross / setVal) : 0;
          const avgNet = setVal > 0 ? (net / setVal) : 0;
          const avgSpec = avgGross - avgNet;

          return {
            size,
            set: String(setVal),
            grossWt: String(gross),
            netWt: String(net),
            avgGrossWt: avgGross.toFixed(3),
            avgNetWt: avgNet.toFixed(3),
            avgSpecWt: avgSpec.toFixed(3),
          };
        });

        productUpdate.lotDetails = finalLotDetails;

        // Also update top-level totals (optional but consistent)
        const totalSets = finalLotDetails.reduce((sum, l) => sum + parseInt(l.set), 0);
        const totalGross = finalLotDetails.reduce((sum, l) => sum + parseFloat(l.grossWt), 0);
        const totalNet = finalLotDetails.reduce((sum, l) => sum + parseFloat(l.netWt), 0);

        productUpdate.instockSet = String(totalSets);
        productUpdate.instockGram = totalGross.toFixed(3);
        productUpdate.netWt = totalNet.toFixed(3); // if needed

      } else {
        // ✅ Non-lot product: update instockGram and instockSet
        // For non-lot, you likely have single gross/net/set — but your data suggests using lot logic
        // If non-lot, you may store total values directly in order
        const totalSets = Object.values(edits).reduce((sum, v) => sum + (v.set || 0), 0);
        const totalGross = Object.values(edits).reduce((sum, v) => sum + (v.grossWt || 0), 0);
        const totalNet = Object.values(edits).reduce((sum, v) => sum + (v.netWt || 0), 0);

        productUpdate.instockSet = String(totalSets);
        productUpdate.instockGram = totalGross.toFixed(3);
        productUpdate.netWt = totalNet.toFixed(3); // if applicable
      }

      // 3. Update product document
      await updateDoc(ProductRef, productUpdate);

      // 4. Update local UI
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

  const fmt = (num) => (typeof num === 'number' ? num.toFixed(3) : '0.000');

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

  return (
    <>
      <PageHeader title="Final Correction" />

      <div className="final-correction-container">
        <div className="instruction">
          <p>
            Click a row to edit lot details. You must edit <strong>all lots</strong> before clicking{' '}
            <strong>“Mark as RTD”</strong>.
          </p>
        </div>

        {orders.length === 0 ? (
          <p className="no-orders">No orders need final correction.</p>
        ) : (
          orders.map((order) => {
            const imageUrl = order.images?.[0]?.url?.trim();
            const allEdited = areAllLotsEdited(order.firestoreId, order.lotDetails);
            const spec = order.specification;

            // 🔹 Ordered quantities summary
            const orderedSummary = order.selectedVariants
              ?.map(v => `${v.size} (${v.quantity})`)
              .join(', ');

            // 🔹 Map ordered quantity by size for display
            const orderedQtyBySize = {};
            (order.selectedVariants || []).forEach(v => {
              orderedQtyBySize[v.size] = parseInt(v.quantity) || 0;
            });

            // 🔹 Prepare display rows
            const displayLots = order.lotDetails.map(lot => {
              const size = lot.size;
              const edit = tempEdits[order.firestoreId]?.[size] || {};

              // Sets: edited → ordered → fallback to lot.set → 0
              let setVal;
              if (edit.set !== undefined) {
                setVal = edit.set;
              } else {
                setVal = orderedQtyBySize[size] !== undefined
                  ? orderedQtyBySize[size]
                  : parseInt(lot.set) || 0;
              }

              let gross = edit.grossWt !== undefined ? edit.grossWt : parseFloat(lot.grossWt) || 0;
              let net = edit.netWt !== undefined ? edit.netWt : parseFloat(lot.netWt) || 0;

              if (setVal === 0) {
                gross = 0;
                net = 0;
              }

              const avgGross = setVal > 0 ? gross / setVal : 0;
              const avgNet = setVal > 0 ? net / setVal : 0;
              const avgSpec = avgGross - avgNet;

              return {
                size,
                set: setVal,
                grossWt: gross,
                netWt: net,
                avgGrossWt: avgGross,
                avgNetWt: avgNet,
                avgSpecWt: avgSpec,
              };
            });

            const totalSets = displayLots.reduce((sum, l) => sum + l.set, 0);
            const totalGross = displayLots.reduce((sum, l) => sum + l.grossWt, 0);
            const totalNet = displayLots.reduce((sum, l) => sum + l.netWt, 0);

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

                {/* 🔹 Show what was ordered */}
                {orderedSummary && (
                  <p className="spec-label">
                    <strong>Ordered:</strong> {orderedSummary}
                  </p>
                )}

                <p>
                  <span className="spec-label">Wastage: {order.wastage}% </span>
                  {spec !== 'PLANE' && (
                    <span className="spec-label">
                      {spec} Gram Rate: ₹{order.specificationGramRate}/g
                    </span>
                  )}
                </p>
                <span className="spec-label">Net Gm. MC Rate: ₹{order.netGramMc}/g </span>
                <span className="spec-label">Set MC: ₹{order.setMc} </span>

                {/* Lot Table */}
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
                          {spec === 'PLANE' ? '' : spec}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayLots.map((lot) => (
                        <tr
                          key={lot.size}
                          className={`clickable-row ${tempEdits[order.firestoreId]?.[lot.size] !== undefined ? 'edited-row' : ''
                            }`}
                          onClick={() => openDrawer(order, lot)}
                        >
                          <td>{lot.size}</td>
                          <td>{lot.set}</td>
                          <td>{fmt(lot.grossWt)}</td>
                          <td>{fmt(lot.netWt)}</td>
                          <td>
                            {fmt(lot.avgGrossWt)}-{fmt(lot.avgNetWt)}-
                            {spec === 'PLANE' ? '' : fmt(lot.avgSpecWt)}
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
                        {spec && spec !== 'PLANE' && (
                          <td>({spec}) {fmt(totalGross - totalNet)}</td>
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

        {/* Drawer */}
        {drawerOpen && (
          <div className="drawer-overlay" onClick={() => setDrawerOpen(false)}>
            <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
              <h3>Edit: {selectedVariant?.lot.size} Set :{selectedVariant?.lot.set}</h3>

              <div className="drawer-field">
                <label>Sets</label>
                <input
                  type="number"
                  min="0"
                  value={setCount}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSetCount(val);
                    if (val === '0' || val === '') {
                      setGrossWt('0');
                      setNetWt('0');
                    }
                  }}
                />
              </div>

              <div className="drawer-field">
                <label>Gross Weight (g)</label>
                <input
                  type="number"
                  step="0.001"
                  value={grossWt}
                  disabled={setCount === '0'}
                  onChange={(e) => {
                    const val = e.target.value;
                    setGrossWt(val);
                    const numNet = parseFloat(netWt) || 0;
                    const numGross = parseFloat(val) || 0;
                    if (numNet > numGross) {
                      setNetWt(String(numGross));
                    }
                  }}
                />
              </div>

              <div className="drawer-field">
                <label>Net Weight (g) ≤ Gross</label>
                <input
                  type="number"
                  step="0.001"
                  value={netWt}
                  disabled={setCount === '0'}
                  onChange={(e) => {
                    const val = e.target.value;
                    const numVal = parseFloat(val) || 0;
                    const numGross = parseFloat(grossWt) || 0;
                    if (numVal <= numGross) {
                      setNetWt(val);
                    } else {
                      setNetWt(grossWt);
                    }
                  }}
                />
              </div>

              <div className="drawer-actions">
                <button className="btn-cancel" onClick={() => setDrawerOpen(false)}>
                  Cancel
                </button>
                <button className="btn-apply" onClick={applyDrawerEdits}>
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