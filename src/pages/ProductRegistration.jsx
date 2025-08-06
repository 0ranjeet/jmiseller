import React, { useState, useEffect, useMemo } from 'react';
import { X, Edit, ChevronDown } from 'lucide-react';

// Firebase imports (using your provided path)
import { db } from '../services/firebase'; // Assuming this file initializes and exports 'db'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import mangtika from "../category/mangtika.png"

// In a real project, you would import your CSS file like this:
import './ProductRegistration.css';

const ProductRegistration = () => {
  const sellerid = localStorage.getItem("sellerMobile"); // Get seller ID from localStorage
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [currentProductForDetails, setCurrentProductForDetails] = useState(null);
  const [currentStyleType, setCurrentStyleType] = useState('regular');
  const [productDetails, setProductDetails] = useState({
    purity: '',
    wastage: '',
    setMC: '',
    netGramMC: '',
    specifications: {
      meenaWork: { wastage: '', gramRate: '' },
      stoneWork: { wastage: '', gramRate: '' },
      otherWork: { wastage: '', gramRate: '' }
    }
  });
  // const [message, setMessage] = useState('');

  const categories = ['916 HUID', '840 ORNA', '750 HUID', '680', '999 PURE', '875 GOLD', '585 GOLD'];
  const subcategories = ['MACHINE MADE', 'CASTING', 'CNC', 'KANCHIPURAM', 'HANDMADE', 'DESIGNER', 'ANTIQUE'];

  const allProducts = [
    {
      id: 1,
      name: 'Maang Tika',
      image: 'https://placehold.co/60x60/E0E0E0/333333?text=MT',
      categoryId: '916 HUID',
      subcategoryId: 'MACHINE MADE',
      styleTypes: ['highFancy', 'highFinish', 'lightWeight']
    },
    {
      id: 2,
      name: 'Chhapka',
      image: 'https://placehold.co/60x60/E0E0E0/333333?text=CH',
      categoryId: '916 HUID',
      subcategoryId: 'MACHINE MADE',
      styleTypes: ['highFancy', 'highFinish', 'lightWeight']
    },
    {
      id: 3,
      name: 'Nath',
      image: 'https://placehold.co/60x60/E0E0E0/333333?text=NT',
      categoryId: '916 HUID',
      subcategoryId: 'MACHINE MADE',
      styleTypes: ['highFancy', 'highFinish', 'lightWeight']
    },
    {
      id: 4,
      name: 'Ring',
      image: 'https://placehold.co/60x60/E0E0E0/333333?text=RG',
      categoryId: '840 ORNA',
      subcategoryId: 'HANDMADE',
      styleTypes: ['highFancy', 'lightWeight']
    },
    {
      id: 5,
      name: 'Bracelet',
      image: 'https://placehold.co/60x60/E0E0E0/333333?text=BR',
      categoryId: '840 ORNA',
      subcategoryId: 'HANDMADE',
      styleTypes: ['highFinish']
    },
    {
      id: 6,
      name: 'Necklace',
      image: 'https://placehold.co/60x60/E0E0E0/333333?text=NL',
      categoryId: '750 HUID',
      subcategoryId: 'DESIGNER',
      styleTypes: ['highFancy', 'highFinish', 'lightWeight']
    },
    {
      id: 7,
      name: 'Earrings',
      image: 'https://placehold.co/60x60/E0E0E0/333333?text=ER',
      categoryId: '750 HUID',
      subcategoryId: 'DESIGNER',
      styleTypes: ['regular', 'highFancy']
    },
  ];

  const [productData, setProductData] = useState(() => {
    const initialProductData = {};
    allProducts.forEach(product => {
      initialProductData[product.id] = {
        selectedStyleType: null, // Track which style type is currently selected for this product
        regular: {
          selected: false,
          image: null,
          details: {
            purity: '',
            wastage: '',
            setMC: '',
            netGramMC: '',
            specifications: {
              meenaWork: { wastage: '', gramRate: '' },
              stoneWork: { wastage: '', gramRate: '' },
              otherWork: { wastage: '', gramRate: '' }
            }
          }
        },
      };

      // Initialize all possible style types
      const allPossibleStyleTypes = ['regular', 'highFancy', 'highFinish', 'lightWeight'];
      allPossibleStyleTypes.forEach(styleType => {
        if (!initialProductData[product.id][styleType]) {
          initialProductData[product.id][styleType] = {
            selected: false,
            image: null,
            details: {
              purity: '',
              wastage: '',
              setMC: '',
              netGramMC: '',
              specifications: {
                meenaWork: { wastage: '', gramRate: '' },
                stoneWork: { wastage: '', gramRate: '' },
                otherWork: { wastage: '', gramRate: '' }
              }
            }
          };
        }
      });
    });
    return initialProductData;
  });

  // This useMemo now filters products based on selected category only
  const filteredProducts = useMemo(() => {
    if (!selectedCategory) {
      return []; // No products displayed until a category is selected
    }
    return allProducts.filter(
      (product) => product.categoryId === selectedCategory
    );
  }, [selectedCategory, allProducts]);

  const getStyleLabel = (style) => {
    const labels = {
      regular: 'Regular',
      highFancy: 'High Fancy',
      highFinish: 'High Finish',
      lightWeight: 'Light Weight'
    };
    return labels[style];
  };

  const handleStyleSelect = (productId, styleType) => {
    const newProductData = { ...productData };
    const currentSelectedStyle = newProductData[productId].selectedStyleType;

    // If clicking the same style that's already selected, deselect it
    if (currentSelectedStyle === styleType) {
      newProductData[productId].selectedStyleType = null;
      newProductData[productId][styleType].selected = false;

      // Remove from selected products
      setSelectedProducts(selectedProducts.filter(p => !(p.productId === productId)));
    } else {
      // Deselect previous style if any
      if (currentSelectedStyle) {
        newProductData[productId][currentSelectedStyle].selected = false;
      }

      // Select new style
      newProductData[productId].selectedStyleType = styleType;
      newProductData[productId][styleType].selected = true;

      // Update selected products list
      const updatedSelectedProducts = selectedProducts.filter(p => p.productId !== productId);
      setSelectedProducts([...updatedSelectedProducts, { productId: productId, styleType: styleType }]);

      // Open popup for details if no details exist
      if (!newProductData[productId][styleType].details ||
        !newProductData[productId][styleType].details.purity) {
        setCurrentProductForDetails(productId);
        setCurrentStyleType(styleType);
        setProductDetails({ ...newProductData[productId][styleType].details });
        setShowProductDetails(true);
      }
    }

    setProductData(newProductData);
  };

  const handleEditDetails = (productId, styleType) => {
    const detailsToEdit = productData[productId][styleType].details;
    setCurrentProductForDetails(productId);
    setCurrentStyleType(styleType);
    setProductDetails(detailsToEdit);
    setShowProductDetails(true);
  };

  // Image upload function for the selected style
  const handleImageUpload = async (event, productId) => {
    event.stopPropagation();
    const file = event.target.files[0];
    if (!file) return;

    // Use selected style or default to regular for image upload
    const currentSelectedStyle = productData[productId].selectedStyleType || 'regular';

    const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
    const CLOUDINARY_UPLOAD_PRESET = "jmiseller";
    const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(CLOUDINARY_API_URL, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();

      if (data.secure_url) {
        const newProductData = { ...productData };
        newProductData[productId][currentSelectedStyle].image = data.secure_url;

        // If uploading to regular and no style is selected, don't auto-select regular
        // If uploading to a selected style, ensure it stays selected
        if (currentSelectedStyle !== 'regular') {
          if (!newProductData[productId][currentSelectedStyle].selected) {
            newProductData[productId].selectedStyleType = currentSelectedStyle;
            newProductData[productId][currentSelectedStyle].selected = true;
            const updatedSelectedProducts = selectedProducts.filter(p => p.productId !== productId);
            setSelectedProducts([...updatedSelectedProducts, { productId: productId, styleType: currentSelectedStyle }]);
          }
        }
        setProductData(newProductData);
      } else {
        console.error('Cloudinary upload error:', data);
      }
    } catch (error) {
      console.error('Error uploading image to Cloudinary:', error);
      const reader = new FileReader();
      reader.onloadend = () => {
        const newProductData = { ...productData };
        newProductData[productId][currentSelectedStyle].image = reader.result;
        if (currentSelectedStyle !== 'regular') {
          if (!newProductData[productId][currentSelectedStyle].selected) {
            newProductData[productId].selectedStyleType = currentSelectedStyle;
            newProductData[productId][currentSelectedStyle].selected = true;
            const updatedSelectedProducts = selectedProducts.filter(p => p.productId !== productId);
            setSelectedProducts([...updatedSelectedProducts, { productId: productId, styleType: currentSelectedStyle }]);
          }
        }
        setProductData(newProductData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCardClick = (productId) => {
    // When the main card is clicked, select regular style if no style is selected
    if (!productData[productId].selectedStyleType) {
      handleStyleSelect(productId, 'regular');
    }
  };

  const handleSaveProductDetails = () => {
    const newProductData = { ...productData };

    // Update the details for the current style being edited/saved
    newProductData[currentProductForDetails][currentStyleType].details = { ...productDetails };

    // Ensure the style is marked as selected if details are saved
    newProductData[currentProductForDetails][currentStyleType].selected = true;
    newProductData[currentProductForDetails].selectedStyleType = currentStyleType;

    // Update selected products list
    const updatedSelectedProducts = selectedProducts.filter(p => p.productId !== currentProductForDetails);
    setSelectedProducts([...updatedSelectedProducts, { productId: currentProductForDetails, styleType: currentStyleType }]);

    setProductData(newProductData);
    setShowProductDetails(false);
  };

  const handleSendToQC = async () => {
    if (!sellerid) {
      return;
    }

    try {
      // Use seller mobile number as document ID
      const docRef = doc(db, 'Prodcutregistrations', sellerid);

      const productsToSave = {};
      for (const productId in productData) {
        const productInfo = allProducts.find(p => p.id === parseInt(productId));
        const selectedStyle = productData[productId].selectedStyleType;

        if (productInfo && selectedStyle && productData[productId][selectedStyle].selected) {
          const styleData = productData[productId][selectedStyle];
          productsToSave[productInfo.name] = {
            selectedStyleType: selectedStyle,
            styleData: {
              details: styleData.details,
              image: styleData.image || null
            }
          };
        }
      }

      await setDoc(docRef, {
        category: selectedCategory,
        subcategory: selectedSubcategory,
        sellerId: sellerid,
        products: productsToSave,
        status: 'pending_approval', // Request approval status
        requestTimestamp: serverTimestamp(),
        approved: false
      }, { merge: true });

      console.log('Product data saved to Firestore for approval:', productsToSave);
    } catch (error) {
      console.error('Error sending data for approval:', error);
    }
  };

  const getTotalSelected = () => {
    return selectedProducts.length;
  };

  const hasStyleSelected = (productId) => {
    return productData[productId].selectedStyleType !== null;
  };

  const getCurrentImage = (productId) => {
    const selectedStyle = productData[productId].selectedStyleType;
    // If a style is selected, use that style's image, otherwise use regular's image
    if (selectedStyle) {
      return productData[productId][selectedStyle].image;
    }
    return productData[productId].regular.image;
  };

  const getCurrentDetails = (productId) => {
    const selectedStyle = productData[productId].selectedStyleType;
    // If a style is selected, use that style's details, otherwise use regular's details
    if (selectedStyle) {
      return productData[productId][selectedStyle].details;
    }
    return productData[productId].regular.details;
  };

  const renderProductDetailsPopup = () => {
    if (!showProductDetails) return null;

    const currentProduct = allProducts.find(p => p.id === currentProductForDetails);

    return (
      <div className="product-details-overlay">
        <div className="product-details-popup">
          <div className="popup-header">
            <h3 className="popup-title">
              Enter Product Details - {currentProduct?.name} ({getStyleLabel(currentStyleType)})
            </h3>
            <X
              onClick={() => setShowProductDetails(false)}
              className="popup-close-icon"
            />
          </div>

          <div className="popup-content">
            {/* Display only - no image upload in popup */}
            <div className="form-group" style={{ textAlign: 'center', marginBottom: '25px' }}>
              <label className="form-label" style={{ marginBottom: '10px' }}>
                Sample Image for {getStyleLabel(currentStyleType)}
              </label>
              <div className="product-image-upload-area">
                {currentProduct ? (
                  <img
                    src={currentProduct.image}
                    alt={currentProduct.name}
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/60x60/E0E0E0/333333?text=Error'; }}
                  />
                ) : (
                  <div className="image-container">
                    <img src={mangtika} alt="Sample demo placeholder" />
                    <div className="image-overlay">
                      <p>Upload Sample Demo</p>
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, currentProduct.id)}

                  onClick={e => e.stopPropagation()}
                />
              </div>
            </div>

            <div>
              <div className="form-group">
                <label className="form-label">
                  Enter Purity(%)
                </label>
                <input
                  type="text"
                  placeholder="Wet Weight"
                  value={productDetails.purity}
                  onChange={(e) => setProductDetails({ ...productDetails, purity: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Wastage (%)
                </label>
                <input
                  type="text"
                  placeholder="Wastage"
                  value={productDetails.wastage}
                  onChange={(e) => setProductDetails({ ...productDetails, wastage: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Set MC
                </label>
                <input
                  type="text"
                  placeholder="Set MC"
                  value={productDetails.setMC}
                  onChange={(e) => setProductDetails({ ...productDetails, setMC: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Net Gram MC
                </label>
                <input
                  type="text"
                  placeholder="Net gram MC"
                  value={productDetails.netGramMC}
                  onChange={(e) => setProductDetails({ ...productDetails, netGramMC: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div className="specifications-section">
              <h4 className="specifications-title">
                Specification
              </h4>
              <div className="specifications-grid-header">
                <div></div>
                <div style={{ textAlign: 'center' }}>Wastage %</div>
                <div style={{ textAlign: 'center' }}>Gram Rate</div>
              </div>

              {Object.entries(productDetails.specifications || {}).map(([key, value]) => (
                <div key={key} className="specifications-row">
                  <div className="spec-label">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <input
                    type="text"
                    value={value.wastage}
                    onChange={(e) => setProductDetails({
                      ...productDetails,
                      specifications: {
                        ...productDetails.specifications,
                        [key]: { ...value, wastage: e.target.value }
                      }
                    })}
                    className="spec-input"
                  />
                  <input
                    type="text"
                    value={value.gramRate}
                    onChange={(e) => setProductDetails({
                      ...productDetails,
                      specifications: {
                        ...productDetails.specifications,
                        [key]: { ...value, gramRate: e.target.value }
                      }
                    })}
                    className="spec-input"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="popup-actions">
            <button
              onClick={() => setShowProductDetails(false)}
              className="popup-cancel-button"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProductDetails}
              className="popup-confirm-button"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <h2 className="main-heading">
          Register Product Category
        </h2>
        <p className="sub-heading">
          Choose your product category, sub-type, and styles to begin listing.
        </p>

        <div className="form-group">
          <label className="form-label">Category</label>
          <div className="horizontal-scroll-container">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedSubcategory(null);
                }}
                className={`category-button ${selectedCategory === cat ? 'selected' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {selectedCategory && (
          <div className="form-group">
            <label className="form-label">Subcategory</label>
            <div className="horizontal-scroll-container">
              {subcategories.map(sub => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubcategory(sub)}
                  className={`category-button ${selectedSubcategory === sub ? 'selected' : ''}`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        )}

        <h3 className="section-title">Select Products</h3>

        {selectedSubcategory ? (
          filteredProducts.length > 0 ? (
            <div style={{ marginBottom: '30px' }}>
              {filteredProducts.map(product => {
                const selectedStyle = productData[product.id].selectedStyleType;
                const currentDetails = getCurrentDetails(product.id);
                const currentImage = getCurrentImage(product.id);

                return (
                  <div key={product.id} className={`product-card ${hasStyleSelected(product.id) ? 'selected' : ''}`}
                    onClick={() => handleCardClick(product.id)}
                  >
                    <div className="product-card-header">
                      <div className="product-image-upload-area">
                        {currentImage ? (
                          <img
                            src={currentImage}
                            alt={product.name}
                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/60x60/E0E0E0/333333?text=Error'; }}
                          />
                        ) : (
                          <div className="image-container">
                            <img src={mangtika} alt="Sample demo placeholder" />
                            <div className="image-overlay">
                              <p>Upload Sample Demo</p>
                            </div>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, product.id)}
                          onClick={e => e.stopPropagation()}
                        />
                      </div>

                      <div style={{ flex: 1 }}>
                        <h4 className="product-name">{product.name}</h4>

                        <div className="style-buttons-container">
                          {product.styleTypes.map(styleType => (
                            <div key={styleType} className="style-button-wrapper">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleStyleSelect(product.id, styleType); }}
                                className={`style-button ${selectedStyle === styleType ? 'selected' : ''}`}
                              >
                                {getStyleLabel(styleType)}
                                {selectedStyle === styleType && (
                                  <Edit size={12} color='white' />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className={`selection-indicator ${hasStyleSelected(product.id) ? 'selected' : ''}`}>
                      </div>
                    </div>

                    {hasStyleSelected(product.id) && currentDetails && currentDetails.purity && (
                      <div className="metrics-section">
                        <div className="metrics-header">
                          <span className="metrics-title">View Metrics - {getStyleLabel(selectedStyle)}</span>
                          <Edit onClick={(e) => { e.stopPropagation(); handleEditDetails(product.id, selectedStyle); }}
                            className="metrics-edit-icon" />
                        </div>

                        <div className="metric-item">
                          <div className="metric-grid">
                            <div>Purity: <span className="metric-value">{currentDetails.purity || '-'}%</span></div>
                            <div>Set MC: <span className="metric-value">{currentDetails.setMC || '-'}</span></div>
                            <div>Wastage: <span className="metric-value">{currentDetails.wastage || '-'}%</span></div>
                            <div>Net Gram MC: <span className="metric-value">{currentDetails.netGramMC || '-'}</span></div>
                          </div>
                        </div>

                        <button className="view-more-button">
                          View More <ChevronDown style={{ width: '12px', height: '12px' }} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>No products found for the selected category.</p>
          )
        ) : (
          <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>Please select a category to view products.</p>
        )}
      </div>

      <div className="sticky-footer">
        <span className="selected-products-count">Selected: {getTotalSelected()} Products</span>
        <button className="send-to-qc-button" onClick={handleSendToQC}>
          Request Approval
        </button>
      </div>

      {renderProductDetailsPopup()}
    </div>
  );
};

export default ProductRegistration;