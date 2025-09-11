import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Camera } from 'lucide-react';
import './UploadProduct.css';
import { db } from '../services/firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { useSeller } from '../contexts/SellerContext';
import PageHeader from '../components/PageHeader';
import productData from './productData.json';

const UploadProduct = () => {
  const { seller } = useSeller();
  const sellerId = seller?.sellerId;

  const [activeTab, setActiveTab] = useState('ready');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [registeredProducts, setRegisteredProducts] = useState([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [formData, setFormData] = useState({
    segment: '',
    category: '',
    productName: '',
    moqGram: '',
    moqSet: '',
    netWtPurity: '',
    wastage: '',
    setMc: '',
    netGramMc: '',
    paymentMethod: 'RTGS',
    netWt: '',
    grossWt: '',
    specificationWt: '',
    instockGram: '',
    instockSet: '',
    styleType: '',
    specification: '',
    productSource: '',
    size: '',
    status: 'pending'
  });

  // Use data from JSON file
  const segments = productData.segments;
  const categoriesBySegment = productData.categoriesBySegment;
  const productSources = productData.productSources;
  const productNames = productData.productNames;
  const styleTypes = productData.styleTypes;
  const specifications = productData.specifications;
  const productSizes = productData.productSizes;

  const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_UPLOAD_PRESET = "jmiseller";
  const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  // Extract registered combinations
  const [registeredCombinations, setRegisteredCombinations] = useState({
    segments: new Set(),
    categories: new Set(),
    productNames: new Set(),
    sources: new Set(),
    styleTypes: new Set(),
    specifications: new Set(),
    combinations: new Set()
  });

  // Check if a value is registered
  const isRegistered = (type, value) => {
    return registeredCombinations[type].has(value);
  };

  // Check if the current combination is registered
  const isCombinationRegistered = () => {
    const combination = `${formData.segment}-${formData.category}-${formData.productName}-${formData.styleType}-${formData.specification}-${formData.productSource}`;
    return registeredCombinations.combinations.has(combination);
  };

  // Show alert message
  const showAlertMessage = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 5000);
  };

  // Fetch registered products for the seller
  useEffect(() => {
    const fetchRegisteredProducts = async () => {
      if (!sellerId) {
        console.log('No sellerId available');
        return;
      }

      setLoadingRegistrations(true);
      
      try {
        const docRef = doc(db, 'ProductRegistrations', sellerId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          let allRegistrations = [];
          
          if (Array.isArray(data.registrations)) {
            allRegistrations = data.registrations;
          } else if (data.registrations && typeof data.registrations === 'object') {
            allRegistrations = Object.values(data.registrations);
          } else {
            const directRegistrations = Object.values(data).filter(item => 
              item && typeof item === 'object' && 
              (item.registrationId || item.products || item.approved !== undefined)
            );
            if (directRegistrations.length > 0) {
              allRegistrations = directRegistrations;
            }
          }
          
          // Filter for approved products only
          const approvedProducts = allRegistrations.filter(registration => 
            registration.approved === true && registration.products
          );
          
          setRegisteredProducts(approvedProducts);
          
          // Extract registered combinations from APPROVED products only
          const combinations = {
            segments: new Set(),
            categories: new Set(),
            productNames: new Set(),
            sources: new Set(),
            styleTypes: new Set(),
            specifications: new Set(),
            combinations: new Set()
          };

          approvedProducts.forEach(registration => {
            Object.entries(registration.products || {}).forEach(([productName, productDetails]) => {
              // Extract values from product details (inside each product object)
              if (productDetails.segment) combinations.segments.add(productDetails.segment);
              if (productDetails.category) combinations.categories.add(productDetails.category);
              if (productDetails.productSource) combinations.sources.add(productDetails.productSource);
              
              combinations.productNames.add(productName);
              if (productDetails.selectedStyleType) combinations.styleTypes.add(productDetails.selectedStyleType);
              if (productDetails.specification) combinations.specifications.add(productDetails.specification);
              
              // Store complete combination
              const combination = `${productDetails.segment || ''}-${productDetails.category || ''}-${productName}-${productDetails.selectedStyleType || ''}-${productDetails.specification || ''}-${productDetails.productSource || ''}`;
              combinations.combinations.add(combination);
            });
          });

          setRegisteredCombinations(combinations);
          console.log('Registered combinations:', combinations);
        }
      } catch (error) {
        console.error('Error fetching registered products:', error);
      } finally {
        setLoadingRegistrations(false);
      }
    };

    fetchRegisteredProducts();
  }, [sellerId]);

  // Auto-fill form when product selection changes
  useEffect(() => {
    if (formData.segment && formData.category && formData.productName && 
        formData.styleType && formData.specification && formData.productSource) {
      
      // Find the matching registered product
      const foundRegistration = registeredProducts.find(registration => {
        return Object.entries(registration.products || {}).some(([name, details]) => 
          name === formData.productName &&
          details.segment === formData.segment &&
          details.category === formData.category &&
          details.selectedStyleType === formData.styleType &&
          details.specification === formData.specification &&
          details.productSource === formData.productSource
        );
      });

      if (foundRegistration) {
        const productDetails = foundRegistration.products[formData.productName];
        setSelectedProduct(productDetails);
        
        // Auto-fill the form with registered data
        setFormData(prev => ({
          ...prev,
          wastage: productDetails.wastage || '',
          setMc: productDetails.setMC || '',
          netGramMc: productDetails.netGramMC || '',
          netWtPurity: productDetails.purity || ''
        }));
      } else {
        setSelectedProduct(null);
        // Reset auto-filled fields if no match
        setFormData(prev => ({
          ...prev,
          wastage: '',
          setMc: '',
          netGramMc: '',
          netWtPurity: ''
        }));
      }
    }
  }, [formData.segment, formData.category, formData.productName, formData.styleType, 
      formData.specification, formData.productSource, registeredProducts]);

  const handleImageUpload = async (files) => {
    setUploading(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      try {
        const response = await fetch(CLOUDINARY_API_URL, {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        return {
          id: data.public_id,
          url: data.secure_url,
          name: file.name,
        };
      } catch (error) {
        console.error('Upload failed:', error);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter(Boolean);
    setUploadedImages(prev => [...prev, ...successfulUploads]);
    setUploading(false);
  };

  const removeImage = (id) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id));
    if (mainImageIndex >= uploadedImages.length - 1) {
      setMainImageIndex(0);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Check if the new selection is registered and show alert if not
    let fieldType = '';
    let fieldName = '';
    
    switch (field) {
      case 'segment':
        fieldType = 'segments';
        fieldName = 'segment';
        break;
      case 'category':
        fieldType = 'categories';
        fieldName = 'category';
        break;
      case 'productName':
        fieldType = 'productNames';
        fieldName = 'product name';
        break;
      case 'productSource':
        fieldType = 'sources';
        fieldName = 'product source';
        break;
      case 'styleType':
        fieldType = 'styleTypes';
        fieldName = 'style type';
        break;
      case 'specification':
        fieldType = 'specifications';
        fieldName = 'specification';
        break;
      default:
        return;
    }

    if (value && !isRegistered(fieldType, value)) {
      showAlertMessage(`This ${fieldName} is not registered. Please register this product first.`);
    }
  };

  const handleSubmit = async () => {
    // Validate if all required fields are filled
    if (!formData.segment || !formData.category || !formData.productName || 
        !formData.styleType || !formData.specification || !formData.productSource) {
      showAlertMessage('Please fill all required product information fields.');
      return;
    }

    // Check if the combination is registered
    if (!isCombinationRegistered()) {
      showAlertMessage('This product combination is not registered. Please register this product first before uploading.');
      return;
    }

    if (!uploadedImages.length) {
      showAlertMessage('Please upload at least one product image.');
      return;
    }

    try {
      const productDataToSave = {
        sellerId: sellerId,
        segment: formData.segment,
        category: formData.category,
        productName: formData.productName,
        styleType: formData.styleType,
        specification: formData.specification,
        productSource: formData.productSource,
        images: uploadedImages,
        serviceType: activeTab,
        wastage: formData.wastage,
        setMc: formData.setMc,
        netGramMc: formData.netGramMc,
        purity: formData.netWtPurity,
        moqGram: formData.moqGram,
        moqSet: formData.moqSet,
        instockGram: activeTab === 'ready' ? formData.instockGram : '',
        instockSet: activeTab === 'ready' ? formData.instockSet : '',
        grossWt: formData.grossWt,
        netWt: formData.netWt,
        specificationWt: formData.specification !== 'PLANE' ? formData.grossWt-formData.netWt : '',
        size: formData.size,
        paymentMethod: formData.paymentMethod,
        status: 'pending',
        timestamp: new Date()
      };

      await addDoc(collection(db, 'products'), productDataToSave);
      alert('Product added successfully!');

      // Reset form
      setUploadedImages([]);
      setSelectedProduct(null);
      setFormData({
        segment: '',
        category: '',
        productName: '',
        moqGram: '',
        moqSet: '',
        netWtPurity: '',
        wastage: '',
        setMc: '',
        netGramMc: '',
        paymentMethod: 'RTGS',
        netWt: '',
        grossWt: '',
        specificationWt: '',
        instockGram: '',
        instockSet: '',
        styleType: '',
        specification: '',
        productSource: '',
        size: '',
        status: 'pending'
      });
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product. Please try again.');
    }
  };

  // Generate product title for display
  const generateProductTitle = () => {
    return `${formData.segment || ''}-${formData.category || ''}-${formData.productName || ''}-${formData.styleType || ''}-${formData.specification || ''}`;
  };

  // Get size options based on product name
  const getSizeOptions = () => {
    const productName = formData.productName.toUpperCase();
    const sizeInfo = productSizes[productName];
    return sizeInfo?.options || [];
  };

  // Get size unit based on product name
  const getSizeUnit = () => {
    const productName = formData.productName.toUpperCase();
    const sizeInfo = productSizes[productName];
    return sizeInfo?.sizing_unit || '';
  };

  // Get categories based on selected segment
  const getCategoriesForSegment = () => {
    if (!formData.segment) return [];
    return categoriesBySegment[formData.segment] || [];
  };

  return (
    <>
    <PageHeader title='Upload Product' />
    <div className="add-product-container">
      {/* Alert Message */}
      {showAlert && (
        <div className="alert-message">
          <div className="alert-content">
            <span className="alert-text">{alertMessage}</span>
            <button 
              className="alert-close"
              onClick={() => setShowAlert(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="radio-group">
        <label className={`radio-option ${activeTab === 'ready' ? 'active' : ''}`}>
          <input
            type="radio"
            value="ready"
            checked={activeTab === 'ready'}
            onChange={(e) => setActiveTab(e.target.value)}
          />
          Ready Serve
        </label>
        <label className={`radio-option ${activeTab === 'order' ? 'active' : ''}`}>
          <input
            type="radio"
            value="order"
            checked={activeTab === 'order'}
            onChange={(e) => setActiveTab(e.target.value)}
          />
          Order Serve
        </label>
      </div>

      <div className="content">
        <div className="section">
          <h3 className="section-title">Product Information</h3>
          <div className="form-grid-3">
            {/* Segment */}
            <div className="form-group">
              <label className="form-label">Segment *</label>
              <div className="select-wrapper">
                <select
                  value={formData.segment}
                  onChange={(e) => handleInputChange('segment', e.target.value)}
                  className="form-select"
                >
                  <option value="">Select Segment</option>
                  {segments.map(segment => (
                    <option 
                      key={segment} 
                      value={segment}
                      className={!isRegistered('segments', segment) ? 'not-registered' : ''}
                    >
                      {segment}
                    </option>
                  ))}
                </select>
                <ChevronDown className="select-icon" />
              </div>
            </div>

            {/* Category */}
            <div className="form-group">
              <label className="form-label">Category *</label>
              <div className="select-wrapper">
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="form-select"
                  disabled={!formData.segment}
                >
                  <option value="">Select Category</option>
                  {getCategoriesForSegment().map(category => (
                    <option 
                      key={category} 
                      value={category}
                      className={!isRegistered('categories', category) ? 'not-registered' : ''}
                    >
                      {category}
                    </option>
                  ))}
                </select>
                <ChevronDown className="select-icon" />
              </div>
            </div>

           

            {/* Product Source */}
            <div className="form-group">
              <label className="form-label">Source *</label>
              <div className="select-wrapper">
                <select
                  value={formData.productSource}
                  onChange={(e) => handleInputChange('productSource', e.target.value)}
                  className="form-select"
                >
                  <option value="">Select Source</option>
                  {Array.from(registeredCombinations.sources).map(source => (
                    <option 
                      key={source} 
                      value={source}
                      className={!isRegistered('sources', source) ? 'not-registered' : ''}
                    >
                      {source}
                    </option>
                  ))}
                </select>
                <ChevronDown className="select-icon" />
              </div>
            </div>
             {/* Product Name */}
            <div className="form-group">
              <label className="form-label">Product *</label>
              <div className="select-wrapper">
                <select
                  value={formData.productName}
                  onChange={(e) => handleInputChange('productName', e.target.value)}
                  className="form-select"
                >
                  <option value="">Select Product</option>
                  {Array.from(registeredCombinations.productNames).map(product => (
                    <option 
                      key={product} 
                      value={product}
                      className={!isRegistered('productNames', product) ? 'not-registered' : ''}
                    >
                      {product}
                    </option>
                  ))}
                </select>
                <ChevronDown className="select-icon" />
              </div>
            </div>
            {/* Style Type */}
            <div className="form-group">
              <label className="form-label">Style Type *</label>
              <div className="select-wrapper">
                <select
                  value={formData.styleType}
                  onChange={(e) => handleInputChange('styleType', e.target.value)}
                  className="form-select"
                >
                  <option value="">Select Style Type</option>
                  {Array.from(registeredCombinations.styleTypes).map(style => (
                    <option 
                      key={style} 
                      value={style}
                      className={!isRegistered('styleTypes', style) ? 'not-registered' : ''}
                    >
                      {style}
                    </option>
                  ))}
                </select>
                <ChevronDown className="select-icon" />
              </div>
            </div>

            {/* Specification */}
            <div className="form-group">
              <label className="form-label">Specification *</label>
              <div className="select-wrapper">
                <select
                  value={formData.specification}
                  onChange={(e) => handleInputChange('specification', e.target.value)}
                  className="form-select"
                >
                  <option value="">Select Specification</option>
                  {Array.from(registeredCombinations.specifications).map(spec => (
                    <option 
                      key={spec} 
                      value={spec}
                      className={!isRegistered('specifications', spec) ? 'not-registered' : ''}
                    >
                      {spec}
                    </option>
                  ))}
                </select>
                <ChevronDown className="select-icon" />
              </div>
            </div>
          </div>

          
        </div>
        {/* Upload Section */}
        <div className="upload-section">
          <h3 className="section-title">Upload Photos</h3>

          {uploadedImages.length > 0 ? (
            <div className="image-upload-container">
              <div className="main-image-container">
                <img
                  src={uploadedImages[mainImageIndex]?.url}
                  alt="Main"
                  className="main-image"
                />
              </div>

              <div className="thumbnail-grid">
                {uploadedImages.map((image, index) => (
                  <div 
                    key={image.id} 
                    className={`thumbnail-container ${index === mainImageIndex ? 'active' : ''}`}
                    onClick={() => setMainImageIndex(index)}
                  >
                    <img
                      src={image.url}
                      alt={image.name}
                      className="thumbnail-image"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(image.id);
                      }}
                      className="remove-thumbnail-btn"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="upload-area">
              <div className="upload-icon-container">
                <Camera className="upload-icon" />
              </div>
              <p className="upload-text">
                {generateProductTitle() || 'Upload product photos'}
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files)}
                className="upload-input"
                id="photo-upload"
                disabled={uploading}
              />
              <label
                htmlFor="photo-upload"
                className={`upload-button ${uploading ? 'loading' : ''}`}
              >
                {uploading ? 'Uploading...' : 'Add Photos'}
              </label>
            </div>
          )}

          {uploadedImages.length > 0 && (
            <div className="upload-area">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files)}
                className="upload-input"
                id="additional-photo-upload"
                disabled={uploading}
              />
              <label
                htmlFor="additional-photo-upload"
                className={`upload-button ${uploading ? 'loading' : ''}`}
              >
                {uploading ? 'Uploading...' : 'Add More Photos'}
              </label>
            </div>
          )}
        </div>

        {/* Product Details Section */}
        <div className="section">
          <h3 className="section-title">Product Details</h3>

          {/* MOQ Section */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">MOQ Gram</label>
              <input
                type="number"
                value={formData.moqGram}
                onChange={(e) => handleInputChange('moqGram', e.target.value)}
                className="form-input"
                placeholder="Enter MOQ in grams"
              />
            </div>
            <div className="form-group">
              <label className="form-label">MOQ Set</label>
              <input
                type="number"
                value={formData.moqSet}
                onChange={(e) => handleInputChange('moqSet', e.target.value)}
                className="form-input"
                placeholder="Enter MOQ in sets"
              />
            </div>
          </div>

          {/* Instock Section - Only for Ready Serve */}
          {activeTab === 'ready' && (
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Instock Gram</label>
                <input
                  type="number"
                  value={formData.instockGram}
                  onChange={(e) => handleInputChange('instockGram', e.target.value)}
                  className="form-input"
                  placeholder="Enter instock grams"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Instock Set</label>
                <input
                  type="number"
                  value={formData.instockSet}
                  onChange={(e) => handleInputChange('instockSet', e.target.value)}
                  className="form-input"
                  placeholder="Enter instock sets"
                />
              </div>
            </div>
          )}

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Gross Wt. (g)</label>
              <input
                type="number"
                step="0.01"
                value={formData.grossWt}
                onChange={(e) => handleInputChange('grossWt', e.target.value)}
                className="form-input"
                placeholder="Enter gross weight"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Net Wt. (g)</label>
              <input
                type="number"
                step="0.01"
                value={formData.netWt}
                onChange={(e) => handleInputChange('netWt', e.target.value)}
                className="form-input"
                placeholder="Enter net weight"
              />
            </div>
          </div>

          {formData.specification && formData.specification !== 'PLANE' && (
            <div className="form-group">
              <label className="form-label">Specification Weight (g)</label>
              <input
                type="number"
                step="0.01"
                value={formData.grossWt-formData.netWt}
                onChange={(e) => handleInputChange('specificationWt', formData.grossWt-formData.netWt)}
                className="form-input"
                placeholder="Enter specification weight"
              />
            </div>
          )}

          {/* Size Selection */}
          {formData.productName && productSizes[formData.productName.toUpperCase()] && (
            <div className="form-group">
              <label className="form-label">
                Size ({getSizeUnit()})
                {productSizes[formData.productName.toUpperCase()]?.note && (
                  <span className="size-note"> ({productSizes[formData.productName.toUpperCase()].note})</span>
                )}
              </label>
              {getSizeOptions().length > 0 ? (
                <div className="select-wrapper">
                  <select
                    value={formData.size}
                    onChange={(e) => handleInputChange('size', e.target.value)}
                    className="form-select"
                  >
                    <option value="">Select Size</option>
                    {getSizeOptions().map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                  <ChevronDown className="select-icon" />
                </div>
              ) : (
                <input
                  type="text"
                  value={formData.size}
                  onChange={(e) => handleInputChange('size', e.target.value)}
                  className="form-input"
                  placeholder={`Enter size in ${getSizeUnit()}`}
                />
              )}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <div className="radio-group-horizontal">
              <div className="radio-item">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="RTGS"
                  checked={formData.paymentMethod === 'RTGS'}
                  onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                  className="radio-input"
                  id="payment-rtgs"
                />
                <label htmlFor="payment-rtgs" className="radio-label">RTGS</label>
              </div>
              <div className="radio-item">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Metal"
                  checked={formData.paymentMethod === 'Metal'}
                  onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                  className="radio-input"
                  id="payment-cash"
                />
                <label htmlFor="payment-cash" className="radio-label">Metal</label>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={uploading || !isCombinationRegistered()}
          className="submit-button"
        >
          QC Request
        </button>
      </div>
    </div>
    </>
  );
};

export default UploadProduct;