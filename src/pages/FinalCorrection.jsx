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
import './FinalCorrection.css';

const FinalCorrection = () => {
  const { seller } = useSeller();
  const sellerId = seller?.sellerId;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Fetch orders with Assortment status
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
          const orderData = docSnap.data();
          fetchedOrders.push({
            firestoreId: docSnap.id,
            orderWeight: orderData.grossWt || '', // Default to original weight
            orderPiece: Array.isArray(orderData.selectedVariants) 
              ? orderData.selectedVariants.reduce((sum, v) => sum + (v.quantity || 0), 0)
              : 1, // Default quantity
            ...orderData,
          });
        });

        setOrders(fetchedOrders);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders for final correction.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [sellerId]);

  // Handle weight change
  const handleWeightChange = (orderId, newWeight) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.firestoreId === orderId 
          ? { ...order, orderWeight: newWeight } 
          : order
      )
    );
  };

  // Handle quantity change
  const handleQuantityChange = (orderId, newQuantity) => {
    const quantity = Math.max(1, parseInt(newQuantity) || 1);
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.firestoreId === orderId 
          ? { ...order, orderPiece: quantity } 
          : order
      )
    );
  };

  // Handle save changes
  const handleSaveChanges = async (orderId) => {
    setSaving(true);
    
    try {
      const order = orders.find(o => o.firestoreId === orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const orderRef = doc(db, 'orderList', orderId);
      await updateDoc(orderRef, {
        orderWeight: order.orderWeight,
        orderPiece: order.orderPiece,
        orderStatus: 'RTD', // Update status to RTD
        updatedAt: new Date(),
      });

      // Remove the order from local state after successful save
      setOrders(prevOrders => 
        prevOrders.filter(o => o.firestoreId !== orderId)
      );

      alert('✅ Changes saved successfully! Order moved to RTD.');
    } catch (err) {
      console.error('Error saving changes:', err);
      alert(`❌ Failed to save changes: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header title="Final Correction" />
        <div className="final-correction-container">Loading...</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header title="Final Correction" />
        <div className="final-correction-container">
          <p className="error">{error}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Final Correction" />
      
      <div className="final-correction-container">
        <div className="instruction">
          <p>You can update only: <strong>Weight (g)</strong> and <strong>Quantity (pcs)</strong></p>
        </div>

        {orders.length === 0 ? (
          <p className="no-orders">No orders need final correction.</p>
        ) : (
          orders.map((order) => {
            const productType = order.productName || 'Product';
            const designType = order.specification || 'Design';
            const imageUrl = order.images?.[0]?.url?.trim();
            const setInfo = order.moqSet ? `Set ${order.moqSet}/${order.moqSet}` : '';
            const sku = order.selectedProductId ? `SKU: ${order.selectedProductId.substring(0, 8)}` : '';
            
            const purity = order.purity || '916 HUID';
            const type = order.productSource || 'Machine Made';
            
            // Determine metal type and rate based on category
            const isSilver = order.category === '925SILV';
            const metalType = isSilver ? 'Silver' : 'Gold';
            const metalRate = isSilver ? (order.silverRate || '85') : (order.goldRate || '6,345');
            const makingCharge = order.makingCharge || (isSilver ? '200' : '760');

            return (
              <div key={order.firestoreId} className="correction-card">
                 <div className="order-image">
                    {imageUrl ? (
                      <img src={imageUrl} alt={order.productName} />
                    ) : (
                      <div className="image-placeholder">No Image</div>
                    )}
                  </div>
                <div className="product-header">
                  <h3>{productType} – {designType}</h3>
                  <p>{purity} • {type} • {setInfo}</p>
                  <p className="sku">{sku}</p>
                </div>

                <div className="correction-fields">
                  <div className="field-group">
                    <label>Weight (g)</label>
                    <div className="number-input">
                      <button 
                        type="button"
                        onClick={() => handleWeightChange(order.firestoreId, (parseFloat(order.orderWeight) - 0.1).toFixed(3))}
                      >−</button>
                      <input
                        type="number"
                        step="0.001"
                        value={order.orderWeight}
                        onChange={(e) => handleWeightChange(order.firestoreId, e.target.value)}
                      />
                      <button 
                        type="button"
                        onClick={() => handleWeightChange(order.firestoreId, (parseFloat(order.orderWeight) + 0.1).toFixed(3))}
                      >+</button>
                    </div>
                  </div>

                  <div className="field-group">
                    <label>Qty (pcs)</label>
                    <div className="number-input">
                      <button 
                        type="button"
                        onClick={() => handleQuantityChange(order.firestoreId, order.orderPiece - 1)}
                      >−</button>
                      <input
                        type="number"
                        min="1"
                        value={order.orderPiece}
                        onChange={(e) => handleQuantityChange(order.firestoreId, e.target.value)}
                      />
                      <button 
                        type="button"
                        onClick={() => handleQuantityChange(order.firestoreId, order.orderPiece + 1)}
                      >+</button>
                    </div>
                  </div>
                </div>

                <div className="product-details">
                  <p>Purity: {purity} • Type: {type}</p>
                  <p>{metalType} Rate: ₹{metalRate}/g • Making: ₹{makingCharge}</p>
                </div>

                <button
                  className="save-btn"
                  onClick={() => handleSaveChanges(order.firestoreId)}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            );
          })
        )}
      </div>
    </>
  );
};

export default FinalCorrection;