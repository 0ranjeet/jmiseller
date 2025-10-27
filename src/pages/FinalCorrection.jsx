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

  // Helper: Get all sizes that need editing
  const getRequiredSizes = (order) => {
    if (order.Lot && order.lotDetails?.length > 0) {
      return order.lotDetails.map(l => l.size);
    }
    // Non-lot: use the single size from `sizes`
    return order.sizes && order.sizes.length > 0 ? [order.sizes[0]] : [];
  };

  // Helper: Check if all required sizes have been edited
  const areAllLotsEdited = (orderId, order) => {
    const requiredSizes = getRequiredSizes(order);
    const edits = tempEdits[orderId] || {};
    return requiredSizes.every(size => edits.hasOwnProperty(size));
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

        // Initialize tempEdits from existing orderDetail
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

  // Open drawer to edit a specific size
  const openDrawer = (order, size, lot = null) => {
    const currentEdit = tempEdits[order.firestoreId]?.[size] || {};

    // Gross & Net: edited → lot → 0
    const defaultGross = currentEdit.grossWt !== undefined
      ? currentEdit.grossWt
      : parseFloat(lot?.grossWt || order.grossWt) || 0;

    const defaultNet = currentEdit.netWt !== undefined
      ? currentEdit.netWt
      : parseFloat(lot?.netWt || order.netWt) || 0;

    // Sets: edited → selectedVariants → lot.set → 0
    let defaultSet;
    if (currentEdit.set !== undefined) {
      defaultSet = currentEdit.set;
    } else {
      const orderedVariant = order.selectedVariants?.find(v => v.size === size);
      defaultSet = orderedVariant ? parseInt(orderedVariant.quantity) || 0 : parseInt(lot?.set) || 0;
    }

    setSelectedVariant({ order, size });
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

  const handleMarkAsRTD = async (orderId) => {
    const order = orders.find(o => o.firestoreId === orderId);
    if (!order) return;

    if (!areAllLotsEdited(orderId, order)) {
      alert('Please edit all lot variants before marking as RTD.');
      return;
    }

    const edits = tempEdits[orderId] || {};
    setSavingOrderId(orderId);

    try {
      const orderRef = doc(db, 'orderList', orderId);
      await updateDoc(orderRef, {
        orderDetail: edits,
        orderStatus: 'RTD',
        buyerConfirmation: false,
        updatedAt: new Date(),
      });

      const ProductRef = doc(db, 'products', order.id);
      const productUpdate = {};

      if (order.Lot) {
        // Lot product: update lotDetails with averages
        const finalLotDetails = order.lotDetails.map(lot => {
          const size = lot.size;
          const edit = edits[size] || {};
          const setVal = edit.set !== undefined ? edit.set : parseInt(lot.set) || 0;
          const gross = edit.grossWt !== undefined ? edit.grossWt : parseFloat(lot.grossWt) || 0;
          const net = edit.netWt !== undefined ? edit.netWt : parseFloat(lot.netWt) || 0;

          const avgGross = setVal > 0 ? gross / setVal : 0;
          const avgNet = setVal > 0 ? net / setVal : 0;
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

        const totalSets = finalLotDetails.reduce((sum, l) => sum + parseInt(l.set), 0);
        const totalGross = finalLotDetails.reduce((sum, l) => sum + parseFloat(l.grossWt), 0);
        const totalNet = finalLotDetails.reduce((sum, l) => sum + parseFloat(l.netWt), 0);

        productUpdate.lotDetails = finalLotDetails;
        productUpdate.instockSet = String(totalSets);
        productUpdate.instockGram = totalGross.toFixed(3);
        productUpdate.netWt = totalNet.toFixed(3);
      }
      else {
        // Non-lot: single size from `sizes[0]`
        const size = order.sizes?.[0] || 'N/A';
        const edit = edits[size] || {};

        // Get ordered quantity from selectedVariants
        const orderedVariant = order.selectedVariants?.find(v => v.size === size);
        const orderedQty = orderedVariant ? parseInt(orderedVariant.quantity) || 0 : 0;

        const setVal = edit.set !== undefined ? edit.set : orderedQty;
        const gross = edit.grossWt !== undefined ? edit.grossWt : parseFloat(order.grossWt) || 0;
        const net = edit.netWt !== undefined ? edit.netWt : parseFloat(order.netWt) || 0;

        productUpdate.instockSet = String(setVal);
        productUpdate.instockGram = gross.toFixed(3);
        productUpdate.netWt = net.toFixed(3);
      }

      await updateDoc(ProductRef, productUpdate);

      // Update UI
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
            Click a row to edit lot details. You must edit <strong>all variants</strong> before clicking{' '}
            <strong>“Mark as RTD”</strong>.
          </p>
        </div>

        {orders.length === 0 ? (
          <p className="no-orders">No orders need final correction.</p>
        ) : (
          orders.map((order) => {
            const imageUrl = order.images?.[0]?.url?.trim();
            const allEdited = areAllLotsEdited(order.firestoreId, order);
            const spec = order.specification;

            const orderedQtyBySize = {};
            (order.selectedVariants || []).forEach(v => {
              orderedQtyBySize[v.size] = parseInt(v.quantity) || 0;
            });

            // 🔹 Generate display rows
            let displayLots = [];
            if (order.Lot && order.lotDetails?.length > 0) {
              // Lot product
              displayLots = order.lotDetails.map(lot => {
                const size = lot.size;
                const edit = tempEdits[order.firestoreId]?.[size] || {};

                let setVal = edit.set !== undefined
                  ? edit.set
                  : orderedQtyBySize[size] !== undefined
                    ? orderedQtyBySize[size]
                    : parseInt(lot.set) || 0;

                let gross = edit.grossWt !== undefined ? edit.grossWt : parseFloat(lot.grossWt) || 0;
                let net = edit.netWt !== undefined ? edit.netWt : parseFloat(lot.netWt) || 0;

                if (setVal === 0) {
                  gross = 0;
                  net = 0;
                }

                const avgGross = setVal > 0 ? gross / setVal : 0;
                const avgNet = setVal > 0 ? net / setVal : 0;
                const avgSpec = avgGross - avgNet;

                return { size, set: setVal, grossWt: gross, netWt: net, avgGrossWt: avgGross, avgNetWt: avgNet, avgSpecWt: avgSpec };
              });
            } else {
              // Non-lot product: single row using first size
              const size = order.sizes?.[0] || '—';
              const edit = tempEdits[order.firestoreId]?.[size] || {};

              let setVal = edit.set !== undefined
                ? edit.set
                : orderedQtyBySize[size] !== undefined
                  ? orderedQtyBySize[size]
                  : parseInt(order.set) || 0;

              let gross = edit.grossWt !== undefined ? edit.grossWt : parseFloat(order.grossWt) || 0;
              let net = edit.netWt !== undefined ? edit.netWt : parseFloat(order.netWt) || 0;

              if (setVal === 0) {
                gross = 0;
                net = 0;
              }

              const avgGross = setVal > 0 ? gross / setVal : 0;
              const avgNet = setVal > 0 ? net / setVal : 0;
              const avgSpec = avgGross - avgNet;

              displayLots = [{ size, set: setVal, grossWt: gross, netWt: net, avgGrossWt: avgGross, avgNetWt: avgNet, avgSpecWt: avgSpec }];
            }

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

                {/* Ordered Summary */}
                {order.selectedVariants?.length > 0 && (
                  <p className="spec-label">
                    <strong>Ordered:</strong> {order.selectedVariants.map(v => `${v.size} (${v.quantity})`).join(', ')}
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
                          className={`clickable-row ${tempEdits[order.firestoreId]?.[lot.size] !== undefined ? 'edited-row' : ''}`}
                          onClick={() => openDrawer(order, lot.size, order.lotDetails?.find(l => l.size === lot.size) || null)}
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
              <h3>Edit: {selectedVariant?.size}</h3>

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