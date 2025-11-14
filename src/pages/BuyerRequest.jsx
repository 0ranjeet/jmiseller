import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useSeller } from '../contexts/SellerContext';
import { useNavigate ,useLocation} from 'react-router-dom';
import './BuyerRequest.css';
import PageHeader from '../components/PageHeader';

const BuyerRequest = () => {
  const { seller } = useSeller();
  const sellerId = seller?.sellerId;
  const navigate = useNavigate();
  const location = useLocation();
  const serviceType = location.state?.serviceType;
  console.log(serviceType);
  const [category, setCategory] = useState('916HUID');
  const [subCategory, setSubCategory] = useState('KATAKI');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Add refresh trigger

  const categories = ['916HUID', '840ORNA', '750HUID', '680'];
  const subCategories = ['KATAKI','RAJKOT', 'MACHINE MADE', 'CASTING', 'CNC', 'KARIGARI'];

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!sellerId) return;

      try {
        setLoading(true);
        const q = query(
          collection(db, 'orderList'),
          where('sellerId', '==', sellerId),
          where('orderStatus', '==', 'Requested'),
          where('serviceType', '==', serviceType)
        );
        const snapshot = await getDocs(q);

        const fetchedOrders = [];
        snapshot.forEach((docSnap) => {
          fetchedOrders.push({
            firestoreId: docSnap.id,  // Store the Firestore document ID
            ...docSnap.data(),
          });
        });
        console.log(fetchedOrders);

        setOrders(fetchedOrders);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load requests.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [sellerId, refreshTrigger]); // Add refreshTrigger to dependencies

  // Handle Accept
  const handleAccept = async (firestoreId) => {
    if (pendingAction) return;
    setPendingAction('accept');

    try {
      const orderRef = doc(db, 'orderList', firestoreId);
      const orderSnap = await getDoc(orderRef);

      if (!orderSnap.exists()) {
        alert('❌ Order not found. It may have been processed or deleted.');
        setOrders((prev) => prev.filter((o) => o.firestoreId !== firestoreId));
        return;
      }

      // Double-check seller ownership
      const data = orderSnap.data();
      if (data.sellerId !== sellerId) {
        alert('❌ Not authorized to accept this order.');
        return;
      }

      await updateDoc(orderRef, {
        orderStatus: 'Assortment',
        updatedAt: new Date(),
      });

      // Instead of updating locally, trigger a refresh
      setRefreshTrigger(prev => prev + 1);
      alert('✅ Order accepted and moved to Assortment!');
    } catch (err) {
      console.error('Error accepting order:', err);
      alert(`❌ Failed to accept order: ${err.message}`);
    } finally {
      setPendingAction(null);
    }
  };

  // Handle Reject
  const handleReject = async (firestoreId) => {
    if (pendingAction) return;

    if (!window.confirm('Are you sure you want to reject this request?')) return;

    setPendingAction('reject');

    try {
      const orderRef = doc(db, 'orderList', firestoreId);
      const orderSnap = await getDoc(orderRef);

      if (!orderSnap.exists()) {
        alert('❌ Order not found.');
        setOrders((prev) => prev.filter((o) => o.firestoreId !== firestoreId));
        return;
      }

      const data = orderSnap.data();
      if (data.sellerId !== sellerId) {
        alert('❌ Unauthorized reject attempt.');
        return;
      }

      await updateDoc(orderRef, {
        orderStatus: 'Rejected',
        updatedAt: new Date(),
      });

      // Instead of updating locally, trigger a refresh
      setRefreshTrigger(prev => prev + 1);
      alert('🚫 Request rejected.');
    } catch (err) {
      console.error('Error rejecting order:', err);
      alert(`❌ Failed to reject: ${err.message}`);
    } finally {
      setPendingAction(null);
    }
  };
  const handleProductClick = (product) => {
    navigate(`/product/${product.id}`, { state: { product } });
  };
  // Helper: total quantity
  const getTotalQuantity = (variants) =>
    Array.isArray(variants)
      ? variants.reduce((sum, v) => sum + (v.quantity || 0), 0)
      : 1;

  // Filter by category & productSource (subCategory)
  const filteredOrders = orders.filter(
    (order) =>
      order.category === category && order.productSource === subCategory
  );

  if (loading) {
    return (
      <>
        <PageHeader title="Ready Services Order Workflow" />
        <div className="workflow-container">Loading...</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title="Ready Services Order Workflow" />
        <div className="workflow-container">
          <p className="error">{error}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Buyer Request" />
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

      {/* Results */}
      <p className="results-count">
        {filteredOrders.length} request{filteredOrders.length !== 1 ? 's' : ''} found
      </p>

      {/* Orders Grid */}
      <div className="orders-grid">
        {filteredOrders.length === 0 ? (
          <p className="no-results">No matching requests.</p>
        ) : (
          filteredOrders.map((order) => {
            const qty = getTotalQuantity(order.selectedVariants);
            const imageUrl = order.images?.[0]?.url?.trim();

            return (
              <div key={order.firestoreId} className="order-card">
                <div className="order-image">
                  {imageUrl ? (
                    <img src={imageUrl} alt={order.productName} onClick={() => handleProductClick(order)} />
                  ) : (
                    <div className="image-placeholder">No Image</div>
                  )}
                </div>

                <div className="order-info">
                  <h5 >{order.category}/{order.productName}</h5>
                  <p>
                    {order.specification}/{order.styleType}
                  </p>
                  {order.selectedVariants?.length > 0 && (
                    <p className="spec-label" >
                      {order.selectedVariants.map((variant, index) => (
                        <span key={variant.size} >
                          {variant.size} x {variant.quantity}
                          {index < order.selectedVariants.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </p>
                  )}
                  <div className="action-btn">
                    <button
                      className="reject-btn"
                      disabled={pendingAction}
                      onClick={() => handleReject(order.firestoreId)}
                      type="button"
                    >
                      Reject
                    </button>
                    <button
                      className="accept-btn"
                      disabled={pendingAction}
                      onClick={() => handleAccept(order.firestoreId)}
                      type="button"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
};

export default BuyerRequest;