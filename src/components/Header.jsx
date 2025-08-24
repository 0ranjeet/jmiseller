import React, { useState } from 'react';
import { Menu, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Header = ({ title = "Dashboard" }) => {
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => setShowMenu(!showMenu);

  const handleLogout = () => {
    try {
      // Clear localStorage authentication data
      localStorage.removeItem("sellerId");
      localStorage.removeItem("sellerMobile");
      
      // Redirect to login page
      navigate("/login");
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="dashboard-header">
      <div className="header-content">
        <div className="header-left">
          <Menu className="icon menu-icon" />
          <h1 className="header-title">{title}</h1>
        </div>
        <div className="dropdown">
          <button 
            onClick={toggleMenu}
            className="menu-btn"
          >
            <MoreVertical className="icon" />
          </button>
          {showMenu && (
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={() => alert('Settings clicked')}>Settings</button>
              <button className="dropdown-item" onClick={() => alert('Profile clicked')}>Profile</button>
              <button className="dropdown-item" onClick={() => alert('Help clicked')}>Help</button>
              <button 
                className="dropdown-item" 
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;