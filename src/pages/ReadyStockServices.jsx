import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
} from 'lucide-react';
import './ReadyStockServices.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useSeller } from '../contexts/SellerContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useNavigate } from 'react-router-dom';

const ReadyStockServices = () => {
  const { seller } = useSeller();
  const sellerId = seller?.sellerId;
  const navigate = useNavigate();
  const serviceType = 'ready';
  const [orderCounts, setOrderCounts] = useState({
    requested: 0,
    assortment: 0,
    finalCorrection: 0,
    readyToDispatch: 0,
    delivery: 0,
    payment: 0,
  });
  const [loading, setLoading] = useState(true);
  // Fetch and count orders by status
  useEffect(() => {
    const fetchOrderCounts = async () => {
      if (!sellerId) return;

      try {
        setLoading(true);
        const q = query(collection(db, 'orderList'), where('sellerId', '==', sellerId), where('serviceType', '==', 'ready'));
        const snapshot = await getDocs(q);
         console.log(snapshot);
        const counts = {
          requested: 0,
          assortment: 0,
          finalCorrection: 0,
          readyToDispatch: 0,
          Assigned: 0,
          payment: 0,
        };

        snapshot.forEach((doc) => {
          const data = doc.data();
          const status = data.orderStatus;

          switch (status) {
            case 'Requested':
              counts.requested += 1;
              break;
            case 'Assortment':
              counts.assortment += 1;
              break;
            case 'Assorted':
              counts.finalCorrection += 1;
              break;
            case 'RTD':
              counts.readyToDispatch += 1;
              break;
            case 'Assigned':
              case 'PickedUp':
            case 'InWarehouse':
              counts.Assigned += 1;
              break;
            case 'Delivered':
              counts.payment += 1;
              break;
            default:
              break;
          }
        });
        setOrderCounts(counts);
        console.log(counts);
      } catch (error) {
        console.error('Error fetching order counts:', error);
        // Optionally show toast or fallback counts
      } finally {
        setLoading(false);
      }
    };

    fetchOrderCounts();
  }, [sellerId]);

  // Calculate totals
  const totalOrders = Object.values(orderCounts).reduce((sum, count) => sum + count, 0);
  const completedStages = ['readyToDispatch', 'Assigned', 'payment'];
  const completedCount = completedStages.reduce(
    (sum, key) => sum + orderCounts[key],
    0
  );
  const pendingCount = totalOrders - completedCount;
  // Workflow Steps (now dynamic)
  const steps = [
    {
      id: 1,
      title: 'Buyer Requests',
      subtitle: 'New incoming enquiries',
      count: orderCounts.requested,
      color: 'yellow',
      path: '/buyerrequset',
    },
    {
      id: 2,
      title: 'Assortment',
      subtitle: 'Shortlist & curate products',
      count: orderCounts.assortment,
      color: 'blue',
      path: '/assortment',
    },
    {
      id: 3,
      title: 'Final Correction',
      subtitle: 'Confirm specs & edits',
      count: orderCounts.finalCorrection,
      color: 'orange',
      path: '/finalcorrection',
    },
    {
      id: 4,
      title: 'Ready to Dispatch',
      subtitle: 'Packed & awaiting pickup',
      count: orderCounts.readyToDispatch,
      color: 'green',
      path: '/rtd'
    },
    {
      id: 5,
      title: 'Assigned',
      subtitle: 'In transit to buyer',
      count: orderCounts.Assigned,
      color: 'light-blue',
      path: '/Assigned',
    },
    {
      id: 6,
      title: 'Payment',
      subtitle: 'Invoices & receipts',
      count: orderCounts.payment,
      color: 'purple',
      path: '/payment'
    },
  ];

  if (loading) {
    return (
      <>
        <Header title="Ready Stock Services" />
        <div className="overview-container">
          <div className="overview-card">
            <h2 className="overview-title">Loading...</h2>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header title="Ready Stock Services" />

      {/* Overview Stats */}
      <div className="overview-container">
        <div className="overview-card">
          <h2 className="overview-title">Today's Overview</h2>
          <div className="overview-stats">
            <div className="stat-item">
              <div className="stat-value">{totalOrders}</div>
              <div className="stat-label">Total Orders</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{completedCount}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{pendingCount}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="serve-container">
        <div className="workflow-steps">
          {steps.map((step, index) => (
            <div key={step.id} className="step-card" onClick={() => {
              navigate(step.path, { state: {  serviceType } })
            }}>
              <div className={`step-line ${step.color}`} />
              <div className="readystep-content">
                <div className={`step-number ${step.color}`}>{step.id}
                </div>
                <div className="step-details">
                  <h3 className="workstep-title">{step.title}</h3>
                  <p className="step-subtitle">{step.subtitle}</p>
                </div>
                <div className="step-count">
                  <span>{step.count}</span>
                  <span className="arrow"><ChevronRight /></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default ReadyStockServices;