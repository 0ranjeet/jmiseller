import React from 'react';
import { ChevronDown, ChevronUp, Package, Phone, Shield, Truck, CheckCircle, Clock, PackageCheck, TruckIcon, CreditCard, DollarSign, UserCheck } from 'lucide-react';
import { OrderItem } from './OrderItem';
import { useSecureDispatch } from '../hooks/useSecureDispatch';
import { formatDate } from '../utils/formatters';

export const OrderGroupCard = React.memo(({ 
  group, 
  isExpanded, 
  onToggle, 
  onSecureDispatch, 
  calculateDispatchSummary 
}) => {
  const dispatchSummary = calculateDispatchSummary(group);
  const { sendSecureDispatchOtp, dispatchLoading } = useSecureDispatch();
  
  // Get the current status from the first order (all orders in group should have same status)
  const currentStatus = group.orders[0]?.orderStatus || 'Assigned';
  
  // Define status steps for Order Flow (Assigned to Delivered)
  const orderStatusSteps = [
    { key: 'Assigned', label: 'Assigned', icon: Clock },
    { key: 'PickedUp', label: 'Picked Up', icon: Package },
    { key: 'InWarehouse', label: 'In Warehouse', icon: PackageCheck },
    { key: 'Dispatched', label: 'Dispatched', icon: TruckIcon },
    { key: 'Delivered', label: 'Delivered', icon: CheckCircle },
  ];

  // Define status steps for Payment Flow (buyerPaid to paymentCompleted)
  const paymentStatusSteps = [
    { key: 'buyerPaid', label: 'Buyer Paid', icon: CreditCard },
    { key: 'paymentDispatchedtoOperator', label: 'Paid to Operator', icon: UserCheck },
    { key: 'paymentDispatchedtoSeller', label: 'Paid to Seller', icon: DollarSign },
    { key: 'paymentDeliveredToSeller', label: 'Payment Completed', icon: CheckCircle }
  ];

  // Determine which flow we're in
  const isOrderFlow = orderStatusSteps.some(step => step.key === currentStatus);
  const isPaymentFlow = paymentStatusSteps.some(step => step.key === currentStatus);
  
  // Get the appropriate steps and current index
  const statusSteps = isOrderFlow ? orderStatusSteps : 
                     isPaymentFlow ? paymentStatusSteps : 
                     orderStatusSteps; // default to order flow
  
  const currentStepIndex = statusSteps.findIndex(step => step.key === currentStatus);
  
  // Check conditions for showing Secure Dispatch
  const showSecureDispatch = currentStatus === 'Assigned';

  const handleSecureDispatch = async (e) => {
    e.stopPropagation();
    const result = await sendSecureDispatchOtp(group);
    if (result) {
      onSecureDispatch(result);
    }
  };

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

  // Render completion badge based on flow
  const renderCompletionBadge = () => {
    if (showSecureDispatch) return null; // Don't show completion badge if Secure Dispatch is shown
    
    const getCompletionDetails = () => {
      if (isOrderFlow) {
        switch (currentStatus) {
          case 'PickedUp':
            return group.orders[0]?.pickedUpAt && `Picked up on ${formatDate(group.orders[0].pickedUpAt)}`;
          case 'InWarehouse':
            return group.orders[0]?.warehouseReceivedAt && `Received in warehouse on ${formatDate(group.orders[0].warehouseReceivedAt)}`;
          case 'Dispatched':
            return group.orders[0]?.dispatchedAt && `Dispatched on ${formatDate(group.orders[0].dispatchedAt)}`;
          case 'Delivered':
            return group.orders[0]?.deliveredAt && `Delivered on ${formatDate(group.orders[0].deliveredAt)}`;
          default:
            return null;
        }
      } else if (isPaymentFlow) {
        switch (currentStatus) {
          case 'paymentReceived':
            return group.orders[0]?.paymentReceivedAt && `Payment received on ${formatDate(group.orders[0].paymentReceivedAt)}`;
          case 'paymentDispatchedtoOperator':
            return group.orders[0]?.paymentDispatchedAt && `Paid to operator on ${formatDate(group.orders[0].paymentDispatchedAt)}`;
          case 'paymentDispatchedtoSeller':
            return group.orders[0]?.paymentToSellerAt && `Paid to seller on ${formatDate(group.orders[0].paymentToSellerAt)}`;
          case 'paymentCompleted':
            return group.orders[0]?.paymentCompletedAt && `Payment completed on ${formatDate(group.orders[0].paymentCompletedAt)}`;
          default:
            return null;
        }
      }
      return null;
    };

    const completionDetails = getCompletionDetails();

    return (
      <div className="completion-badge">
        <div className="completion-status">
          <CheckCircle size={16} />
          <span>
            {isOrderFlow ? 'Order' : 'Payment'} {currentStatus}
          </span>
        </div>
        {completionDetails && (
          <div className="completion-details">
            <span>{completionDetails}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="seller-order-card">
      <div className="seller-header clickable" onClick={() => onToggle(group.groupKey)}>
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
            {group.totalItems} items • {isOrderFlow ? 'Assigned' : 'Buyer Paid'} {formatDate(group.orders[0]?.assignedAt || group.orders[0]?.buyerPaidAt)}
          </p>
          <p className={`status-badge status-${currentStatus.toLowerCase()} ${isPaymentFlow ? 'payment-flow' : 'order-flow'}`}>
            {isPaymentFlow ? 'Payment ' : 'Order '}Status: {currentStatus}
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

      {/* Status Stepper */}
      <div className={`status-stepper ${isPaymentFlow ? 'payment-stepper' : 'order-stepper'}`}>
        {statusSteps.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isUpcoming = index > currentStepIndex;
          
          return (
            <div key={step.key} className={`stepper-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isUpcoming ? 'upcoming' : ''}`}>
              <div className="step-icon">
                {isCompleted ? (
                  <CheckCircle size={16} />
                ) : (
                  <StepIcon size={16} />
                )}
              </div>
              <span className="step-label">{step.label}</span>
              {index < statusSteps.length - 1 && (
                <div className="step-connector"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Secure Dispatch Section - Only show for Assigned status in Order Flow */}
      {showSecureDispatch && (
        <div className="secure-dispatch-section">
          <button
            className={`secure-dispatch-btn ${dispatchLoading ? 'loading' : ''}`}
            onClick={handleSecureDispatch}
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
      )}

      {/* Completion Badge for non-Assigned status */}
      {!showSecureDispatch && renderCompletionBadge()}

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
});

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