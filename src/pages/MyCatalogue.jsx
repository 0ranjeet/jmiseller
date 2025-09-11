import React, { useState, useEffect } from 'react';
import './MyCatalogue.css'
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { db } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useSeller } from '../contexts/SellerContext';

const MyCatalogue = () => {
  const nav = useNavigate();
  const { seller } = useSeller();
  const sellerId = seller?.sellerId;
  
  const [productCounts, setProductCounts] = useState({
    qcPending: 0,
    qcRejected: 0,
    readyStock: 0,
    orderServe: 0,
    outOfStock: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductCounts = async () => {
      try {
        if (!sellerId) {
          setLoading(false);
          return;
        }

        const productsRef = collection(db, 'products');
        const querySnapshot = await getDocs(productsRef);
        
        let qcPending = 0;
        let qcRejected = 0;
        let readyStock = 0;
        let orderServe = 0;
        let outOfStock = 0;

        querySnapshot.forEach((doc) => {
          const product = doc.data();
          
          // Only count products for current seller
          if (product.sellerId !== sellerId) return;
          
          // Count by status
          if (product.status === 'pending') {
            qcPending++;
          } else if (product.status === 'rejected') {
            qcRejected++;
          } 
          // Count by service type for approved products
          else if (product.status === 'approved') {
            if (product.serviceType === 'ready') {
              readyStock++;
            } else if (product.serviceType === 'order') {
              orderServe++;
            } else if (product.serviceType === 'out') {
              outOfStock++;
            }
          }
        });

        setProductCounts({
          qcPending,
          qcRejected,
          readyStock,
          orderServe,
          outOfStock
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching product counts:', error);
        setLoading(false);
      }
    };

    if (sellerId) {
      fetchProductCounts();
    }
  }, [sellerId]);

  // Map catalogue items to their corresponding types
  const getItemType = (id) => {
    switch(id) {
      case 2: return 'qc-pending';
      case 3: return 'qc-rejected';
      case 4: return 'ready-stock';
      case 5: return 'order-serve';
      case 6: return 'out-of-stock';
      default: return null;
    }
  };

  const catalogueItems = [
    {
      id: 1,
      title: 'Add Products',
      path: '/UploadProduct',
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
      count: loading ? '...' : productCounts.qcPending,
      icon: '',
      type: 'pending'
    },
    {
      id: 3,
      title: 'QC Rejected',
      description: 'Needs fixes & resubmission',
      color: 'bg-red-500',
      count: loading ? '...' : productCounts.qcRejected,
      icon: '',
      type: 'rejected'
    },
    {
      id: 4,
      title: 'Ready Stock Catalogue',
      description: 'Approved & in stock',
      color: 'bg-green-500',
      count: loading ? '...' : productCounts.readyStock,
      icon: '',
      type: 'ready'
    },
    {
      id: 5,
      title: 'Order Serve Catalogue',
      description: 'Make-to-order items',
      color: 'bg-blue-500',
      count: loading ? '...' : productCounts.orderServe,
      icon: '',
      type: 'order'
    },
    {
      id: 6,
      title: 'Out of Stock Catalogue',
      description: 'Temporarily unavailable',
      color: 'bg-gray-400',
      count: loading ? '...' : productCounts.outOfStock,
      icon: '',
      type: 'out'
    }
  ];

  const handleItemClick = (item) => {
    if (item.path) {
      nav(item.path);
    } else if (item.type) {
      // Navigate to the dynamic catalogue component with the type parameter
      nav(`/catalogue/${item.type}`);
    }
  };

  return (
    <>
      <Header title="My Catalogue" />
      <div >
        <div className="catalogue-list">
          {catalogueItems.map((item) => (
            <div 
              key={item.id} 
              className="catalogue-item" 
              onClick={() => handleItemClick(item)}
            >
              <div className={`item-vertical-line ${item.color}`}>
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
                  {item.count !== null && (
                    <span className="item-count">{item.count}</span>
                  )}
                  {item.icon && (
                    <span className="item-icon" onClick={(e) => {
                      e.stopPropagation();
                      handleItemClick(item);
                    }}>{item.icon}</span>
                  )}
                  <span className="arrow">{'>'}</span>
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

export default MyCatalogue;