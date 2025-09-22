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
import { db } from "../services/firebase";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { useSeller } from "../contexts/SellerContext";
import { useNavigate } from "react-router-dom";
import "./Login.css";

// Message templates for different use cases
const MESSAGE_TEMPLATES = {
  REGISTER: "Your JMI Seller registration OTP is: {{OTP}}. Valid for 10 minutes.",
};

const Register = () => {
  const { updateSeller } = useSeller();
  const [mobile, setMobile] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  // Generate 6-digit OTP
  const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Send OTP: Generate + Save in Firestore (no Firebase Auth used)
  const sendOtp = async () => {
    if (mobile.length !== 10 || isNaN(mobile)) {
      alert("Enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);

    try {
      // Check if already registered
      const q = query(collection(db, "sellers"), where("mobile", "==", mobile));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        alert("This mobile number is already registered.");
        return;
      }

      // Generate OTP
      const plainOtp = generateOtp();
      const hashedOtp = await bcrypt.hash(plainOtp, 10);
      const otpId = `+91${mobile}_REGISTER`; // Unique ID
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 min expiry

      // Fill template
      const message = MESSAGE_TEMPLATES.REGISTER.replace("{{OTP}}", plainOtp);

      // Save OTP in Firestore
      await setDoc(doc(db, "otps", otpId), {
        mobile: `+91${mobile}`,
        otp: hashedOtp,
        useCase: "REGISTER",
        status: "pending", // Not yet sent — will be triggered externally
        createdAt: now,
        expiresAt,
        message, // Full message ready to send
        sentByAdmin: false,
      });

      // Proceed to OTP input step
      setOtpSent(true);
      alert(`✅ OTP generated for +91 ${mobile}\nAsk support to send it via WhatsApp.`);
    } catch (err) {
      console.error("Error generating OTP:", err);
      alert("Failed to generate OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and Register Seller
  const verifyOtpAndRegister = async () => {
    if (!otp || !password || !confirmPass) {
      alert("Please fill all fields");
      return;
    }

    if (password !== confirmPass) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const otpId = `+91${mobile}_REGISTER`;
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
        await otpSnap.ref.delete();
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

      // ✅ OTP Verified — Mark as used and proceed

      await updateDoc(otpRef, { status: "verified" });

      // Create seller account
      const sellerId = "SELLER-" + uuidv4().split("-")[0].toUpperCase();
      const passwordHash = await bcrypt.hash(password, 10);

      await setDoc(doc(db, "sellers", sellerId), {
        sellerId,
        mobile,
        createdAt: new Date(),
        passwordHash,
        status: "pending",
      });

      // Update context
      updateSeller({
        sellerId,
        mobile,
        registrationStatus: false,
      });

      alert(`🎉 Seller registered successfully!\nYour ID: ${sellerId}`);
      nav("/sellerregistration");
    } catch (err) {
      console.error("Registration error:", err);
      alert("Something went wrong during verification. Please try again.");
    } finally {
      setLoading(false);
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
          onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
          disabled={otpSent}
        />

        {!otpSent ? (
          <button className="login-btn" onClick={sendOtp} disabled={loading}>
            {loading ? "Generating OTP..." : "Send OTP"}
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

            <button
              className="login-btn"
              onClick={verifyOtpAndRegister}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify & Register"}
            </button>
          </>
        )}
      </div>

      <p className="register-link">
        Already have an account?{" "}
        <span
          onClick={() => nav("/login")}
          style={{ color: "#007bff", cursor: "pointer" }}
        >
          Login
        </span>
      </p>

      <p className="support">
        <img src="/whatsapp.svg" alt="whatsapp" className="whatsapp-icon" />
        Need help? Contact Seller Support
      </p>

      {/* Hidden container (in case you keep reCAPTCHA for other flows) */}
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default Register;