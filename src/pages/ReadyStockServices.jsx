import React from 'react';
import {
  Menu,
  Users,
  ShoppingCart,
  CheckCircle,
  Truck,
  CreditCard,
  Package
} from 'lucide-react';
import './ReadyStockServices.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ReadyStockServices = () => {
  const steps = [
    {
      id: 1,
      title: "Buyer Requests",
      subtitle: "New incoming enquiries",
      count: 24,
      color: "yellow",
      icon: Users
    },
    {
      id: 2,
      title: "Assortment",
      subtitle: "Shortlist & curate products",
      count: 14,
      color: "blue",
      icon: ShoppingCart
    },
    {
      id: 3,
      title: "Final Correction",
      subtitle: "Confirm specs & edits",
      count: 3,
      color: "orange",
      icon: CheckCircle
    },
    {
      id: 4,
      title: "Ready to Dispatch",
      subtitle: "Packed & awaiting pickup",
      count: 21,
      color: "green",
      icon: Package
    },
    {
      id: 5,
      title: "Delivery",
      subtitle: "In transit to buyer",
      count: 7,
      color: "light-blue",
      icon: Truck
    },
    {
      id: 6,
      title: "Payment",
      subtitle: "Invoices & receipts",
      count: 5,
      color: "purple",
      icon: CreditCard
    }
  ];

  return (
    <>
      <Header title="Ready Stock Services" />
       <div className="overview-container">
        <div className="overview-card">
          <h2 className="overview-title">Today's Overview</h2>
          <div className="overview-stats">
            <div className="stat-item">
              <div className="stat-value">59</div>
              <div className="stat-label">Total Orders</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">42</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">17</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="workflow-container">
        <div className="workflow-steps">
          {steps.map((step, index) => (
            <div key={step.id} className="step-card">
              <div className={`step-line ${step.color}`} />
              <div className="step-content">
                <div className="step-number">
                  <span className={`number ${step.color}`}>{step.id}</span>
                </div>
                <div className="step-details">
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-subtitle">{step.subtitle}</p>
                </div>
                <div className="step-count">
                  <span>{step.count}</span>
                  <span className="arrow">›</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ReadyStockServices;
