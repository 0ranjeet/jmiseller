import React from 'react';
import { Star, DollarSign, TrendingUp, TrendingDown, Package } from 'lucide-react';

const MainContent = () => {
  return (
    <div className="content">
      {/* Store Profile */}
      <div className="card profile-card">
        <div className="profile-icon">
          <Star />
        </div>
        <div>
          <h2>M/S Lachland Jewellers Store</h2>
          <p>View profile & settings</p>
        </div>
      </div>

      {/* Example Business Overview Card */}
      <div className="card overview-card">
        <h3>Business Overview</h3>
        <div className="stats-row">
          <div className="stat green">
            <DollarSign />
            <div>
              <p className="value">₹1,24,500</p>
              <p>Sales</p>
            </div>
            <span className="trend up"><TrendingUp /> 2.1%</span>
          </div>
          <div className="stat blue">
            <Package />
            <div>
              <p className="value">42</p>
              <p>Orders</p>
            </div>
            <span className="trend down"><TrendingDown /> 0.8%</span>
          </div>
        </div>
      </div>

      {/* Add other sections here (Live Rate, Services, Offers) with similar structure */}
    </div>
  );
};

export default MainContent;
