import React, { useState } from 'react';
import { Star, TrendingUp, TrendingDown, Package } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import './Dashboard.css';

const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('Today');

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
    <>
      <Header title="Dashboard" />
      <div className="dashboard-container">


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
                className='metric-card'
              >
                <div className="metric-content">
                  <div className="metric-left">
                    <div className={`metric-icon-container sales-icon-bg`}>
                      <span style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#10b981'
                      }}>Rs</span>
                    </div>
                    <div className="metric-info">
                      <p className="metric-value-animated">
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
                  </div>
                </div>
              </div>

              {/* Orders */}
              <div
                className='metric-card'
              >
                <div className="metric-content">
                  <div className="metric-left">
                    <div className={`metric-icon-container orders-icon-bg`}>
                      <Package size={20} color="#3b82f6" />
                    </div>
                    <div className="metric-info">
                      <p className="metric-value-animated">
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
                  </div>
                </div>
              </div>

              {/* To be received */}
              <div
                className='metric-card'
              >
                <div className="metric-content">
                  <div className="metric-left">
                    <div className={`metric-icon-container received-icon-bg`}>
                      <span style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#f59e0b'
                      }}>₹</span>
                    </div>
                    <div className="metric-info">
                      <p className="metric-value-animated">
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
                    
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Rate */}
          <div className="card">
            <div className="live-rate-header">
              <h3 className="overview-title">Live Rate</h3>
              <span className="view-details">View details</span>
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
              <span className="create-offer">Create Offer</span>
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


      </div>
      <Footer />
    </>
  );
};

export default Dashboard;