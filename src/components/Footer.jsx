import React from 'react';
import { Home, List, Plus, Bell, User } from 'lucide-react';
import './Footer.css';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Reusable Footer Component for JMI Seller App
 * 
 * Props:
 * - navigationRoutes: object containing route mappings
 */
const Footer = ({
  navigationRoutes = {
    home: '/dashboard',
    catalogue: '/MyCatalogue',
    upload: '/UploadProduct',
    alerts: '/alerts',
    profile: '/sellerregistration',
  },
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation items configuration
  const footerItems = [
    { id: 'home', label: 'Home', icon: Home, route: navigationRoutes.home },
    { id: 'catalogue', label: 'Catalogue', icon: List, route: navigationRoutes.catalogue },
    { 
      id: 'upload', 
      label: 'Upload', 
      icon: Plus, 
      route: navigationRoutes.upload,
      isMainAction: true 
    },
    { 
      id: 'alerts', 
      label: 'Alerts', 
      icon: Bell, 
      route: navigationRoutes.alerts, 
    },
    { id: 'profile', label: 'Profile', icon: User, route: navigationRoutes.profile },
  ];

  const getBtnClass = (path) => {
    return location.pathname === path
      ? 'footer-btn footer-btn-active'
      : 'footer-btn footer-btn-inactive';
  };

  const getLabelClass = (path) => {
    return location.pathname === path ? 'footer-label-active' : 'footer-label';
  };

  return (
    <footer className="dashboard-footer">
      <div className="footer-nav">
        {footerItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = location.pathname === item.route;

          if (item.isMainAction) {
            // Floating upload button (centered)
            return (
              <div key={item.id} className="footer-btn">
                <button
                  className="plus-button"
                  onClick={() => navigate(item.route)}
                  aria-label={item.label}
                  title={item.label}
                >
                  <Plus size={24} color="white" />
                </button>
              </div>
            );
          }

          return (
            <button
              key={item.id}
              className={getBtnClass(item.route)}
              onClick={() => navigate(item.route)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              title={item.label}
            >
              <div className="footer-icon-with-badge">
                <IconComponent size={20} />
                
              </div>
              <span className={getLabelClass(item.route)}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </footer>
  );
};

export default Footer;