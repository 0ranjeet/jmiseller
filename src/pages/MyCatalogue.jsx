import React from 'react';
import './MyCatalogue.css'
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';


const MyCatalogue = () => {
  const nav=useNavigate();
  const catalogueItems = [
    {
      id: 1,
      title: 'Add Products',
      path:'/UploadProduct',
      description: 'Create new listings',
      color: 'bg-yellow-500',
      count: null,
      icon: '+'
    },
    {
      id: 2,
      title: 'QC Pending',
      description: 'Awaiting quality check',
      color: 'bg-yellow-400',
      count: 12,
      icon: ''
    },
    {
      id: 3,
      title: 'QC Rejected',
      description: 'Needs fixes & resubmission',
      color: 'bg-red-500',
      count: 3,
      icon: ''
    },
    {
      id: 4,
      title: 'Ready Stock Catalogue',
      description: 'Approved & in stock',
      color: 'bg-green-500',
      count: 124,
      icon: ''
    },
    {
      id: 5,
      title: 'Order Serve Catalogue',
      description: 'Make-to-order items',
      color: 'bg-blue-500',
      count: 42,
      icon: ''
    },
    {
      id: 6,
      title: 'Out of Stock Catalogue',
      description: 'Temporarily unavailable',
      color: 'bg-gray-400',
      count: 8,
      icon: ''
    }
  ];

  return (
    <>
    <Header title="My Catalogue"/>
    <div className="catalogue-container">
      {/* Catalogue Items */}
      <div className="catalogue-list">
        {catalogueItems.map((item) => (
          <div key={item.id} className="catalogue-item" onClick={()=>nav(item.path)}>
            <div className={`item-vertical-line ${item.color}`} >
              <div className={`item-number ${item.color}`}>
                {item.id}
              </div>
            </div>
            
            <div className="item-content-wrapper">
              <div className="item-content">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
              
              <div className="item-actions">
                {item.count && (
                  <span className="item-count">{item.count}</span>
                )}
                {item.icon && (
                  <span className="item-icon" onClick={()=>nav(item.path)}>{item.icon}</span>
                )}

                <span className="arrow">{'>'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    </>
  );
};

export default MyCatalogue;