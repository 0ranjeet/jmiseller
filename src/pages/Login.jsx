import React, { useState } from "react";
import { db } from "../services/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
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

      // session / store sellerId
      localStorage.setItem("sellerId", data.sellerId);
      localStorage.setItem("sellerMobile", mobile);

      alert("Login successful");
      nav("/dashboard");


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
