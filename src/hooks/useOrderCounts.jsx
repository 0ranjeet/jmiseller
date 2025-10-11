import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

const useOrderCounts = (sellerId, serviceType = null, dependencies = []) => {
  const [orderCounts, setOrderCounts] = useState({
    requested: 0,
    assortment: 0,
    finalCorrection: 0,
    readyToDispatch: 0,
    assigned: 0,
    delivery: 0,
    payment: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderCounts = async () => {
      if (!sellerId) return;

      try {
        setLoading(true);
        setError(null);

        // Build query
        const constraints = [where('sellerId', '==', sellerId)];
        if (serviceType) {
          constraints.push(where('serviceType', '==', serviceType));
        }

        const q = query(collection(db, 'orderList'), ...constraints);
        const snapshot = await getDocs(q);

        const counts = {
          requested: 0,
          assortment: 0,
          finalCorrection: 0,
          readyToDispatch: 0,
          assigned: 0,
          delivery: 0,
          payment: 0
        };

        snapshot.forEach((doc) => {
          const data = doc.data();
          const status = data.orderStatus?.toLowerCase();

          switch (status) {
            case 'requested':
              counts.requested += 1;
              break;
            case 'assortment':
              counts.assortment += 1;
              break;
            case 'assorted':
              counts.finalCorrection += 1;
              break;
            case 'rtd':
              counts.readyToDispatch += 1;
              break;
            case 'assigned':
              counts.assigned += 1;
              break;
            case 'dispatched':
              counts.delivery += 1;
              break;
            case 'payment':
              counts.payment += 1;
              break;
            default:
              break;
          }
        });

        setOrderCounts(counts);
      } catch (err) {
        console.error('Error fetching order counts:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderCounts();
  }, [sellerId, serviceType, ...dependencies]);

  // Calculate derived values
  const totalOrders = Object.values(orderCounts).reduce((sum, count) => sum + count, 0);
  const completedStages = ['readyToDispatch', 'assigned', 'delivery', 'payment'];
  const completedCount = completedStages.reduce(
    (sum, key) => sum + orderCounts[key],
    0
  );
  const pendingCount = totalOrders - completedCount;

  return {
    orderCounts,
    totalOrders,
    completedCount,
    pendingCount,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      // fetchOrderCounts();
    }
  };
};

export default useOrderCounts;