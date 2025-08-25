import React from 'react';
import { Home, List, Plus, Bell, User } from 'lucide-react';
import './Dashboard.css';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
  const navigate = useNavigate();
  return (
    <footer className="dashboard-footer">
      <div className="footer-nav">
        <button className="footer-btn footer-btn-active">
          <Home size={20} />
          <span className="footer-label-active">Home</span>
        </button>
        <button className="footer-btn footer-btn-inactive" onClick={()=>navigate('/productregistration')}>

          <List size={20} />
          <span className="footer-label">Catalogue</span>
        </button>
        <button className="footer-btn">
          <div className="plus-button" onClick={()=>navigate('/AddProduct')}>
            <Plus size={24} color="white" />
          </div>
        </button>
        <button className="footer-btn footer-btn-inactive">
          <Bell size={20} />
          <span className="footer-label">Alerts</span>
        </button>
        <button className="footer-btn footer-btn-inactive">
          <User size={20} />
          <span className="footer-label">Profile</span>
        </button>
      </div>
    </footer>
  );
};

export default Footer;