import React, { useState } from "react";
import { db } from "../services/firebase";
import { collection, query, where, getDoc, doc, getDocs } from "firebase/firestore";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import bcrypt from "bcryptjs";
import { useSeller } from "../contexts/SellerContext"; 
import { saveData } from "../utils/storage";

const Login = () => {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();
  const { updateSeller } = useSeller(); // Get the updateSeller function from context

  const handleLogin = async () => {
    if (mobile.length !== 10 || password.length === 0) {
      alert("Please enter both fields correctly");
      return;
    }
  
    try {
      const q = query(collection(db, "sellers"), where("mobile", "==", mobile));
      const snap = await getDocs(q);
  
      if (snap.empty) {
        alert("Seller not found");
        return;
      }
  
      const sellerDoc = snap.docs[0];
      const data = sellerDoc.data();
  
      const isMatch = await bcrypt.compare(password, data.passwordHash);
      if (!isMatch) {
        alert("Incorrect password");
        return;
      }
  
      const sellerId = data.sellerId;
  
      // Fetch registration data
      const sellerRegistrationDoc = doc(db, "sellerregistrations", sellerId);
      const sellerRegistrationSnap = await getDoc(sellerRegistrationDoc);
      const sellerRegistrationData = sellerRegistrationSnap.exists()
        ? sellerRegistrationSnap.data()
        : {};
  
      // ✅ Prepare seller data
      const sellerData = {
        sellerId,
        mobile,
        organizationName: sellerRegistrationData.organizationName || '',
        lastUpdated: Date.now(),
      };
  
      // ✅ Persist to storage (for auto-login after app kill)
      await saveData("sellerData", sellerData);
  
      // ✅ Update context
      updateSeller(sellerData);
  
      // Fetch profile for redirect logic
      const sellerProfileRef = doc(db, "profile", sellerId);
      const profileSnap = await getDoc(sellerProfileRef);
      const profileData = profileSnap.exists() ? profileSnap.data() : {};
  
      alert("Login successful");
  
      // Redirect based on registration progress
      if (!profileData.SellerRegistration) {
        nav("/sellerregistration");
      } else if (!profileData.SegmentRegistration) {
        nav("/segmentregistration");
      } else if (!profileData.ProductRegistration) {
        nav("/productregistration");
      } else {
        nav("/dashboard");
      }
    } catch (err) {
      console.error(err);
      alert("Login failed");
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
        <p className="forgot" onClick={()=>nav('/forgetpassword')}>Forgot Password?</p>
      </div>

      <p className="register-link">
        Don't have an account?{" "}
        <span onClick={() => (window.location.href = "/register")}>
          Register now
        </span>
      </p>

      <p className="support">
        <img src="/whatsapp.svg" alt="whatsapp" className="whatsapp-icon" />
        <span onClick={() => window.open("https://wa.me/918917412728", "_blank")}> Need help? </span>Contact Support
      
      </p>
    </div>
  );
};

export default Login;