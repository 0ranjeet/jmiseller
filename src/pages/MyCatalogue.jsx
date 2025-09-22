import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { db } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useSeller } from '../contexts/SellerContext';
import {
  ChevronRight,
} from 'lucide-react';
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

  

  const catalogueItems = [
    {
      id: 1,
      title: 'Add Products',
      path: '/UploadProduct',
      description: 'Create new listings',
      color: 'yellow',
      count: null,
      icon: '+'
    },
    {
      id: 2,
      title: 'QC Pending',
      description: 'Awaiting quality check',
      color: 'yellow',
      count: loading ? '...' : productCounts.qcPending,
      icon: <ChevronRight />,
      type: 'pending'
    },
    {
      id: 3,
      title: 'QC Rejected',
      description: 'Needs fixes & resubmission',
      color: 'red',
      count: loading ? '...' : productCounts.qcRejected,
      icon: <ChevronRight />,
      type: 'rejected'
    },
    {
      id: 4,
      title: 'Ready Stock Catalogue',
      description: 'Approved & in stock',
      color: 'purple',
      count: loading ? '...' : productCounts.readyStock,
      icon: <ChevronRight />, 
      type: 'ready'
    },
    {
      id: 5,
      title: 'Order Serve Catalogue',
      description: 'Make-to-order items',
      color: 'light-blue',
      count: loading ? '...' : productCounts.orderServe,
      icon: <ChevronRight />,
      type: 'order'
    },
    {
      id: 6,
      title: 'Out of Stock Catalogue',
      description: 'Temporarily unavailable',
      color: 'green',
      count: loading ? '...' : productCounts.outOfStock,
      icon: <ChevronRight />,
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
      <div className="workflow-container">
        <div className="workflow-steps">
          {catalogueItems.map((item) => (
            <div
              key={item.id}
              className="step-card"
              onClick={() => handleItemClick(item)}
            >
              {/* ✅ Step line on top (same as 1st part) */}
              <div className={`step-line ${item.color}`} />

              {/* ✅ Main content wrapper */}
              <div className="readystep-content">
                {/* Step number */}
                <div className={`step-number ${item.color}`}>
                  {item.id}
                </div>

                {/* Details */}
                <div className="step-details">
                  <h3 className="workstep-title">{item.title}</h3>
                  <p className="step-subtitle">{item.description}</p>
                </div>

                {/* Count + Icon (same role as arrow in 1st part) */}
                <div className="step-count">
                  <span>{item.count}</span>
                  <span
                    className="arrow"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleItemClick(item);
                    }}
                  >
                    {item.icon}
                  </span>
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