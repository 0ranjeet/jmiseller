// pages/AssignedOrders.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  writeBatch,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useSeller } from '../contexts/SellerContext';
import Header from '../components/Header';
import './Pickup.css';
import { ChevronDown, ChevronUp, Package, Phone, Shield, Truck } from 'lucide-react';
import bcrypt from 'bcryptjs';

// Constants
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const USE_CASE_SECURE_DISPATCH = 'SECURE_DISPATCH';

// Utility functions
const formatDate = (dateValue) => {
  if (!dateValue) return 'N/A';
  const date = dateValue?.seconds ? new Date(dateValue.seconds * 1000) : new Date(dateValue);
  return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
};

const formatWeight = (weight) => weight ? `${parseFloat(weight).toFixed(2)}g` : 'N/A';

const getQuantity = (order) => order.orderPiece ? parseInt(order.orderPiece) : 1;

const parseNumber = (value) => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

const Payment = () => {
  const { seller } = useSeller();
  const sellerId = seller?.sellerId;

  // State
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [jreMap, setJreMap] = useState({});

  // Secure Dispatch OTP states
  const [secureDispatchModal, setSecureDispatchModal] = useState(null);
  const [dispatchOtp, setDispatchOtp] = useState('');
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Order calculations
  const calculateOrderMetrics = useCallback((order) => {
    const totalWastage = parseNumber(order.purity) + parseNumber(order.wastage) + parseNumber(order.specificationMC);
    const setMc = parseNumber(order.setMc);
    const gramMcPerGram = parseNumber(order.netGramMc);
    const specWt = parseNumber(order.specificationWt);
    const specMcPerGram = parseNumber(order.specificationGramRate);

    const totalAmount = setMc + (gramMcPerGram * parseNumber(order.netWt)) + (specMcPerGram * specWt);
    const fineWeight = (parseNumber(order.netWt) * totalWastage) / 100;

    return {
      fineWeight: parseFloat(fineWeight.toFixed(3)),
      totalMc: parseFloat(totalAmount.toFixed(2)),
    };
  }, []);

  const calculateDispatchSummary = useCallback((group) => ({
    totalItems: group.totalItems,
    totalGrossWeight: parseFloat(group.orders.reduce((sum, order) => 
      sum + parseNumber(order.grossWt || order.netWt), 0).toFixed(3)),
    totalPackets: group.orders.length,
  }), []);

 

  // Preload JREs when orders load
  

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

  // Fetch Paymnet
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
          where('orderStatus', '==', 'Delivered')
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

  // Phone call handler
  const makePhoneCall = (phoneNumber, e) => {
    if (e) e.stopPropagation();
    if (!phoneNumber) {
      alert('No phone number available');
      return;
    }
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.length < 10) {
      alert('Invalid phone number');
      return;
    }
    window.location.href = `tel:${cleanNumber}`;
  };

  // Toggle accordion
  const toggleGroup = useCallback((groupKey) => {
    setExpandedGroup(current => current === groupKey ? null : groupKey);
  }, []);

  // ✅ Secure Dispatch: Send OTP
  const sendSecureDispatchOtp = async (group) => {
    const jreMobile = group.jrePrimaryMobile;
    if (!jreMobile) {
      alert('JRE mobile number not available for secure dispatch.');
      return;
    }

    const cleanMobile = jreMobile.toString().replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      alert(`Invalid JRE mobile: ${jreMobile}. Must be 10 digits.`);
      return;
    }

    setDispatchLoading(true);

    try {
      const plainOtp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Use a simpler approach for bcrypt in client-side
      const salt = await bcrypt.genSalt(10);
      const hashedOtp = await bcrypt.hash(plainOtp, salt);
      
      const otpId = `+91${cleanMobile}_${USE_CASE_SECURE_DISPATCH}`;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

      const summary = calculateDispatchSummary(group);
      const message = `
Secure Dispatch OTP: ${plainOtp}
Operator: ${group.operatorId}
Total Packets: ${summary.totalPackets}
Total Items: ${summary.totalItems}
Gross Weight: ${summary.totalGrossWeight}g
Valid for ${OTP_EXPIRY_MINUTES} minutes.
      `.trim();

      await setDoc(doc(db, "otps", otpId), {
        mobile: cleanMobile,
        otp: hashedOtp,
        useCase: USE_CASE_SECURE_DISPATCH,
        status: "pending",
        createdAt: now,
        expiresAt,
        message,
        sentByAdmin: false,
        dispatchDetails: {
          groupKey: group.groupKey,
          operatorId: group.operatorId,
          jreId: group.jreId,
          ordersCount: group.orders.length,
          totalItems: summary.totalItems,
          totalWeight: summary.totalGrossWeight,
          totalPackets: summary.totalPackets,
        }
      });

      setSecureDispatchModal({
        groupKey: group.groupKey,
        groupData: group,
        otpId,
        jreMobile: cleanMobile,
      });

      // DEV ONLY: Show OTP in alert
      alert(`✅ OTP ${plainOtp} generated for JRE ${cleanMobile}\nShare via WhatsApp.`);
    } catch (err) {
      console.error('Error sending Secure Dispatch OTP:', err);
      alert('Failed to generate OTP. Please try again.');
    } finally {
      setDispatchLoading(false);
    }
  };

  // ✅ Secure Dispatch: Verify OTP - FIXED VERSION
  const verifyDispatchOtp = async () => {
  if (!secureDispatchModal) {
    setOtpError('No secure dispatch session found');
    return;
  }

  if (dispatchOtp.length !== OTP_LENGTH || !/^\d{6}$/.test(dispatchOtp)) {
    setOtpError('Please enter a valid 6-digit OTP');
    return;
  }

  setDispatchLoading(true);
  setOtpError('');

  try {
    const { otpId, groupData } = secureDispatchModal;
    const otpRef = doc(db, "otps", otpId);
    const otpSnap = await getDoc(otpRef);

    if (!otpSnap.exists()) {
      setOtpError('OTP not found or expired. Please generate a new one.');
      return;
    }

    const data = otpSnap.data();
    const now = new Date();

    // Check expiration
    if (data.expiresAt && now > data.expiresAt.toDate()) {
      setOtpError('OTP has expired. Please generate a new one.');
      await deleteDoc(otpRef);
      return;
    }

    // Check if already verified
    if (data.status === "verified") {
      setOtpError('This OTP has already been used.');
      return;
    }

    // Verify OTP
    const isValid = await bcrypt.compare(dispatchOtp, data.otp);
    if (!isValid) {
      setOtpError('Invalid OTP. Please check and try again.');
      return;
    }

    // Update OTP status and orders in a batch
    const batch = writeBatch(db);
    
    // Mark OTP as verified
    batch.update(otpRef, {
      status: "verified",
      verifiedAt: new Date(),
      verifiedBy: sellerId,
    });

    // ✅ FIXED: Get the actual document IDs for orders
    // First, let's fetch the actual orders to get their document IDs
    const ordersQuery = query(
      collection(db, 'orderList'),
      where('sellerId', '==', sellerId),
      where('orderStatus', '==', 'Assigned'),
      where('jreId', '==', groupData.jreId),
      where('operatorId', '==', groupData.operatorId)
    );

    const ordersSnapshot = await getDocs(ordersQuery);
    
    if (ordersSnapshot.empty) {
      setOtpError('No Paymnet found for this group.');
      return;
    }

    // Update all orders in the group using actual document IDs
    ordersSnapshot.docs.forEach((orderDoc) => {
      const orderRef = doc(db, 'orderList', orderDoc.id);
      batch.update(orderRef, {
        orderStatus: 'PickedUp',
        pickedUpAt: new Date(),
        pickedUpBy: groupData.jreId,
        verifiedBy: sellerId,
        otpVerified: true,
        otpReference: otpId,
      });
    });

    // Commit all changes
    await batch.commit();

    // Update local state by filtering out the picked up orders
    // We need to identify which orders to remove based on the same criteria
    setOrders(prev => prev.filter(order => 
      !(order.jreId === groupData.jreId && 
        order.operatorId === groupData.operatorId && 
        order.orderStatus === 'Assigned')
    ));

    alert(`✅ ${ordersSnapshot.size} orders marked as Picked Up!`);
    setSecureDispatchModal(null);
    setDispatchOtp('');
    setExpandedGroup(null);
    
  } catch (err) {
    console.error('Error verifying OTP:', err);
    setOtpError('Verification failed. Please try again.');
  } finally {
    setDispatchLoading(false);
  }
};

  // UI Components
  const OrderItem = ({ order }) => {
    const imageUrl = order.images?.[0]?.url?.trim();
    const orderWeight = formatWeight(order.orderWeight || order.grossWt || order.netWt);

    return (
      <div className="order-item">
        <div className="item-image">
          {imageUrl ? (
            <img src={imageUrl} alt={order.productName || 'Product'} />
          ) : (
            <div className="image-placeholder">No Image</div>
          )}
        </div>
        <div className="item-details">
          <h4 className="item-name">{order.productName || 'Unnamed Product'}</h4>
          <div className="item-specs">
            <span className="purity">{order.category || 'N/A'}</span>
            <span className="weight">• {orderWeight}</span>
            <span className="quantity">• Qty {getQuantity(order)}</span>
          </div>
          <div className="item-metrics">
            <span>Fine Wt: {order.fineWeight.toFixed(3)}g</span>
            <span>MC: ₹{order.totalMc.toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  };

  const GroupCard = ({ group }) => {
    const isExpanded = expandedGroup === group.groupKey;
    const dispatchSummary = calculateDispatchSummary(group);

    const renderPhoneSection = (label, number) => {
      if (!number) return null;
      return (
        <button 
          className="call-btn"
          onClick={(e) => makePhoneCall(number, e)}
          title={`Call ${label}`}
        >
          <Phone size={14} />
        </button>
      );
    };

    return (
      <div className="seller-order-card">
        <div className="seller-header clickable" onClick={() => toggleGroup(group.groupKey)}>
          <div className="seller-info">
            <div className="seller-name">
              <strong>Operator: {group.operatorId}</strong>
              {renderPhoneSection("JRE", group.jreOperatorNumber)}
            </div>
            
            <div className="jre-info">
              <strong>JRE: {group.jreId}</strong>
              {renderPhoneSection("Operator", group.jrePrimaryMobile)}
            </div>
            
            <p className="order-count">
              {group.totalItems} items • Assigned {formatDate(group.orders[0]?.assignedAt)}
            </p>
          </div>
          <span className="accordbtn">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </span>
          <div className="order-summary">
            <span className="fine-weight">Fine Wt: {group.totalFineWeight.toFixed(3)}g</span>
            <span className="total-mc">MC: ₹{group.totalMc.toFixed(2)}</span>
          </div>
        </div>

        {/* Secure Dispatch Section */}
        <div className="secure-dispatch-section">
          <button
            className={`secure-dispatch-btn ${dispatchLoading ? 'loading' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              sendSecureDispatchOtp(group);
            }}
            disabled={!group.jrePrimaryMobile || dispatchLoading}
          >
            <Shield size={16} />
            Secure Dispatch
            <Truck size={16} />
          </button>
          <div className="dispatch-summary">
            <span><Package size={14} /> {dispatchSummary.totalPackets} Packets</span>
            <span>{dispatchSummary.totalItems} Items</span>
            <span>{dispatchSummary.totalGrossWeight}g Gross</span>
          </div>
        </div>

        {isExpanded && (
          <>
            <div className="divider"></div>
            <div className="order-items">
              {group.orders.map((order) => (
                <OrderItem key={order.id} order={order} />
              ))}
            </div>
          </>
        )}
      </div>
    );
  };


  if (loading) {
    return (
      <div className="orders-container">
        <Header title="Paymnet" />
        <div className="loading-state">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-container">
        <Header title="Paymnet" />
        <div className="error-state">
          <p className="error">{error}</p>
          <button onClick={() => window.location.reload()} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header title="Paymnet" />
      <div className="orders-container">
        <div className="orders-header">
          <p>{orders.length} assigned order{orders.length !== 1 ? 's' : ''} found</p>
        </div>

        {orders.length === 0 ? (
          <div className="empty-state">
            <p>No Paymnet found</p>
          </div>
        ) : (
          <div className="seller-orders-container">
            {ordersByOperatorAndJRE.map((group) => (
              <GroupCard key={group.groupKey} group={group} />
            ))}
          </div>
        )}
      </div>

     
    </>
  );
};

export default React.memo(Payment);