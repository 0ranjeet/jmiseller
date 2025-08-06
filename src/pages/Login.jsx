import React, { useState } from 'react';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import './Login.css';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const nav=useNavigate();
  const handleLogin = async () => {
    if (mobile.length !== 10 || password.length === 0) {
      alert("Please enter both fields correctly");
      return;
    }

    try {
      const docRef = doc(db, 'sellers', mobile);
      
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        alert("Seller not found");
        return;
      }

      const data = docSnap.data();
      if (atob(data.passwordHash) !== password) {
        alert("Incorrect password");
        return;
      }

      localStorage.setItem("sellerMobile", mobile); // session
      nav("/productregistration"); // or wherever your home is

    } catch (err) {
      console.error(err);
      alert("Login failed");
    }
  };

  return (
    <div className="login-wrapper">
      {/* <img src="/logo.png" alt="Logo" className="logo" /> */}
      <h1 className="title">JMI</h1>
      <p className="subtitle">Seller Desk</p>

      <div className="login-box">
        <h2>Seller Login</h2>

        <label>Seller ID</label>
        <input
          type="tel"
          maxLength="10"
          placeholder="Enter Mobile Number"
          value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/\D/, ''))}
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="login-btn" onClick={handleLogin}>Login</button>
        <p className="forgot">Forgot Password?</p>
      </div>

      <p className="register-link">
        Don't have an account? <span onClick={() => window.location.href = "/register"}>Register now</span>
      </p>

      <p className="support">
        <img src="/whatsapp.svg" alt="whatsapp" className="whatsapp-icon" />
        Need help? Contact Seller Support
      </p>
    </div>
  );
};

export default Login;
