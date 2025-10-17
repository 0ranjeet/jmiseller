import React, { useState, useEffect, useRef } from 'react';
import './Catalogue.css';
import { db } from '../services/firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useSeller } from '../contexts/SellerContext';
import productData from '../../src/pages/productData.json';
import { useNavigate } from 'react-router-dom';
import '../pages/LotDrawer.css';

const Catalogue = () => {
  const { type } = useParams();
  const { seller } = useSeller();
  const sellerId = seller?.sellerId;
  const navigate = useNavigate();
  
  // State Management
  const [allProducts, setAllProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('916HUID');
  const [selectedSubcategory, setSelectedSubcategory] = useState('KATAKI');
  
  // Drawer States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [lotSizes, setLotSizes] = useState([]);
  const [simpleStock, setSimpleStock] = useState({ grossWt: '', netWt: '', instockSet: '' });
  const sizeRowRefs = useRef({});

  // Constants
  const categories = productData.categoriesBySegment["GOLD"];
  const subcategories = productData.productSources;
  const productSizes = productData.productSizes;

  // Configuration
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
          text: 'StockOut',
          color: '#ef4444',
          onClick: (productId) => handleMarkOutOfStock(productId)
        },
        {
          text: 'Order',
          color: '#3b82f6',
          onClick: (productId) => handleMarkOrderServe(productId)
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
          text: 'Ready',
          color: '#f59e0b',
          onClick: (product) => openEditDrawer(product)
        },
        {
          text: 'StockOut',
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
          text: 'Ready',
          color: '#f59e0b',
          onClick: (product) => openEditDrawer(product)
        },
        {
          text: 'Order',
          color: '#3b82f6',
          onClick: (productId) => handleMarkOrderServe(productId)
        }
      ]
    }
  };

  const currentConfig = config[type] || config['pending'];

  // ========== LOT-SPECIFIC FUNCTIONS ==========

  const setSizeRowRef = (index, element) => {
    if (element) {
      sizeRowRefs.current[index] = element;
    }
  };

  const calculateItemAverages = (item) => {
    const set = parseFloat(item.set) || 1;
    const grossWt = parseFloat(item.grossWt) || 0;
    const netWt = parseFloat(item.netWt) || 0;

    return {
      avgGrossWt: (grossWt / set).toFixed(3),
      avgNetWt: (netWt / set).toFixed(3),
      avgSpecWt: ((grossWt - netWt) / set).toFixed(3)
    };
  };

  const calculateTotals = () => {
    return {
      totalSets: lotSizes.reduce((sum, item) => sum + (parseFloat(item.set) || 0), 0),
      totalGrossWt: lotSizes.reduce((sum, item) => sum + (parseFloat(item.grossWt) || 0), 0),
      totalNetWt: lotSizes.reduce((sum, item) => sum + (parseFloat(item.netWt) || 0), 0)
    };
  };

  const getSizeOptions = () => {
    if (!editingProduct) return [];
    const productName = editingProduct.productName.toUpperCase();
    const sizeInfo = productSizes[productName];
    return sizeInfo?.options || [];
  };

  const handleSizeChange = (index, field, value) => {
    if (field === 'size') {
      const duplicateIndex = lotSizes.findIndex(
        (item, i) => i !== index && item.size === value
      );

      if (duplicateIndex !== -1) {
        if (sizeRowRefs.current[duplicateIndex]) {
          sizeRowRefs.current[duplicateIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });

          const element = sizeRowRefs.current[duplicateIndex];
          element.classList.add('duplicate-highlight');
          setTimeout(() => {
            element.classList.remove('duplicate-highlight');
          }, 2000);
        }
        return;
      }
    }

    const newSizes = [...lotSizes];
    newSizes[index] = { ...newSizes[index], [field]: value };

    if (field === 'set' || field === 'grossWt' || field === 'netWt') {
      const averages = calculateItemAverages(newSizes[index]);
      newSizes[index] = {
        ...newSizes[index],
        avgGrossWt: averages.avgGrossWt,
        avgNetWt: averages.avgNetWt,
        avgSpecWt: averages.avgSpecWt
      };
    }

    setLotSizes(newSizes);
  };

  // ========== DRAWER MANAGEMENT ==========

  const openEditDrawer = (product) => {
    setEditingProduct(product);

    if (product.Lot && product.lotDetails && product.lotDetails.length > 0) {
      // Lot Product - Initialize lot sizes with proper structure
      const formattedLotDetails = product.lotDetails.map(item => ({
        set: item.set || '',
        size: item.size || '',
        grossWt: item.grossWt || '',
        netWt: item.netWt || '',
        avgGrossWt: item.avgGrossWt || '',
        avgNetWt: item.avgNetWt || '',
        avgSpecWt: item.avgSpecWt || ''
      }));
      setLotSizes(formattedLotDetails);
      setSimpleStock({ grossWt: '', netWt: '', instockSet: '' });
    } else {
      // Non-Lot Product - Initialize simple stock
      setSimpleStock({
        grossWt: product.grossWt?.toString() || '',
        netWt: product.netWt?.toString() || '',
        instockSet: product.instockSet?.toString() || ''
      });
      setLotSizes([]);
    }

    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingProduct(null);
    setLotSizes([]);
    setSimpleStock({ grossWt: '', netWt: '', instockSet: '' });
  };

  const handleSimpleStockChange = (field, value) => {
    setSimpleStock(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveData = async () => {
    if (!editingProduct) return;

    try {
      if (editingProduct.Lot) {
        // Save Lot Data
        await saveLotData();
      } else {
        // Save Simple Stock Data
        await saveSimpleStockData();
      }
      
      alert('Data updated successfully!');
      closeDrawer();
    } catch (error) {
      console.error('Error updating data:', error);
      alert('Error updating data. Please try again.');
    }
  };

  const saveLotData = async () => {
    try {
      // Calculate averages for each lot item
      const updatedLotSizes = lotSizes.map(item => {
        const set = parseFloat(item.set) || 1;
        const grossWt = parseFloat(item.grossWt) || 0;
        const netWt = parseFloat(item.netWt) || 0;
        
        return {
          set: item.set.toString(),
          size: item.size,
          grossWt: item.grossWt.toString(),
          netWt: item.netWt.toString(),
          avgGrossWt: (grossWt / set).toFixed(3),
          avgNetWt: (netWt / set).toFixed(3),
          avgSpecWt: ((grossWt - netWt) / set).toFixed(3)
        };
      });

      const totals = calculateTotals();

      console.log('Updating lot product with data:', {
        lotDetails: updatedLotSizes,
        lotTotals: totals,
        grossWt: totals.totalGrossWt.toFixed(3),
        netWt: totals.totalNetWt.toFixed(3),
        instockGram: totals.totalGrossWt.toFixed(3),
        instockSet: totals.totalSets.toString(),
        sizes: updatedLotSizes.map(item => item.size).filter(Boolean),
        serviceType: 'ready' // Add serviceType update
      });

      const productRef = doc(db, 'products', editingProduct.id);
      await updateDoc(productRef, {
        lotDetails: updatedLotSizes,
        lotTotals: totals,
        grossWt: totals.totalGrossWt.toFixed(3),
        netWt: totals.totalNetWt.toFixed(3),
        instockGram: totals.totalGrossWt.toFixed(3),
        instockSet: totals.totalSets.toString(),
        sizes: updatedLotSizes.map(item => item.size).filter(Boolean),
        serviceType: 'ready' // Update serviceType to ready
      });

      // Update local state
      setAllProducts(prev => prev.map(product =>
        product.id === editingProduct.id
          ? {
            ...product,
            lotDetails: updatedLotSizes,
            lotTotals: totals,
            grossWt: totals.totalGrossWt.toFixed(3),
            netWt: totals.totalNetWt.toFixed(3),
            instockGram: totals.totalGrossWt.toFixed(3),
            instockSet: totals.totalSets.toString(),
            sizes: updatedLotSizes.map(item => item.size).filter(Boolean),
            serviceType: 'ready'
          }
          : product
      ));

    } catch (error) {
      console.error('Error in saveLotData:', error);
      throw error;
    }
  };

  const saveSimpleStockData = async () => {
    try {
      // Calculate specification weight for non-lot products
      const grossWtValue = parseFloat(simpleStock.grossWt) || 0;
      const netWtValue = parseFloat(simpleStock.netWt) || 0;
      const specificationWt = (grossWtValue - netWtValue).toFixed(3);

      console.log('Updating simple product with data:', {
        grossWt: simpleStock.grossWt,
        netWt: simpleStock.netWt,
        instockSet: simpleStock.instockSet,
        instockGram: simpleStock.grossWt,
        specificationWt: specificationWt,
        serviceType: 'ready' // Add serviceType update
      });

      const productRef = doc(db, 'products', editingProduct.id);
      await updateDoc(productRef, {
        grossWt: simpleStock.grossWt,
        netWt: simpleStock.netWt,
        instockSet: simpleStock.instockSet,
        instockGram: simpleStock.grossWt,
        specificationWt: specificationWt,
        serviceType: 'ready' // Update serviceType to ready
      });

      // Update local state
      setAllProducts(prev => prev.map(product =>
        product.id === editingProduct.id
          ? {
            ...product,
            grossWt: simpleStock.grossWt,
            netWt: simpleStock.netWt,
            instockSet: simpleStock.instockSet,
            instockGram: simpleStock.grossWt,
            specificationWt: specificationWt,
            serviceType: 'ready'
          }
          : product
      ));

    } catch (error) {
      console.error('Error in saveSimpleStockData:', error);
      throw error;
    }
  };

  // ========== PRODUCT DISPLAY & UTILITIES ==========

  const getProductDisplayInfo = (product) => {
    if (product.Lot && product.lotDetails && product.lotDetails.length > 0) {
      const totalSets = product.lotTotals?.totalSets || product.lotDetails.reduce((sum, item) => sum + (parseFloat(item.set) || 0), 0);
      const totalNetWt = product.lotTotals?.totalNetWt || product.lotDetails.reduce((sum, item) => sum + (parseFloat(item.netWt) || 0), 0);
      const totalGrossWt = product.lotTotals?.totalGrossWt || product.lotDetails.reduce((sum, item) => sum + (parseFloat(item.grossWt) || 0), 0);

      const sizes = product.lotDetails.map(item => item.size).filter(Boolean);
      const uniqueSizes = [...new Set(sizes)];

      return {
        displayWeight: `${totalNetWt.toFixed(3)}g`,
        displaySets: `${totalSets} sets`,
        displaySizes: uniqueSizes.join(', '),
        isLot: true,
        totalSets,
        totalNetWt,
        totalGrossWt
      };
    } else {
      return {
        displayWeight: `${product.netWt || 0}g`,
        displaySets: product.instockSet ? `${product.instockSet} sets` : '',
        displaySizes: Array.isArray(product.sizes) ? product.sizes.join(', ') : product.sizes || '',
        isLot: false
      };
    }
  };

  const handleMarkOutOfStock = async (productId) => {
    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, { serviceType: 'out' });

      setAllProducts(prev => prev.map(product =>
        product.id === productId ? { ...product, serviceType: 'out' } : product
      ));

      alert('Product marked as Out of Stock successfully!');
    } catch (error) {
      console.error('Error marking product as Out of Stock:', error);
      alert('Error marking product as Out of Stock. Please try again.');
    }
  };

  

  const handleMarkOrderServe = async (productId) => {
    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, { serviceType: 'order' });

      setAllProducts(prev => prev.map(product =>
        product.id === productId ? { ...product, serviceType: 'order' } : product
      ));

      alert('Product marked as Order Serve successfully!');
    } catch (error) {
      console.error('Error marking product as Order Serve:', error);
      alert('Error marking product as Order Serve. Please try again.');
    }
  };

  const handleProductClick = (product) => {
    navigate(`/product/${product.id}`, { state: { product } });
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
  };

  const handleSubcategoryClick = (subcategory) => {
    setSelectedSubcategory(subcategory);
  };

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

  useEffect(() => {
    if (!sellerId || allProducts.length === 0) return;

    const filteredProducts = allProducts.filter(product => {
      if (product.sellerId !== sellerId) return false;

      if (currentConfig.filterStatus === 'pending' || currentConfig.filterStatus === 'rejected') {
        if (product.status !== currentConfig.filterStatus) return false;
      } else {
        if (product.status !== 'approved' || product.serviceType !== currentConfig.serviceType) return false;
      }

      if (selectedCategory && product.category !== selectedCategory) return false;
      if (selectedSubcategory && product.productSource !== selectedSubcategory) return false;

      return true;
    });

    setProducts(filteredProducts);
  }, [allProducts, sellerId, type, currentConfig.filterStatus, currentConfig.serviceType, selectedCategory, selectedSubcategory]);

  // ========== RENDER COMPONENTS ==========

  const renderLotDrawerContent = () => {
    const totals = calculateTotals();

    return (
      <>
        <div className="size-input-section">
          <h4>{editingProduct.productName} - {editingProduct.specification}</h4>
          {lotSizes.map((item, index) => (
            <div
              key={index}
              className="size-row"
              ref={el => setSizeRowRef(index, el)}
              data-row-index={index}
            >
              <div className="form-group">
                <label>Size</label>
                <select
                  value={item.size}
                  onChange={(e) => handleSizeChange(index, 'size', e.target.value)}
                  data-row-index={index}
                >
                  <option value="">Select Size</option>
                  {getSizeOptions().map(size => (
                    <option
                      key={size}
                      value={size}
                      disabled={lotSizes.some((item, i) => i !== index && item.size === size)}
                    >
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Set</label>
                <input
                  type="number"
                  value={item.set}
                  onChange={(e) => handleSizeChange(index, 'set', e.target.value)}
                  data-row-index={index}
                />
              </div>

              <div className="form-group">
                <label>Gross Wt. (g)</label>
                <input
                  type="number"
                  step="0.001"
                  value={item.grossWt}
                  onChange={(e) => handleSizeChange(index, 'grossWt', e.target.value)}
                  data-row-index={index}
                />
              </div>

              <div className="form-group">
                <label>Net Wt. (g)</label>
                <input
                  type="number"
                  step="0.001"
                  value={item.netWt}
                  onChange={(e) => handleSizeChange(index, 'netWt', e.target.value)}
                  data-row-index={index}
                />
              </div>

              {/* Display calculated averages */}
              {(item.avgGrossWt || item.avgNetWt || item.avgSpecWt) && (
                <div className="calculated-averages">
                  <div className="avg-item">
                    <span>Avg Gross: {item.avgGrossWt}g</span>
                  </div>
                  <div className="avg-item">
                    <span>Avg Net: {item.avgNetWt}g</span>
                  </div>
                  <div className="avg-item">
                    <span>Avg Spec: {item.avgSpecWt}g</span>
                  </div>
                </div>
              )}

              {lotSizes.length > 1 && (
                <button
                  type="button"
                  className="remove-size-btn"
                  onClick={() => {
                    const newSizes = lotSizes.filter((_, i) => i !== index);
                    setLotSizes(newSizes);
                  }}
                  title="Remove this size"
                >
                  ×
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={() => {
              const availableSizes = getSizeOptions().filter(
                size => !lotSizes.some(item => item.size === size)
              );

              if (availableSizes.length === 0) {
                alert('All available sizes have been added.');
                return;
              }

              setLotSizes([...lotSizes, {
                set: '',
                size: '',
                grossWt: '',
                netWt: '',
                avgGrossWt: '',
                avgNetWt: '',
                avgSpecWt: ''
              }]);
            }}
            className="add-size-btn"
            disabled={lotSizes.length >= getSizeOptions().length}
          >
            + Add More Size
          </button>
        </div>

        {/* Totals Display */}
        <div className="totals-section">
          <h4>Lot Totals</h4>
          <div className="totals-grid">
            <div className="total-item">
              <span>Total Sets:</span>
              <strong>{totals.totalSets}</strong>
            </div>
            <div className="total-item">
              <span>Total Gross Wt:</span>
              <strong>{totals.totalGrossWt.toFixed(3)}g</strong>
            </div>
            <div className="total-item">
              <span>Total Net Wt:</span>
              <strong>{totals.totalNetWt.toFixed(3)}g</strong>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderSimpleStockDrawerContent = () => {
    return (
      <div className="simple-stock-section">
        <h4>{editingProduct.productName} - {editingProduct.specification}</h4>
        <div className="form-grid">
          <div className="form-group">
            <label>Gross Weight (g)</label>
            <input
              type="number"
              step="0.001"
              value={simpleStock.grossWt}
              onChange={(e) => handleSimpleStockChange('grossWt', e.target.value)}
              placeholder="Enter gross weight"
            />
          </div>
          <div className="form-group">
            <label>Net Weight (g)</label>
            <input
              type="number"
              step="0.001"
              value={simpleStock.netWt}
              onChange={(e) => handleSimpleStockChange('netWt', e.target.value)}
              placeholder="Enter net weight"
            />
          </div>
          <div className="form-group">
            <label>Stock Sets</label>
            <input
              type="number"
              value={simpleStock.instockSet}
              onChange={(e) => handleSimpleStockChange('instockSet', e.target.value)}
              placeholder="Enter number of sets"
            />
          </div>
        </div>
        {simpleStock.grossWt && simpleStock.netWt && (
          <div className="calculated-values">
            <p><strong>Calculated {editingProduct.specification} Weight:</strong> {(parseFloat(simpleStock.grossWt) - parseFloat(simpleStock.netWt)).toFixed(3)}g</p>
          </div>
        )}
      </div>
    );
  };

  // ========== MAIN RENDER ==========

  if (loading) {
    return (
      <div className="catlouge-container">
        <PageHeader title={currentConfig.title} />
        <div className="loading-container">
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader title={currentConfig.title} />
      <div className="catlouge-container">
        {/* Filters Section */}
        <div className="filters">
          <div className="filter-group">
            <h3>Category</h3>
            <div className="horizontal-scroll-container">
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
            <div className="horizontal-scroll-container">
              {subcategories.map((subcategory) => (
                <button
                  key={subcategory}
                  className={`category-button ${selectedSubcategory === subcategory ? 'active' : ''}`}
                  onClick={() => handleSubcategoryClick(subcategory)}
                >
                  {subcategory}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Product Count */}
        <div className="product-count">
          <p>{products.length} Products found</p>
        </div>

        {/* Products Grid */}
        <div className="products-grid">
          {products.length === 0 ? (
            <div className="no-products">
              No {currentConfig.title.toLowerCase()} products found in {selectedCategory}-{selectedSubcategory}
            </div>
          ) : (
            products.map((product, index) => {
              const displayInfo = getProductDisplayInfo(product);

              return (
                <div
                  className="catalog-card"
                  key={`${product.id}-${index}`}
                  onClick={() => handleProductClick(product)}
                >
                  <div className="product-image" >
                    {product.images && product.images.length > 0 && (
                      <img
                        src={product.images[0].url?.trim()}
                        alt={product.productName}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/200x200?text=No+Image';
                        }}
                      />
                    )}
                    {(!product.images || product.images.length === 0) && (
                      <div className="no-image-placeholder">No Image</div>
                    )}

                    {displayInfo.isLot && (
                      <div className="lot-badge">LOT</div>
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
                    <p className="product-category">
                      {product.styleType} / {product.specification}
                    </p>

                    {displayInfo.isLot ? (
                      <>
                        <p className="product-weight-price">
                          {displayInfo.displayWeight} • {displayInfo.displaySets}
                        </p>
                        <p className="product-sizes">
                          Sizes: {displayInfo.displaySizes}
                        </p>
                      </>
                    ) : (
                      <p className="product-weight-price">
                        {displayInfo.displayWeight} {displayInfo.displaySets && `• ${displayInfo.displaySets}`}
                      </p>
                    )}

                    {!displayInfo.isLot && displayInfo.displaySizes && (
                      <p className="product-sizes">
                        Size: {displayInfo.displaySizes}
                      </p>
                    )}
                  </div>

                  {currentConfig.actionButtons && currentConfig.actionButtons.length > 0 && (
                    <div className="action-buttons">
                      {currentConfig.actionButtons.map((button, btnIndex) => (
                        <button
                          key={btnIndex}
                          className="action-btn"
                          style={{ backgroundColor: button.color }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (button.text === 'Ready') {
                              button.onClick(product);
                            } else {
                              button.onClick(product.id);
                            }
                          }}
                        >
                          {button.text}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Edit Drawer */}
        {drawerOpen && editingProduct && (
          <div className="lot-drawer-overlay" onClick={closeDrawer}>
            <div className="lot-drawer" onClick={e => e.stopPropagation()}>
              <div className="drawer-header">
                <h3>Edit {editingProduct.Lot ? 'Lot' : 'Stock'} Details</h3>
                <button className="close-btn" onClick={closeDrawer}>×</button>
              </div>

              <div className="drawer-body">
                {editingProduct.Lot ? renderLotDrawerContent() : renderSimpleStockDrawerContent()}
              </div>

              <div className="drawer-footer">
                <button className="cancel-btn" onClick={closeDrawer}>Cancel</button>
                <button
                  className="save-btn"
                  onClick={handleSaveData}
                  disabled={
                    editingProduct.Lot 
                      ? lotSizes.length === 0 || !lotSizes.every(item => item.size && item.set && item.grossWt && item.netWt)
                      : !simpleStock.grossWt || !simpleStock.netWt || !simpleStock.instockSet
                  }
                >
                  Save & Mark as Ready
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Catalogue;