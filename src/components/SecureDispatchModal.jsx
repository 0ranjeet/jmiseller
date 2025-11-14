import React, { useState } from 'react';
import { useOTPVerification } from '../hooks/useOTPVerification';

export const SecureDispatchModal = ({ modal, onClose, sellerId, onOrdersUpdate }) => {
  const [dispatchOtp, setDispatchOtp] = useState('');
  const { verifyDispatchOtp, dispatchLoading, otpError, setOtpError } = useOTPVerification();

  if (!modal) return null;

  const handleVerify = async () => {
    const success = await verifyDispatchOtp(modal, dispatchOtp, sellerId);
    if (success) {
      onOrdersUpdate(prev => prev.filter(order =>
        !(order.jreId === modal.groupData.jreId &&
          order.operatorId === modal.groupData.operatorId &&
          order.orderStatus === 'Assigned')
      ));
      onClose();
      setDispatchOtp('');
    }
  };

  const handleOtpChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setDispatchOtp(val);
    setOtpError('');
  };

  return (
    <div className="modal-overlay active">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Verify Dispatch OTP</h3>
        </div>

        <div className="modal-body">
          <p className="otp-instruction">
            Enter the 6-digit OTP sent to JRE: <strong>+91 {modal.jreMobile}</strong>
          </p>

          <div className="otp-input-section">
            <input
              key="dispatch-otp-input"
              type="text"
              value={dispatchOtp}
              onChange={handleOtpChange}
              placeholder="000000"
              maxLength={6}
              className={`otp-input ${otpError ? 'error' : ''}`}
              disabled={dispatchLoading}
            />
            {otpError && <div className="error-message">{otpError}</div>}
          </div>

          <div className="dispatch-info">
            <p><strong>Dispatch Summary:</strong></p>
            <p>Operator: {modal.groupData.operatorId}</p>
            <p>Packets: {modal.groupData.orders.length}</p>
            <p>Items: {modal.groupData.totalItems}</p>
          </div>
        </div>

        <div className="modal-actions">
          <button
            onClick={onClose}
            disabled={dispatchLoading}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            disabled={dispatchLoading || dispatchOtp.length !== 6}
            className="btn btn-primary"
          >
            {dispatchLoading ? 'Verifying...' : 'Confirm Pickup'}
          </button>
        </div>
      </div>
    </div>
  );
};