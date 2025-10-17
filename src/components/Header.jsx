import React, { useState, useEffect } from 'react';
import { Menu, MoreVertical, Home, FileText, BookImage, BookA, Bell, Plus, Truck, TrendingUpDown ,Handshake } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Header.css';
import Logo from '../JMIlogo.png';
import { useSeller } from '../contexts/SellerContext';

const Header = ({ title = "Dashboard" }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { clearSeller } = useSeller();
  // Toggle sidebar
  const toggleSidebar = () => {
    setShowSidebar((prev) => {
      const newState = !prev;
      console.log('Sidebar toggled:', newState);
      return newState;
    });
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    setShowMenu((prev) => !prev);
  };

  const handleLogout = () => {
    try {
      clearSeller();
        navigate("/login");
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest('.dropdown')) {
        setShowMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMenu]);

  const menuItems = [
    { label: 'Home', icon: <Home size={18} />, path: '/dashboard' },
    { label: 'Live Rate', icon: <TrendingUpDown size={18} />, path: '/liverates' },
    { label: 'Registered Products', icon: <FileText size={18} />, path: '/myregisteredproducts' },
    { label: 'My opertor',icon:<Handshake size={18}/>,path:'/segmentregistration'},
    { label: 'My Catalogue', icon: <BookImage size={18} />, path: '/MyCatalogue' },
   { label: 'Ready Stock Services', icon: <Truck size={18} />, path: '/readystockservices' },
    { label: 'Order Serve Services', icon: <BookA size={18} />, path: '/orderserve' },
    { label: 'Open Market Services', icon: <Plus size={18} />, path: '/open-market' },
    { label: 'Offers & Discount', icon: <Bell size={18} />, path: '/offers' },
  ];

  const renderSidebar = () => (
    <>
      {/* Overlay */}
      {showSidebar && (
        <div 
          className="sidebar-overlay show" 
          onClick={() => setShowSidebar(false)}
        />
      )}
      
      {/* Sidebar Drawer */}
      <div className={`sidebar ${showSidebar ? 'show' : ''}`}>
        <img src={Logo} alt="" style={{width:"120px",margin:"5px 60px"}} />
        <nav className="sidebar-nav">
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <div
                key={index}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  navigate(item.path);
                  setShowSidebar(false);
                }}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </div>
            );
          })}
        </nav>
      </div>
    </>
  );

  return (
    <>
      {/* Render sidebar outside header */}
      {renderSidebar()}

      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <button 
              onClick={toggleSidebar}
              className="menu-btn"
              aria-label="Toggle Sidebar"
            >
              <Menu className="icon menu-icon" size={24} />
            </button>
            <h1 className="header-title">{title}</h1>
          </div>

          <div className="dropdown">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleDropdown();
              }}
              className="menu-btn"
              aria-label="More options"
            >
              <MoreVertical className="icon" size={24} />
            </button>
            {showMenu && (
              <div className="dropdown-menu" role="menu">
                <div className="dropdown-item" onClick={() => alert('Settings clicked')} role="menuitem">Settings</div>
                <div className="dropdown-item" onClick={() => alert('Profile clicked')} role="menuitem">Profile</div>
                <div className="dropdown-item" onClick={() => alert('Help clicked')} role="menuitem">Help</div>
                <div 
                  className="dropdown-item" 
                  onClick={handleLogout}
                  role="menuitem"
                >
                  Logout
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;