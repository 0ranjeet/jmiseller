import { useState } from 'react';
import { doc, getDoc, writeBatch, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import bcrypt from 'bcryptjs';
import { OTP_LENGTH } from '../pages/Pickup';

export const useOTPVerification = () => {
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  const verifyDispatchOtp = async (secureDispatchModal, dispatchOtp, sellerId) => {
    if (!secureDispatchModal) {
      setOtpError('No secure dispatch session found');
      return false;
    }

    if (dispatchOtp.length !== OTP_LENGTH || !/^\d{6}$/.test(dispatchOtp)) {
      setOtpError('Please enter a valid 6-digit OTP');
      return false;
    }

    setDispatchLoading(true);
    setOtpError('');

    try {
      const { otpId, groupData } = secureDispatchModal;
      const otpRef = doc(db, "otps", otpId);
      const otpSnap = await getDoc(otpRef);

      if (!otpSnap.exists()) {
        setOtpError('OTP not found or expired. Please generate a new one.');
        return false;
      }

      const data = otpSnap.data();
      const now = new Date();

      // Check expiration
      if (data.expiresAt && now > data.expiresAt.toDate()) {
        setOtpError('OTP has expired. Please generate a new one.');
        await deleteDoc(otpRef);
        return false;
      }

      // Check if already verified
      if (data.status === "verified") {
        setOtpError('This OTP has already been used.');
        return false;
      }

      // Verify OTP
      const isValid = await bcrypt.compare(dispatchOtp, data.otp);
      if (!isValid) {
        setOtpError('Invalid OTP. Please check and try again.');
        return false;
      }

      // Update OTP status and orders in a batch
      const batch = writeBatch(db);

      // Mark OTP as verified
      batch.update(otpRef, {
        status: "verified",
        verifiedAt: new Date(),
        verifiedBy: sellerId,
      });

      // Get the actual document IDs for orders
      const ordersQuery = query(
        collection(db, 'orderList'),
        where('sellerId', '==', sellerId),
        where('orderStatus', '==', 'Assigned'),
        where('jreId', '==', groupData.jreId),
        where('operatorId', '==', groupData.operatorId)
      );

      const ordersSnapshot = await getDocs(ordersQuery);

      if (ordersSnapshot.empty) {
        setOtpError('No assigned orders found for this group.');
        return false;
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

      alert(`✅ ${ordersSnapshot.size} orders marked as Picked Up!`);
      return true;

    } catch (err) {
      console.error('Error verifying OTP:', err);
      setOtpError('Verification failed. Please try again.');
      return false;
    } finally {
      setDispatchLoading(false);
    }
  };

  return {
    verifyDispatchOtp,
    dispatchLoading,
    otpError,
    setOtpError,
  };
};