import React, { useState } from 'react';
import { Star, TrendingUp, TrendingDown, Package } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import './Dashboard.css';

const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('Today');
  const [hoveredCard, setHoveredCard] = useState(null);

  // Data for different time periods
  const businessData = {
    'Today': {
      sales: { value: '₹1,24,500', change: 2.1, trend: 'up' },
      orders: { value: '42', change: -0.8, trend: 'down' },
      received: { value: '₹56,800', change: 5.2, trend: 'up' }
    },
    '7D': {
      sales: { value: '₹8,67,300', change: 4.3, trend: 'up' },
      orders: { value: '324', change: 2.1, trend: 'up' },
      received: { value: '₹2,23,400', change: -1.2, trend: 'down' }
    },
    '30D': {
      sales: { value: '₹32,45,600', change: 7.8, trend: 'up' },
      orders: { value: '1,234', change: 6.5, trend: 'up' },
      received: { value: '₹2,76,300', change: 3.4, trend: 'up' }
    }
  };

  const currentData = businessData[selectedPeriod];

  return (
    <div className="dashboard-container">
      <Header title="Dashboard" />
      
      <main className="dashboard-main">
        {/* Store Profile */}
        <div className="card">
          <div className="profile-card">
            <div className="profile-icon">
              <Star size={24} color="white" />
            </div>
            <div>
              <h2 className="profile-title">M/S Lachland Jewellers Store</h2>
              <p className="profile-subtitle">View profile & settings</p>
            </div>
          </div>
        </div>

        {/* Business Overview */}
        <div className="card">
          <div className="overview-header">
            <h3 className="overview-title">Business Overview</h3>
            <div className="tab-buttons">
              {['Today', '7D', '30D'].map((period) => (
                <button 
                  key={period}
                  className={selectedPeriod === period ? 'tab-active' : 'tab-inactive'}
                  onClick={() => setSelectedPeriod(period)}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <div>
            {/* Sales */}
            <div 
              className= 'metric-card'
              onMouseEnter={() => setHoveredCard('sales')}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => alert(`Sales Details for ${selectedPeriod}: ${currentData.sales.value}`)}
            >
              <div className="metric-content">
                <div className="metric-left">
                  <div className={`metric-icon-container sales-icon-bg ${hoveredCard === 'sales' ? 'metric-icon-hover' : ''}`}>
                    <span style={{ 
                      fontSize: '20px', 
                      fontWeight: 'bold', 
                      color: '#10b981'
                    }}>Rs</span>
                  </div>
                  <div className="metric-info">
                    <p className={hoveredCard === 'sales' ? 'metric-value-animated' : 'metric-value'}>
                      {currentData.sales.value}
                    </p>
                    <p className="metric-label">Sales</p>
                  </div>
                </div>
                <div className="metric-right">
                  <div className="trend-container">
                    {currentData.sales.trend === 'up' ? (
                      <TrendingUp size={16} color="#10b981" />
                    ) : (
                      <TrendingDown size={16} color="#ef4444" />
                    )}
                    <span className={currentData.sales.trend === 'up' ? 'trend-up' : 'trend-down'}>
                      {Math.abs(currentData.sales.change)}%
                    </span>
                  </div>
                  <div className="chart-container">
                    <svg width="60" height="30" viewBox="0 0 60 30">
                      <polyline 
                        fill="none" 
                        stroke={currentData.sales.trend === 'up' ? '#10b981' : '#ef4444'}
                        strokeWidth="2"
                        points={currentData.sales.trend === 'up' ? "5,25 15,20 25,15 35,10 45,8 55,5" : "5,5 15,8 25,12 35,18 45,22 55,25"}
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Orders */}
            <div 
              className={hoveredCard === 'orders' ? 'metric-card-hover' : 'metric-card'}
              onMouseEnter={() => setHoveredCard('orders')}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => alert(`Orders Details for ${selectedPeriod}: ${currentData.orders.value}`)}
            >
              <div className="metric-content">
                <div className="metric-left">
                  <div className={`metric-icon-container orders-icon-bg ${hoveredCard === 'orders' ? 'metric-icon-hover' : ''}`}>
                    <Package size={20} color="#3b82f6" />
                  </div>
                  <div className="metric-info">
                    <p className={hoveredCard === 'orders' ? 'metric-value-animated' : 'metric-value'}>
                      {currentData.orders.value}
                    </p>
                    <p className="metric-label">Orders</p>
                  </div>
                </div>
                <div className="metric-right">
                  <div className="trend-container">
                    {currentData.orders.trend === 'up' ? (
                      <TrendingUp size={16} color="#10b981" />
                    ) : (
                      <TrendingDown size={16} color="#ef4444" />
                    )}
                    <span className={currentData.orders.trend === 'up' ? 'trend-up' : 'trend-down'}>
                      {Math.abs(currentData.orders.change)}%
                    </span>
                  </div>
                  <div className="chart-container">
                    <svg width="60" height="30" viewBox="0 0 60 30">
                      <polyline 
                        fill="none" 
                        stroke={currentData.orders.trend === 'up' ? '#10b981' : '#ef4444'}
                        strokeWidth="2"
                        points={currentData.orders.trend === 'up' ? "5,25 15,20 25,15 35,10 45,8 55,5" : "5,5 15,8 25,12 35,18 45,22 55,25"}
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* To be received */}
            <div 
              className={hoveredCard === 'received' ? 'metric-card-hover' : 'metric-card'}
              onMouseEnter={() => setHoveredCard('received')}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => alert(`Amount to be received for ${selectedPeriod}: ${currentData.received.value}`)}
            >
              <div className="metric-content">
                <div className="metric-left">
                  <div className={`metric-icon-container received-icon-bg ${hoveredCard === 'received' ? 'metric-icon-hover' : ''}`}>
                    <span style={{ 
                      fontSize: '20px', 
                      fontWeight: 'bold', 
                      color: '#f59e0b'
                    }}>₹</span>
                  </div>
                  <div className="metric-info">
                    <p className={hoveredCard === 'received' ? 'metric-value-animated' : 'metric-value'}>
                      {currentData.received.value}
                    </p>
                    <p className="metric-label">Received</p>
                  </div>
                </div>
                <div className="metric-right">
                  <div className="trend-container">
                    {currentData.received.trend === 'up' ? (
                      <TrendingUp size={16} color="#10b981" />
                    ) : (
                      <TrendingDown size={16} color="#ef4444" />
                    )}
                    <span className={currentData.received.trend === 'up' ? 'trend-up' : 'trend-down'}>
                      {Math.abs(currentData.received.change)}%
                    </span>
                  </div>
                  <div className="chart-container">
                    <svg width="60" height="30" viewBox="0 0 60 30">
                      <polyline 
                        fill="none" 
                        stroke={currentData.received.trend === 'up' ? '#10b981' : '#ef4444'}
                        strokeWidth="2"
                        points={currentData.received.trend === 'up' ? "5,20 15,18 25,15 35,12 45,8 55,10" : "5,10 15,12 25,15 35,18 45,20 55,22"}
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Rate */}
        <div className="card">
          <div className="live-rate-header">
            <h3 className="overview-title">Live Rate</h3>
            <span  className="view-details">View details</span>
          </div>

          <div>
            <div className="rate-item">
              <div className="rate-left">
                <div className="rate-dot gold-dot"></div>
                <span style={{ color: '#374151' }}>Gold 22K</span>
              </div>
              <div className="rate-right">
                <span className="rate-value">₹6,345/g</span>
                <TrendingUp size={16} color="#10b981" />
                <span className="trend-up">0.8%</span>
              </div>
            </div>

            <div className="rate-item">
              <div className="rate-left">
                <div className="rate-dot silver-dot"></div>
                <span style={{ color: '#374151' }}>Silver</span>
              </div>
              <div className="rate-right">
                <span className="rate-value">₹78/g</span>
                <TrendingDown size={16} color="#ef4444" />
                <span className="trend-down">0.2%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Service Cards */}
        <div>
          {/* My Catalogue */}
          <div className="service-card catalogue-card">
            <div className="service-overlay"></div>
            <div className="service-content">
              <h3 className="service-title">My Catalogue</h3>
              <div className="catalogue-stats">
                <span>Pending QC 12</span>
                <span>Approved 124</span>
                <span>Rejected 3</span>
              </div>
            </div>
          </div>

          {/* Ready-Stock Services */}
          <div className="service-card ready-stock-card">
            <div className="service-overlay"></div>
            <div className="service-content">
              <h3 className="service-title">Ready-Stock Services</h3>
              <p className="service-subtitle">Add ready items, manage listings</p>
            </div>
          </div>

          {/* Order Services */}
          <div className="service-card order-card">
            <div className="service-overlay"></div>
            <div className="service-content">
              <h3 className="service-title">Order Services</h3>
              <p className="service-subtitle">Custom orders & quotations</p>
            </div>
          </div>

          {/* Open Market Services */}
          <div className="service-card market-card">
            <div className="service-overlay"></div>
            <div className="service-content">
              <h3 className="service-title">Open Market Services</h3>
              <p className="service-subtitle">Browse superior listings</p>
            </div>
          </div>
        </div>

        {/* Offers & Discounts */}
        <div className="card">
          <div className="offers-header">
            <h3 className="overview-title">Offers & Discounts</h3>
            <span  className="create-offer">Create Offer</span>
          </div>

          <div className="offers-grid">
            <div className="offer-card festival-card">
              <div className="offer-small-text">Festival Sale</div>
              <div className="offer-large-text">25% OFF</div>
              <div className="offer-description">25% Off on All Jewellery Making charges</div>

            </div>

            <div className="offer-card diamond-card">
              <div className="offer-small-text">Limited Time</div>
              <div style={{ fontWeight: '600' }}>Diamond Collection</div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;