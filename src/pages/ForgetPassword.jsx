import React, { useState } from "react";
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../services/firebase"; // Make sure this path is correct
import bcrypt from "bcryptjs";
import { useNavigate } from "react-router-dom";
import "./Login.css"; // Reuse your existing styles

// New message template for Forgot Password
const MESSAGE_TEMPLATES = {
  FORGOT_PASSWORD: "Your JMI password reset OTP is: {{OTP}}. Valid for 10 minutes.",
};

const ForgotPassword = () => {
  const [mobile, setMobile] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [buyerDocRef, setBuyerDocRef] = useState(null); // To store the buyer document reference
  const nav = useNavigate();

  // Generate 6-digit OTP - reusable from Register
  const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Send OTP: Check if registered + Generate + Save in Firestore
  const sendOtp = async () => {
    if (mobile.length !== 10 || isNaN(mobile)) {
      alert("Enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);

    try {
      // 1. Check if the mobile number is registered
      const q = query(collection(db, "sellers"), where("mobile", "==", mobile));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert("This mobile number is not registered. Please register first.");
        return;
      }
      
      // Store the buyer's document reference for later password update
      // We assume mobile is unique and we'll only get one result
      setBuyerDocRef(querySnapshot.docs[0].ref);
      
      // 2. Generate and Save OTP
      const plainOtp = generateOtp();
      const hashedOtp = await bcrypt.hash(plainOtp, 10);
      // Unique ID for Forgot Password use case
      const otpId = `+91${mobile}_FORGOT_PASSWORD`; 
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 min expiry

      // Fill template
      const message = MESSAGE_TEMPLATES.FORGOT_PASSWORD.replace("{{OTP}}", plainOtp);

      // Save OTP in Firestore
      await setDoc(doc(db, "otps", otpId), {
        mobile: `+91${mobile}`,
        otp: hashedOtp,
        useCase: "FORGOT_PASSWORD",
        status: "pending", 
        createdAt: now,
        expiresAt,
        message, 
        sentByAdmin: false,
      });

      // 3. Proceed to OTP input step
      setOtpSent(true);
      alert(`✅ OTP generated for +91 ${mobile}\nAsk support to send it via WhatsApp.`);
    } catch (err) {
      console.error("Error generating OTP:", err);
      alert("Failed to generate OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and Reset Password
  const verifyOtpAndResetPassword = async () => {
    if (!otp || !password || !confirmPass) {
      alert("Please fill all fields: OTP, New Password, and Confirm Password.");
      return;
    }

    if (password !== confirmPass) {
      alert("New Password and Confirm Password must match.");
      return;
    }
    
    if (password.length < 6) {
        alert("Password must be at least 6 characters long.");
        return;
    }
    
    if (!buyerDocRef) {
        alert("Buyer data not found. Please request OTP again.");
        return;
    }

    setLoading(true);
    
    try {
      const otpId = `+91${mobile}_FORGOT_PASSWORD`;
      const otpRef = doc(db, "otps", otpId);
      const otpSnap = await getDoc(otpRef);

      if (!otpSnap.exists()) {
        alert("No OTP found. Request a new one.");
        setLoading(false);
        return;
      }

      const data = otpSnap.data();
      const now = new Date();

      // Check expiry
      if (now > data.expiresAt.toDate()) {
        alert("OTP has expired. Please request a new one.");
        await otpSnap.ref.delete(); // Clean up expired OTP
        setOtpSent(false);
        setLoading(false);
        return;
      }

      // Compare OTP
      const isValid = await bcrypt.compare(otp, data.otp);
      if (!isValid) {
        alert("Invalid OTP. Please check and try again.");
        setLoading(false);
        return;
      }

      // 1. OTP Verified: Mark as used
      await updateDoc(otpRef, { status: "verified" });

      // 2. Hash the new password
      const newPasswordHash = await bcrypt.hash(password, 10);
      
      // 3. Update the buyer's password
      await updateDoc(buyerDocRef, {
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      });

      alert(`✅ Password successfully reset for +91 ${mobile}!`);
      
      // Navigate to login page
      nav("/login", { replace: true });

    } catch (err) {
      console.error("Password reset error:", err);
      alert("Something went wrong during password reset. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <h1 className="title">JMI</h1>

      <div className="login-box">
        <h2>Forgot Password</h2>

        <label>Mobile</label>
        <input
          type="tel"
          maxLength="10"
          placeholder="Enter Mobile Number"
          value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
          disabled={otpSent}
        />

        {!otpSent ? (
          <button className="login-btn" onClick={sendOtp} disabled={loading}>
            {loading ? "Checking Account..." : "Send Reset OTP"}
          </button>
        ) : (
          <>
            <label>OTP</label>
            <input
              type="text"
              placeholder="Enter OTP (sent via WhatsApp)"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <label>New Password (Min. 6 characters)</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <label>Confirm New Password</label>
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
            />

            <button
              className="login-btn"
              onClick={verifyOtpAndResetPassword}
              disabled={loading}
            >
              {loading ? "Resetting Password..." : "Verify & Reset Password"}
            </button>
          </>
        )}
      </div>

      <p className="register-link">
        Remember your password?{" "}
        <span
          onClick={() => nav("/login")}
          style={{ color: "#007bff", cursor: "pointer" }}
        >
          Go to Login
        </span>
      </p>
      
      <p className="support">
        <img src="/whatsapp.svg" onClick={() => window.open("https://wa.me/918917412728", "_blank")} alt="whatsapp" className="whatsapp-icon" />
        Need help? Contact Seller Support
      </p>

    </div>
  );
};

export default ForgotPassword;