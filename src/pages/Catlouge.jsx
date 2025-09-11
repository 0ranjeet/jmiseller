import React, { useState, useEffect } from 'react';
import './Catalogue.css';
import { db } from '../services/firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useSeller } from '../contexts/SellerContext';

const Catalogue = () => {
  const { type } = useParams(); // Get type from URL params
  const { seller } = useSeller();
  const sellerId = seller?.sellerId;
  
  const [allProducts, setAllProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('916 HUID');
  const [selectedSubcategory, setSelectedSubcategory] = useState('MACHINE MADE');

  // Categories and subcategories data
  const categories = ['916 HUID', '840 ORNA', '750 HUID', '680'];
  const subcategories = ['MACHINE MADE', 'CASTING', 'CNC', 'KUNDAN'];

  // Configure based on type
  const config = {
    'pending': {
      title: 'QC Pending',
      filterStatus: 'pending',
      badgeText: 'QC Pending',
      badgeColor: '#fbbf24',
      badgeBorderColor: '#d97706',
      actionButtons: []
    },
    'rejected': {
      title: 'QC Rejected',
      filterStatus: 'rejected',
      badgeText: 'QC Rejected',
      badgeColor: '#ef4444',
      badgeBorderColor: '#dc2626',
      actionButtons: []
    },
    'ready': {
      title: 'Ready Stock Catalogue',
      filterStatus: 'approved',
      serviceType: 'ready',
      badgeText: 'Ready Stock',
      badgeColor: '#10b981',
      badgeBorderColor: '#059669',
      actionButtons: [
        {
          text: 'Mark Out of Stock',
          color: '#ef4444',
          onClick: (productId) => handleMarkOutOfStock(productId)
        }
      ]
    },
    'order': {
      title: 'Order Serve Catalogue',
      filterStatus: 'approved',
      serviceType: 'order',
      badgeText: 'Order Serve',
      badgeColor: '#3b82f6',
      badgeBorderColor: '#2563eb',
      actionButtons: [
        {
          text: 'Mark Out of Stock',
          color: '#ef4444',
          onClick: (productId) => handleMarkOutOfStock(productId)
        }
      ]
    },
    'out': {
      title: 'Out of Stock Catalogue',
      filterStatus: 'approved',
      serviceType: 'out',
      badgeText: 'Out of Stock',
      badgeColor: '#9ca3af',
      badgeBorderColor: '#6b7280',
      actionButtons: [
        {
          text: 'Mark Ready Serve',
          color: '#f59e0b',
          onClick: (productId) => handleMarkReadyServe(productId)
        }
      ]
    }
  };

  const currentConfig = config[type] || config['pending'];

  // Fetch all products once
  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        setLoading(true);
        const productsRef = collection(db, 'products');
        const q = query(productsRef, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const productsList = [];
        querySnapshot.forEach((doc) => {
          productsList.push({ id: doc.id, ...doc.data() });
        });
        
        setAllProducts(productsList);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error);
        setLoading(false);
      }
    };

    fetchAllProducts();
  }, []);

  // Filter products based on type and sellerId
  useEffect(() => {
    if (!sellerId || allProducts.length === 0) return;

    const filteredProducts = allProducts.filter(product => {
      // Check seller ID first
      if (product.sellerId !== sellerId) return false;
      
      // Then apply type-specific filters
      if (currentConfig.filterStatus === 'pending' || currentConfig.filterStatus === 'rejected') {
        return product.status === currentConfig.filterStatus;
      } else {
        return product.status === 'approved' && product.serviceType === currentConfig.serviceType;
      }
    });

    setProducts(filteredProducts);
  }, [allProducts, sellerId, type]);

  const handleMarkOutOfStock = async (productId) => {
    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        serviceType: 'out'
      });
      
      // Update local state
      setAllProducts(prev => prev.map(product => 
        product.id === productId 
          ? { ...product, serviceType: 'out' }
          : product
      ));
      
      alert('Product marked as Out of Stock successfully!');
    } catch (error) {
      console.error('Error marking product as Out of Stock:', error);
      alert('Error marking product as Out of Stock. Please try again.');
    }
  };

  const handleMarkReadyServe = async (productId) => {
    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        serviceType: 'ready'
      });
      
      // Update local state
      setAllProducts(prev => prev.map(product => 
        product.id === productId 
          ? { ...product, serviceType: 'ready' }
          : product
      ));
      
      alert('Product marked as Ready Serve successfully!');
    } catch (error) {
      console.error('Error marking product as Ready Serve:', error);
      alert('Error marking product as Ready Serve. Please try again.');
    }
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
  };

  const handleSubcategoryClick = (subcategory) => {
    setSelectedSubcategory(subcategory);
  };

  if (loading) {
    return (
      <div className="catalogue-container">
        <PageHeader title={currentConfig.title} />
        <div className="loading-container">
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="catalogue-container">
      <PageHeader title={currentConfig.title} />

      <div className="filters">
        <div className="filter-group">
          <h3>Category</h3>
          <div className="category-buttons">
            {categories.map((category) => (
              <button
                key={category}
                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <h3>Subcategory</h3>
          <div className="subcategory-buttons">
            {subcategories.map((subcategory) => (
              <button
                key={subcategory}
                className={`subcategory-btn ${selectedSubcategory === subcategory ? 'active' : ''}`}
                onClick={() => handleSubcategoryClick(subcategory)}
              >
                {subcategory}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="product-count">
        <p>{products.length} Products found</p>
      </div>

      <div className="products-grid">
        {products.length === 0 ? (
          <div className="no-products">
            No {currentConfig.title.toLowerCase()} products found
          </div>
        ) : (
          products.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-image">
                {product.images && product.images.length > 0 && (
                  <img 
                    src={product.images[0].url?.trim()} 
                    alt={product.productName}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/200x200?text=No+Image';
                    }}
                  />
                )}
                {!product.images || product.images.length === 0 && (
                  <div className="no-image-placeholder">No Image</div>
                )}
                <div 
                  className="status-badge"
                  style={{ 
                    backgroundColor: currentConfig.badgeColor,
                    borderColor: currentConfig.badgeBorderColor,
                    color: '#1f2937'
                  }}
                >
                  {currentConfig.badgeText}
                </div>
              </div>
              
              <div className="product-info">
                <h3 className="product-name">{product.productName}</h3>
                <p className="product-category">
                  {product.segment} / {product.category}
                </p>
                <p className="product-weight-price">
                  {product.netWt}g • ₹{product.price?.toLocaleString()}
                </p>
                <p className="product-sku">
                  SKU: {product.sku}
                </p>
              </div>
              
              {/* Action buttons */}
              {currentConfig.actionButtons && currentConfig.actionButtons.length > 0 && (
                <div className="action-buttons">
                  {currentConfig.actionButtons.map((button, index) => (
                    <button
                      key={index}
                      className="action-btn"
                      style={{ backgroundColor: button.color }}
                      onClick={() => button.onClick(product.id)}
                    >
                      {button.text}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Catalogue;