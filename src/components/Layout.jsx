import React, { useState } from "react";
import { Menu, MoreVertical } from "lucide-react";
import "./Layout.css";

const Layout = ({ children }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="layout">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <Menu className="icon" />
          <h1 className="title">Dashboard</h1>
        </div>
        <div className="header-right">
          <button className="menu-btn" onClick={() => setShowMenu(!showMenu)}>
            <MoreVertical className="icon" />
          </button>
          {showMenu && (
            <div className="dropdown">
              <a href="#">Settings</a>
              <a href="#">Profile</a>
              <a href="#">Help</a>
              <a href="#">Logout</a>
            </div>
          )}
        </div>
      </header>

      {/* Page content */}
      <main className="main">{children}</main>

      {/* Footer */}
      <footer className="footer">
        <button className="footer-item active">
          <span>🏠</span>
          <small>Home</small>
        </button>
        <button className="footer-item">
          <span>📦</span>
          <small>Catalogue</small>
        </button>
        <button className="footer-item add-btn">+</button>
        <button className="footer-item">
          <span>🔔</span>
          <small>Alerts</small>
        </button>
        <button className="footer-item">
          <span>👤</span>
          <small>Profile</small>
        </button>
      </footer>
    </div>
  );
};

export default Layout;
