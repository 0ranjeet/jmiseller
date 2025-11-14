// pages/AssignedOrders.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useSeller } from '../contexts/SellerContext';
import Header from '../components/Header';
import './Pickup.css';
import { useOrderOperations } from '../hooks/useOrderOperations';
import { useJREFetcher } from '../hooks/useJREFetcher';
import { OrderGroupList } from '../components/OrderGroupList';
import { LoadingState, ErrorState, EmptyState } from '../components/UIStates';

// Constants
export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 10;
export const USE_CASE_SECURE_DISPATCH = 'SECURE_DISPATCH';

const Payment = () => {
  const { seller } = useSeller();
  const sellerId = seller?.sellerId;

  // State
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedGroup, setExpandedGroup] = useState(null);

  // Secure Dispatch state
  const [secureDispatchModal, setSecureDispatchModal] = useState(null);

  // Custom hooks
  const { jreMap, fetchJREData } = useJREFetcher();
  const { calculateOrderMetrics, calculateDispatchSummary } = useOrderOperations();

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
          where('orderStatus', 'in', ['buyerPaid', 'paymentDispatchedtoOperator','paymentDispatchedtoSeller','paymentDeliveredToSeller'])
        );

        const snapshot = await getDocs(q);
        const fetchedOrders = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setOrders(fetchedOrders);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedOrders();
  }, [sellerId]);

  // Preload JREs when orders load
  useEffect(() => {
    if (orders.length > 0) {
      const jreIds = [...new Set(
        orders
          .map(o => o.jreId)
          .filter(id => id && id !== 'No JRE')
      )];
      jreIds.forEach(fetchJREData);
    }
  }, [orders, fetchJREData]);

  // Group orders with JRE numbers
  const ordersByOperatorAndJRE = useMemo(() => {
    const grouped = {};

    orders.forEach((order) => {
      const operatorId = order.operatorId || 'Unknown Operator';
      const jreId = order.jreId || 'No JRE';
      const groupKey = `${operatorId}_${jreId}`;

      const jreInfo = jreMap[jreId] || { primaryMobile: null, operatorNumber: null };

      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          groupKey,
          operatorId,
          jreId,
          jrePrimaryMobile: jreInfo.primaryMobile,
          jreOperatorNumber: jreInfo.operatorNumber,
          orders: [],
          totalItems: 0,
          totalFineWeight: 0,
          totalMc: 0,
        };
      }

      const metrics = calculateOrderMetrics(order);
      grouped[groupKey].orders.push({ ...order, ...metrics });
      grouped[groupKey].totalItems += getQuantity(order);
      grouped[groupKey].totalFineWeight += metrics.fineWeight;
      grouped[groupKey].totalMc += metrics.totalMc;
    });

    return Object.values(grouped);
  }, [orders, calculateOrderMetrics, jreMap]);

  // Toggle accordion
  const toggleGroup = useCallback((groupKey) => {
    setExpandedGroup(current => current === groupKey ? null : groupKey);
  }, []);

  if (loading) return <LoadingState title="Assigned Orders" />;
  if (error) return <ErrorState title="Assigned Orders" error={error} />;

  return (
    <>
      <Header title="Assigned Orders" />
      <div className="orders-container">
        <div className="orders-header">
          <p>{orders.length} assigned order{orders.length !== 1 ? 's' : ''} found</p>
        </div>

        {orders.length === 0 ? (
          <EmptyState message="No assigned orders found" />
        ) : (
          <OrderGroupList
            groups={ordersByOperatorAndJRE}
            expandedGroup={expandedGroup}
            onToggleGroup={toggleGroup}
            onSecureDispatch={setSecureDispatchModal}
            calculateDispatchSummary={calculateDispatchSummary}
          />
        )}
      </div>

    
    </>
  );
};

// Utility functions
const getQuantity = (order) => order.orderPiece ? parseInt(order.orderPiece) : 1;

export default React.memo(Payment);