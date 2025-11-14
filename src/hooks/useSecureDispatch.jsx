import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import bcrypt from 'bcryptjs';
import { OTP_EXPIRY_MINUTES, USE_CASE_SECURE_DISPATCH } from '../pages/Pickup';

export const useSecureDispatch = () => {
  const [dispatchLoading, setDispatchLoading] = useState(false);

  const sendSecureDispatchOtp = async (group) => {
    const jreMobile = group.jrePrimaryMobile;
    if (!jreMobile) {
      alert('JRE mobile number not available for secure dispatch.');
      return null;
    }

    const cleanMobile = jreMobile.toString().replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      alert(`Invalid JRE mobile: ${jreMobile}. Must be 10 digits.`);
      return null;
    }

    setDispatchLoading(true);

    try {
      const plainOtp = Math.floor(100000 + Math.random() * 900000).toString();
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
      return {
        groupKey: group.groupKey,
        groupData: group,
        otpId,
        jreMobile: cleanMobile,
      };
    } catch (err) {
      console.error('Error sending Secure Dispatch OTP:', err);
      alert('Failed to generate OTP. Please try again.');
      return null;
    } finally {
      setDispatchLoading(false);
    }
  };

  return {
    sendSecureDispatchOtp,
    dispatchLoading,
  };
};

const calculateDispatchSummary = (group) => ({
  totalItems: group.totalItems,
  totalGrossWeight: parseFloat(group.orders.reduce((sum, order) =>
    sum + parseNumber(order.grossWt || order.netWt), 0).toFixed(3)),
  totalPackets: group.orders.length,
});

const parseNumber = (value) => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};