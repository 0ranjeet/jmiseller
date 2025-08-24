import React, { useState } from "react";
import {
  auth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "../services/firebase";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../services/firebase";
import bcrypt from "bcryptjs"; // npm install bcryptjs
import { v4 as uuidv4 } from "uuid"; // npm install uuid

const Register = () => {
  const [mobile, setMobile] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const nav = useNavigate();

  // Setup invisible recaptcha
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => {},
        }
      );
    }
  };

  // Send OTP
  const sendOtp = async () => {
    if (mobile.length !== 10) {
      alert("Enter valid 10-digit number");
      return;
    }
    setupRecaptcha();
    const appVerifier = window.recaptchaVerifier;
    const fullPhone = `+91${mobile}`;
    try {
      const result = await signInWithPhoneNumber(auth, fullPhone, appVerifier);
      setConfirmationResult(result);
      setOtpSent(true);
    } catch (err) {
      console.error(err);
      alert("Failed to send OTP");
    }
  };

  // Verify OTP and Register
  const verifyOtpAndRegister = async () => {
    if (!otp || !password || !confirmPass) {
      alert("Fill all fields");
      return;
    }
    if (password !== confirmPass) {
      alert("Passwords do not match");
      return;
    }

    try {
      await confirmationResult.confirm(otp);

      // 🔍 Check if mobile already registered
      const q = query(collection(db, "sellers"), where("mobile", "==", mobile));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        alert("This mobile number is already registered.");
        return;
      }

      // Generate secure unique sellerId
      const sellerId = "SELLER-" + uuidv4().split("-")[0].toUpperCase(); 
      // Example: SELLER-3F9A1C2B

      // Hash password securely
      const passwordHash = await bcrypt.hash(password, 10);

      // Save seller info
      await setDoc(doc(db, "sellers", sellerId), {
        sellerId,
        mobile,
        createdAt: new Date(),
        passwordHash,
        status: "pending",
      });

      // Audit log
      await setDoc(doc(db, "seller-registrations", sellerId), {
        sellerId,
        mobile,
        registeredAt: new Date(),
      });

      alert(`Seller registered successfully with ID: ${sellerId}`);
      nav("/sellerregistration");
    } catch (err) {
      alert("OTP verification failed");
      console.error(err);
    }
  };

  return (
    <div className="login-wrapper">
      <h1 className="title">JMI</h1>
      <p className="subtitle">Seller Desk</p>

      <div className="login-box">
        <h2>Registration</h2>

        <label>Seller Mobile</label>
        <input
          type="tel"
          maxLength="10"
          placeholder="Enter Mobile Number"
          value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/\D/, ""))}
          disabled={otpSent}
        />

        {!otpSent ? (
          <button className="login-btn" onClick={sendOtp}>
            Send OTP
          </button>
        ) : (
          <>
            <label>OTP</label>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
            />

            <button className="login-btn" onClick={verifyOtpAndRegister}>
              Register
            </button>
          </>
        )}
      </div>

      <p className="register-link">
        Already have an account?{" "}
        <span onClick={() => (window.location.href = "/login")}>Login</span>
      </p>

      <p className="support">
        <img src="/whatsapp.svg" alt="whatsapp" className="whatsapp-icon" />
        Need help? Contact Seller Support
      </p>

      <div id="recaptcha-container"></div>
    </div>
  );
};

export default Register;
