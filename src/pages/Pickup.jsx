// pages/AssignedOrders.jsx
import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useSeller } from '../contexts/SellerContext';
import Header from '../components/Header';
import './Pickup.css';

const Pickup = () => {
  const { seller } = useSeller();
  const sellerId = seller?.sellerId;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jreMap, setJreMap] = useState({}); // Cache for JRE names

  // Fetch assigned orders
  useEffect(() => {
    const fetchAssignedOrders = async () => {
      if (!sellerId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const q = query(
          collection(db, 'orderList'),
          where('sellerId', '==', sellerId),
          where('orderStatus', '==', 'Assigned')
        );
        const snapshot = await getDocs(q);

        const fetchedOrders = [];
        const jreIds = new Set();

        snapshot.forEach((docSnap) => {
          const orderData = docSnap.data();
          fetchedOrders.push({
            id: docSnap.id,
            ...orderData,
          });
          if (orderData.jreId) {
            jreIds.add(orderData.jreId);
          }
        });

        // Fetch JRE details in batch
        const jreDetails = {};
        for (const jreId of jreIds) {
          const jreDoc = await getDoc(doc(db, 'jreStatus', jreId));
          if (jreDoc.exists()) {
            jreDetails[jreId] = jreDoc.data().vehicleNumber || jreId;
          } else {
            jreDetails[jreId] = jreId;
          }
        }
        setJreMap(jreDetails);
        setOrders(fetchedOrders);
      } catch (err) {
        console.error('Error fetching assigned orders:', err);
        setError('Failed to load assigned orders.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedOrders();
  }, [sellerId]);

  // Format weight with unit
  const formatWeight = (order) => {
    const weight = order.orderWeight || order.grossWt;
    return weight ? `${parseFloat(weight).toFixed(2)}g` : 'N/A';
  };

  // Get quantity (pieces)
  const getQuantity = (order) => {
    return order.orderPiece ? parseInt(order.orderPiece) : 1;
  };

  // Get size info (if available)
  const getSizeInfo = (order) => {
    if (order.size) return order.size;
    if (order.moqSet) return `Set ${order.moqSet}`;
    return 'N/A';
  };

  if (loading) {
    return (
      <>
        <Header title="Assigned Orders" />
        <div className="assigned-container">Loading...</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header title="Assigned Orders" />
        <div className="assigned-container">
          <p className="error">{error}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Assigned Orders" />

      <div className="assigned-container">
        {orders.length === 0 ? (
          <div className="no-orders">
            <p>No orders have been assigned to JREs yet.</p>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => {
              const imageUrl = order.images?.[0]?.url?.trim();
              return (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div className="order-image">
                      {imageUrl ? (
                        <img src={imageUrl} alt={order.productName} />
                      ) : (
                        <div className="image-placeholder">No Image</div>
                      )}
                    </div>
                    <div className="order-info">
                      <h3 className="product-name">{order.productName}</h3>
                      <p className="category">{order.category}</p>
                    </div>
                  </div>

                  <div className="order-details">
                    <div className="detail-row">
                      <span className="label">Quantity:</span>
                      <span className="value">{getQuantity(order)} pcs</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Size:</span>
                      <span className="value">{getSizeInfo(order)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Weight:</span>
                      <span className="value">{formatWeight(order)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Assigned JRE:</span>
                      <span className="value jre-id">
                        {jreMap[order.jreId] || order.jreId || 'N/A'}
                      </span>
                    </div>
                    {order.assignedAt && (
                      <div className="detail-row">
                        <span className="label">Assigned At:</span>
                        <span className="value">
                          {order.assignedAt.toDate().toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default Pickup;
