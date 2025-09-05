import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Camera } from 'lucide-react';
import './UploadProduct.css';
import { db } from '../services/firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { useSeller } from '../contexts/SellerContext';
import PageHeader from '../components/PageHeader';

const UploadProduct = () => {
  const { seller } = useSeller();
  const sellerId = seller?.sellerId;

  const [activeTab, setActiveTab] = useState('ready');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [specifications, setSpecifications] = useState('');
  const [registeredProducts, setRegisteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedStyleTypes, setSelectedStyleTypes] = useState([]);
  const [productSpecifications, setProductSpecifications] = useState([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);

  const [formData, setFormData] = useState({
    productCategory: '',
    subCategory: '',
    productName: '',
    tags: [],
    selectedTags: [],
    moqType: 'gram',
    moqGram: '',
    moqSet: '',
    netWtPurity: '',
    wastage: '',
    setMc: '',
    netGramMc: '',
    stoneGram: '',
    meenaGram: '',
    paymentMethod: 'RTGS',
    netWt: '',
    totalAmt: '',
    set: '',
    grossWt: '',
    otherWt: '',
    fineWt: '',
    gst: '',
    sizeValue: '',
    instockType: 'gram',
    instockGram: '',
    instockSet: '',
    selectedStyleType: '',
    specification: ''
  });

  const segments = ['Gold', 'Silver', 'Platinum', 'Diamond', 'Gems', 'Pearls'];
  
  const categoriesBySegment = {
    Gold: ['916 HUID', '750 HUID', '840', '650', '480'],
    Silver: ['925', '999', '800', '900'],
    Platinum: ['950', '900', '850'],
    Diamond: ['VS1', 'VS2', 'VVS1', 'VVS2', 'SI1', 'SI2'],
    Gems: ['Emerald', 'Ruby', 'Sapphire', 'Topaz'],
    Pearls: ['Freshwater', 'Akoya', 'Tahitian', 'South Sea']
  };

  const productSources = [
    'KATAKI', 'RAJKOT', 'BOMBAY', 'COIMBATORE', 'KOLKATA', 'CASTING',
    'MACHINE MADE', 'SOUTH', 'TURKEY', 'CNC', 'ITALIAN', 'SANKHA POLA',
    'NAKASHI', 'DIECE THUKAI', 'ACCESORIES', 'MARWAD'
  ];

  const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_UPLOAD_PRESET = "jmiseller";
  const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  // Fetch registered products for the seller
  useEffect(() => {
    const fetchRegisteredProducts = async () => {
      if (!sellerId) {
        console.log('No sellerId available');
        return;
      }

      setLoadingRegistrations(true);
      console.log('Fetching registered products for sellerId:', sellerId);
      
      try {
        const docRef = doc(db, 'ProductRegistrations', sellerId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log('Full document ', JSON.stringify(data, null, 2));
          
          let allRegistrations = [];
          
          // Handle different possible data structures
          if (Array.isArray(data.registrations)) {
            // If registrations is an array
            allRegistrations = data.registrations;
            console.log('Found registrations array with', allRegistrations.length, 'items');
          } else if (data.registrations && typeof data.registrations === 'object') {
            // If registrations is an object with numeric keys
            allRegistrations = Object.values(data.registrations);
            console.log('Found registrations object with', allRegistrations.length, 'items');
          } else {
            // Check if the document itself contains registration data
            const directRegistrations = Object.values(data).filter(item => 
              item && typeof item === 'object' && 
              (item.registrationId || item.products || item.approved !== undefined)
            );
            if (directRegistrations.length > 0) {
              allRegistrations = directRegistrations;
              console.log('Found direct registrations:', allRegistrations.length, 'items');
            }
          }
          
          console.log('All registrations before filtering:', allRegistrations);
          
          // Filter for approved products
          const approvedProducts = allRegistrations.filter(registration => {
            const isApproved = registration.approved === true;
            const hasProducts = registration.products && Object.keys(registration.products).length > 0;
            console.log('Registration check - approved:', isApproved, 'hasProducts:', hasProducts, 'registration:', registration);
            return isApproved && hasProducts;
          });
          
          console.log('Approved products:', approvedProducts);
          setRegisteredProducts(approvedProducts);
        } else {
          console.log('No document found for sellerId:', sellerId);
        }
      } catch (error) {
        console.error('Error fetching registered products:', error);
      } finally {
        setLoadingRegistrations(false);
      }
    };

    fetchRegisteredProducts();
  }, [sellerId]);

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

    if (field === 'moqType') {
      setFormData(prev => ({
        ...prev,
        moqGram: value === 'set' ? '' : prev.moqGram,
        moqSet: value === 'gram' ? '' : prev.moqSet
      }));
    }

    if (field === 'instockType') {
      setFormData(prev => ({
        ...prev,
        instockGram: value === 'set' ? '' : prev.instockGram,
        instockSet: value === 'gram' ? '' : prev.instockSet
      }));
    }
  };


  const handleProductSelect = (product) => {
    console.log('Selected product:', product);
    setSelectedProduct(product);
    
    // Get all style types from the product
    const productStyleTypes = [];
    Object.values(product.products).forEach(productData => {
      if (productData.selectedStyleType && !productStyleTypes.includes(productData.selectedStyleType)) {
        productStyleTypes.push(productData.selectedStyleType);
      }
    });
    
    setSelectedStyleTypes(productStyleTypes);
    
    // Get all specifications from the product
    const productSpecs = [];
    Object.values(product.products).forEach(productData => {
      if (productData.specification && !productSpecs.includes(productData.specification)) {
        productSpecs.push(productData.specification);
      }
    });
    
    setProductSpecifications(productSpecs);
    
    // Get specification from the first product
    const firstProduct = Object.values(product.products)[0];
    const specification = firstProduct?.specification || '';
    
    setFormData(prev => ({
      ...prev,
      productCategory: product.segment || '',
      subCategory: product.subcategory || '',
      productName: Object.keys(product.products)[0] || '',
      selectedStyleType: productStyleTypes.length > 0 ? productStyleTypes[0] : '',
      specification: specification
    }));
  };

  const handleSubmit = async () => {
    try {
      const productData = {
        ...formData,
        images: uploadedImages,
        type: activeTab,
        specificationGramRate: "",
        specificationMC: "",
        netGramMC: formData.netGramMc,
        setMC: formData.setMc,
        wastage: formData.wastage,
        purity: formData.netWtPurity,
        sellerId: sellerId,
        timestamp: new Date()
      };

      await addDoc(collection(db, 'products'), productData);
      alert('Product added successfully!');
      
      setUploadedImages([]);
      setFormData({
        sellerId: sellerId,
        productCategory: '',
        subCategory: '',
        productName: '',
        tags: [],
        selectedTags: [],
        moqType: 'gram',
        moqGram: '',
        moqSet: '',
        netWtPurity: '',
        wastage: '',
        setMc: '',
        netGramMc: '',
        stoneGram: '',
        meenaGram: '',
        paymentMethod: 'RTGS',
        netWt: '',
        totalAmt: '',
        set: '',
        grossWt: '',
        otherWt: '',
        fineWt: '',
        gst: '',
        sizeValue: '',
        instockType: 'gram',
        instockGram: '',
        instockSet: '',
        selectedStyleType: '',
        specification: ''
      });
      setSelectedProduct(null);
      setSelectedStyleTypes([]);
      setProductSpecifications([]);
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product. Please try again.');
    }
  };

  return (
    <>
    <PageHeader title='Upload Product' />
    <div className="add-product-container">
      <div className="tab-container">
        <button
          onClick={() => setActiveTab('ready')}
          className={`tab-button ${activeTab === 'ready' ? 'active' : 'inactive'}`}
        >
          Ready Serve
        </button>
        <button
          onClick={() => setActiveTab('order')}
          className={`tab-button ${activeTab === 'order' ? 'active' : 'inactive'}`}
        >
          Order Serve
        </button>
      </div>

      <div className="content">
        <div className="section">
          <div className="form-grid-2">
            {/* Segment */}
            <div className="form-group">
              <div className="select-wrapper">
                <select
                  value={formData.productCategory}
                  onChange={(e) => handleInputChange('productCategory', e.target.value)}
                  className="form-select"
                >
                  <option value="">Segment</option>
                  {segments.map(segment => (
                    <option key={segment} value={segment}>{segment}</option>
                  ))}
                </select>
                <ChevronDown className="select-icon" />
              </div>
            </div>

            {/* Category */}
            <div className="form-group">
              <div className="select-wrapper">
                <select
                  value={formData.productName}
                  onChange={(e) => handleInputChange('productName', e.target.value)}
                  className="form-select"
                  disabled={!formData.productCategory}
                >
                  <option value="">Category</option>
                  {formData.productCategory && categoriesBySegment[formData.productCategory]?.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <ChevronDown className="select-icon" />
              </div>
            </div>

            {/* Product Source */}
            <div className="form-group">
              <div className="select-wrapper">
                <select
                  value={specifications}
                  onChange={(e) => setSpecifications(e.target.value)}
                  className="form-select"
                >
                  <option value="">Product Source</option>
                  {productSources.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
                <ChevronDown className="select-icon" />
              </div>
            </div>

            {/* Registered Products */}
            <div className="form-group">
              <div className="select-wrapper">
                <select
                  value={selectedProduct?.registrationId || ''}
                  onChange={(e) => {
                    const product = registeredProducts.find(p => p.registrationId === e.target.value);
                    if (product) handleProductSelect(product);
                  }}
                  className="form-select"
                >
                  <option value="">Select Registered Product</option>
                  {registeredProducts.map((product, index) => {
                    const productKeys = Object.keys(product.products || {});
                    const productName = productKeys.length > 0 ? productKeys[0] : 'Unknown Product';
                    const displayText = `${productName} - ${product.subcategory || 'Unknown Subcategory'}`;
                    return (
                      <option 
                        key={`${product.registrationId || index}`} 
                        value={product.registrationId}
                      >
                        {displayText}
                      </option>
                    );
                  })}
                </select>
                {loadingRegistrations && <div className="loading-indicator">Loading...</div>}
                <ChevronDown className="select-icon" />
              </div>
            </div>

            {/* Style Type */}
            {selectedProduct && selectedStyleTypes.length > 0 && (
              <div className="form-group">
                <div className="select-wrapper">
                  <select
                    value={formData.selectedStyleType}
                    onChange={(e) => handleInputChange('selectedStyleType', e.target.value)}
                    className="form-select"
                  >
                    <option value="">Select Style Type</option>
                    {selectedStyleTypes.map(style => (
                      <option key={style} value={style}>{style}</option>
                    ))}
                  </select>
                  <ChevronDown className="select-icon" />
                </div>
              </div>
            )}

            {/* Specification */}
            {selectedProduct && productSpecifications.length > 0 && (
              <div className="form-group">
                <div className="select-wrapper">
                  <select
                    value={formData.specification}
                    onChange={(e) => handleInputChange('specification', e.target.value)}
                    className="form-select"
                  >
                    <option value="">Select Specification</option>
                    {productSpecifications.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                  <ChevronDown className="select-icon" />
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedProduct && (
          <div className="upload-section">
            <h3 className="section-title">Upload Photos</h3>

            {uploadedImages.length > 0 && (
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
            )}

            <div className="upload-area">
              <div className="upload-icon-container">
                <Camera className="upload-icon" />
              </div>
              <p className="upload-text">
                {uploadedImages.length > 0 
                  ? `${selectedProduct?.subcategory || 'Product'}\n${formData.productCategory}-${formData.productName}-${specifications}` 
                  : 'Upload product photos'}
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
          </div>
        )}

        {selectedProduct && (
          <div className="section">
            <h3 className="section-title">Product Details</h3>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">MOQ Type</label>
                <div className="radio-group">
                  <div className="radio-item">
                    <input
                      type="radio"
                      name="moqType"
                      value="gram"
                      checked={formData.moqType === 'gram'}
                      onChange={(e) => handleInputChange('moqType', e.target.value)}
                      className="radio-input"
                      id="moq-gram"
                    />
                    <label htmlFor="moq-gram" className="radio-label">Gram</label>
                  </div>
                  <div className="radio-item">
                    <input
                      type="radio"
                      name="moqType"
                      value="set"
                      checked={formData.moqType === 'set'}
                      onChange={(e) => handleInputChange('moqType', e.target.value)}
                      className="radio-input"
                      id="moq-set"
                    />
                    <label htmlFor="moq-set" className="radio-label">Set</label>
                  </div>
                </div>
              </div>

              <div className="form-group">
                {formData.moqType === 'gram' ? (
                  <>
                    <label className="form-label">MOQ Gram</label>
                    <input
                      type="number"
                      value={formData.moqGram}
                      onChange={(e) => handleInputChange('moqGram', e.target.value)}
                      className="form-input"
                    />
                  </>
                ) : (
                  <>
                    <label className="form-label">MOQ Set</label>
                    <input
                      type="number"
                      value={formData.moqSet}
                      onChange={(e) => handleInputChange('moqSet', e.target.value)}
                      className="form-input"
                    />
                  </>
                )}
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Net Wt. Purity (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.netWtPurity}
                  onChange={(e) => handleInputChange('netWtPurity', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Wastage (%)</label>
                <input
                  type="number"
                  value={formData.wastage}
                  onChange={(e) => handleInputChange('wastage', e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Set MC</label>
                <input
                  type="number"
                  value={formData.setMc}
                  onChange={(e) => handleInputChange('setMc', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Net Gram MC</label>
                <input
                  type="number"
                  value={formData.netGramMc}
                  onChange={(e) => handleInputChange('netGramMc', e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            {activeTab === 'ready' && (
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Instock Type</label>
                  <div className="radio-group">
                    <div className="radio-item">
                      <input
                        type="radio"
                        name="instockType"
                        value="gram"
                        checked={formData.instockType === 'gram'}
                        onChange={(e) => handleInputChange('instockType', e.target.value)}
                        className="radio-input"
                        id="instock-gram"
                      />
                      <label htmlFor="instock-gram" className="radio-label">Gram</label>
                    </div>
                    <div className="radio-item">
                      <input
                        type="radio"
                        name="instockType"
                        value="set"
                        checked={formData.instockType === 'set'}
                        onChange={(e) => handleInputChange('instockType', e.target.value)}
                        className="radio-input"
                        id="instock-set"
                      />
                      <label htmlFor="instock-set" className="radio-label">Set</label>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  {formData.instockType === 'gram' ? (
                    <>
                      <label className="form-label">Instock Gram</label>
                      <input
                        type="number"
                        value={formData.instockGram}
                        onChange={(e) => handleInputChange('instockGram', e.target.value)}
                        className="form-input"
                      />
                    </>
                  ) : (
                    <>
                      <label className="form-label">Instock Set</label>
                      <input
                        type="number"
                        value={formData.instockSet}
                        onChange={(e) => handleInputChange('instockSet', e.target.value)}
                        className="form-input"
                      />
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <div className="radio-group">
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
                    value="Cash/Metal"
                    checked={formData.paymentMethod === 'Cash/Metal'}
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                    className="radio-input"
                    id="payment-cash"
                  />
                  <label htmlFor="payment-cash" className="radio-label">Cash/Metal</label>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedProduct && (
          <div className="section">
            <h3 className="section-title">Additional Details</h3>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Gross Wt. (g)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.grossWt}
                  onChange={(e) => handleInputChange('grossWt', e.target.value)}
                  className="form-input"
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
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Total Amt</label>
                <input
                  type="number"
                  value={formData.totalAmt}
                  onChange={(e) => handleInputChange('totalAmt', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Set</label>
                <input
                  type="number"
                  value={formData.set}
                  onChange={(e) => handleInputChange('set', e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">GST%</label>
                <input
                  type="number"
                  value={formData.gst}
                  onChange={(e) => handleInputChange('gst', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Size</label>
                <input
                  type="text"
                  value={formData.sizeValue}
                  onChange={(e) => handleInputChange('sizeValue', e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          </div>
        )}

        {selectedProduct && (
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="submit-button"
          >
            QC Request
          </button>
        )}
      </div>
    </div>
    </>
  );
};

export default UploadProduct;