import React, { useState } from "react";
import { db } from "../services/firebase";
import { collection, query, where, getDoc, doc,getDocs } from "firebase/firestore";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import bcrypt from "bcryptjs"; // must install

const Login = () => {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();

  const handleLogin = async () => {
  if (mobile.length !== 10 || password.length === 0) {
    alert("Please enter both fields correctly");
    return;
  }

  try {
    // 🔍 search seller by mobile (since sellerId is random)
    const q = query(collection(db, "sellers"), where("mobile", "==", mobile));
    const snap = await getDocs(q);

    if (snap.empty) {
      alert("Seller not found");
      return;
    }

    const sellerDoc = snap.docs[0];
    const data = sellerDoc.data();

    // ✅ bcrypt password verification
    const isMatch = await bcrypt.compare(password, data.passwordHash);
    if (!isMatch) {
      alert("Incorrect password");
      return;
    }

    const sellerId = data.sellerId;
    
    // Check registration status
    const registrationStatus = await getRegistrationStatus(sellerId);
    
    // Store seller info and registration status
    localStorage.setItem("sellerId", sellerId);
    localStorage.setItem("sellerMobile", mobile);
    localStorage.setItem("registrationStatus", JSON.stringify(registrationStatus));

    alert("Login successful");
    
    // Redirect to the first incomplete registration step
    if (!registrationStatus.seller.completed) {
      nav("/sellerregistration");
    } else if (!registrationStatus.segment.completed) {
      nav("/segmentregistration");
    } else if (!registrationStatus.product.completed) {
      nav("/productregistration");
    } else {
      nav("/dashboard");
    }

  } catch (err) {
    console.error(err);
    alert("Login failed");
  }
};

// Detailed registration status check
const getRegistrationStatus = async (sellerId) => {
  const status = {
    seller: { completed: false, details: {} },
    segment: { completed: false, details: {} },
    product: { completed: false, details: {} }
  };

  try {
    // Check seller registration
    const sellerDoc = await getDoc(doc(db, "seller-registrations", sellerId));
    if (sellerDoc.exists()) {
      const sellerData = sellerDoc.data();
      status.seller = {
        completed: sellerData.registrationComplete || false,
        details: sellerData
      };
    }

    // Check segment registration
    const segmentDoc = await getDoc(doc(db, "SellerSegmentRegistrations", sellerId));
    if (segmentDoc.exists()) {
      const segmentData = segmentDoc.data();
      status.segment = {
        completed: segmentData.registrationComplete || false,
        details: segmentData
      };
    }

    // Check product registration
    const productRegDoc = await getDoc(doc(db, "ProductRegistrations", sellerId));
    if (productRegDoc.exists()) {
      const productData = productRegDoc.data();
      const hasProducts = productData.registrations && 
                         Array.isArray(productData.registrations) && 
                         productData.registrations.length > 0;
      
      status.product = {
        completed: hasProducts,
        details: productData
      };
    }

    return status;
  } catch (error) {
    console.error("Error checking registration status:", error);
    return status;
  }
};

  return (
    <div className="login-wrapper">
      <h1 className="title">JMI</h1>
      <p className="subtitle">Seller Desk</p>

      <div className="login-box">
        <h2>Seller Login</h2>

        <label>Mobile Number</label>
        <input
          type="tel"
          maxLength="10"
          placeholder="Enter Mobile Number"
          value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/\D/, ""))}
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="login-btn" onClick={handleLogin}>
          Login
        </button>
        <p className="forgot">Forgot Password?</p>
      </div>

      <p className="register-link">
        Don't have an account?{" "}
        <span onClick={() => (window.location.href = "/register")}>
          Register now
        </span>
      </p>

      <p className="support">
        <img src="/whatsapp.svg" alt="whatsapp" className="whatsapp-icon" />
        Need help? Contact Seller Support
      </p>
    </div>
  );
};

export default Login;
