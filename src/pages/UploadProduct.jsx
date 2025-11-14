import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Camera } from 'lucide-react';
import './UploadProduct.css';
import { db } from '../services/firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { useSeller } from '../contexts/SellerContext';
import PageHeader from '../components/PageHeader';
import productData from './SELLERPRODUCT.json';

const UploadProduct = () => {
  const { seller } = useSeller();
  const sellerId = seller?.sellerId;
  const [Lot, setLot] = useState(false);
  const sizeRowRefs = useRef({});
  const setSizeRowRef = (index, element) => {
    if (element) {
      sizeRowRefs.current[index] = element;
    }
  };

  // toggle Lot and keep formData.lot in sync
  const toggleHandleLot = () => {
    setLot((prev) => {
      const newVal = !prev;
      // If switching to non-lot, collapse to 1 row
      if (!newVal && lotSizes.length > 1) {
        setLotSizes(lotSizes.slice(0, 1));  // Keep first row, discard others
        showAlertMessage('Switched to single size; extra rows discarded.');
      }
      setFormData((prevForm) => ({ ...prevForm, lot: newVal }));
      return newVal;
    });
  };

  const [activeTab, setActiveTab] = useState('ready');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [registeredProducts, setRegisteredProducts] = useState([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
  // Add these state variables at the top of your component
  const [lotDrawerOpen, setLotDrawerOpen] = useState(false);
  const [lotSizes, setLotSizes] = useState([{ size: '', set: '', grossWt: '', netWt: '', avgGrossWt: '', avgNetWt: '', avgSpecWt: '' }]);
  const [availableSizes, setAvailableSizes] = useState([]);

  // Calculate average net weight for each size
  const calculateSizeAverages = () => {
    const sizeGroups = {};

    lotSizes.forEach(item => {
      if (item.size && item.netWt) {
        if (!sizeGroups[item.size]) {
          sizeGroups[item.size] = {
            count: 0,
            totalNetWt: 0,
            sets: 0,
            totalGrossWt: 0
          };
        }
        sizeGroups[item.size].count += 1;
        sizeGroups[item.size].totalNetWt += parseFloat(item.netWt) || 0;
        sizeGroups[item.size].sets += parseFloat(item.set) || 0;
        sizeGroups[item.size].totalGrossWt += parseFloat(item.grossWt) || 0;
      }
    });

    const averages = Object.keys(sizeGroups).map(size => ({
      size,
      count: sizeGroups[size].count,
      averageNetWt: sizeGroups[size].totalNetWt / sizeGroups[size].count,
      totalSets: sizeGroups[size].sets,
      averageGrossWt: sizeGroups[size].totalGrossWt / sizeGroups[size].count
    }));

    return averages;
  };

  // Calculate totals and individual averages
  const calculateTotals = () => {
    const totals = {
      totalSets: lotSizes.reduce((sum, item) => sum + (parseFloat(item.set) || 0), 0),
      totalGrossWt: lotSizes.reduce((sum, item) => sum + (parseFloat(item.grossWt) || 0), 0),
      totalNetWt: lotSizes.reduce((sum, item) => sum + (parseFloat(item.netWt) || 0), 0)
    };
    return totals;
  };

  // Calculate individual item averages
  const calculateItemAverages = (item) => {
    const set = parseFloat(item.set) || 1; // Avoid division by zero
    const grossWt = parseFloat(item.grossWt) || 0;
    const netWt = parseFloat(item.netWt) || 0;

    return {
      avgGrossWt: (grossWt / set).toFixed(3),
      avgNetWt: (netWt / set).toFixed(3),
      avgSpecWt: ((grossWt - netWt) / set).toFixed(3)
    };
  };

  // Update lot sizes with calculated averages
  const updateLotSizesWithAverages = (sizes) => {
    return sizes.map(item => {
      const averages = calculateItemAverages(item);
      return {
        ...item,
        avgGrossWt: averages.avgGrossWt,
        avgNetWt: averages.avgNetWt,
        avgSpecWt: averages.avgSpecWt
      };
    });
  };

  // Add these functions
  const openLotDrawer = () => {
    setLotDrawerOpen(true);
    // Initialize with one empty row if empty
    if (lotSizes.length === 0) {
      setLotSizes([{ size: '', set: '', grossWt: '', netWt: '', avgGrossWt: '', avgNetWt: '', avgSpecWt: '' }]);
    }
  };

  const closeLotDrawer = () => {
    setLotDrawerOpen(false);
  };

  const handleAddLotSize = () => {
    if (!Lot || lotSizes.length >= getSizeOptions().length) return;  // Enforce for non-lot/multi-limit
    const availableSizes = getSizeOptions().filter(size => !lotSizes.some(item => item.size === size));
    if (availableSizes.length === 0) {
      alert('All available sizes have been added.');
      return;
    }
    setLotSizes([...lotSizes, { size: '', set: '', grossWt: '', netWt: '', avgGrossWt: '', avgNetWt: '', avgSpecWt: '' }]);
  };

  const handleSizeChange = (index, field, value) => {
    if (field === 'size') {
      // Check if this size is already selected in another row
      const duplicateIndex = lotSizes.findIndex(
        (item, i) => i !== index && item.size === value
      );

      if (duplicateIndex !== -1) {
        // Scroll to the duplicate row
        if (sizeRowRefs.current[duplicateIndex]) {
          sizeRowRefs.current[duplicateIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });

          // Add highlight class
          const element = sizeRowRefs.current[duplicateIndex];
          element.classList.add('duplicate-highlight');
          setTimeout(() => {
            element.classList.remove('duplicate-highlight');
          }, 2000);
        }

        // Focus on the duplicate's size select
        const duplicateSelect = document.querySelector(
          `[data-row-index="${duplicateIndex}"] select`
        );
        if (duplicateSelect) {
          duplicateSelect.focus();
        }

        return; // Prevent setting the duplicate size
      }
    }

    const newSizes = [...lotSizes];
    newSizes[index] = { ...newSizes[index], [field]: value };

    // Recalculate averages when set, grossWt, or netWt changes
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

  const handleSaveLot = () => {
    // Calculate totals
    const totals = calculateTotals();
    const totalGross = totals.totalGrossWt;
    const totalNetWt = totals.totalNetWt;
    const totalSets = totals.totalSets;

    // Update lot sizes with final averages
    const updatedLotSizes = updateLotSizesWithAverages(lotSizes);
    setLotSizes(updatedLotSizes);

    // Update form data
    setFormData(prev => ({
      ...prev,
      // Uniform for both: Use totals
      grossWt: totalGross.toFixed(3),
      netWt: totalNetWt.toFixed(3),
      instockGram: activeTab === 'ready' ? totalGross.toFixed(3) : '',
      instockSet: activeTab === 'ready' ? totalSets.toString() : '',
      moqSet: Lot ? (prev.moqSet || totalSets.toString()) : prev.moqSet,  // Auto-fill MOQ from total if empty
      lotSizes: updatedLotSizes,  // Save full details
      sizes: updatedLotSizes.map(item => item.size).filter(Boolean),  // Derived unique sizes
    }));

    closeLotDrawer();
  };

  const [formData, setFormData] = useState({
    segment: '',
    category: '',
    productName: '',
    moqGram: '',
    moqSet: '',
    lot: Lot,
    lotSizes: lotSizes,
    netWtPurity: '',
    wastage: '',
    specificationMC: '',
    specificationGramRate: '',
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
    status: 'pending'
  });

  // Use data from JSON file
  const segments = Object.keys(productData);
  const categoriesBySegment = {};
  const productSources = new Set();
  const productNamesBySource = {};
  const finishTypes = new Set();
  const specifications = new Set();
  Object.entries(productData).forEach(([segment, purities]) => {
      categoriesBySegment[segment] = Object.keys(purities); // 916HUID, 750HUID, etc.

      // Process each purity level
      Object.values(purities).forEach(sources => {
        Object.entries(sources).forEach(([source, products]) => {
          productSources.add(source);

          if (!productNamesBySource[source]) {
            productNamesBySource[source] = [];
          }

          // Process each product
          Object.entries(products).forEach(([productName, productData]) => {
            if (!productNamesBySource[source].includes(productName)) {
              productNamesBySource[source].push(productName);
            }

            // Process finish types
            if (productData.finishTypes) {
              Object.keys(productData.finishTypes).forEach(finishType => {
                finishTypes.add(finishType);
              });

              // Process specifications from finish types
              Object.values(productData.finishTypes).forEach(specs => {
                specs.forEach(spec => {
                  specifications.add(spec);
                });
              });
            }
          });
        });
      });
    });

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
        console.log(productDetails);
        setSelectedProduct(productDetails);

        // Auto-fill the form with registered data
        setFormData(prev => ({
          ...prev,
          wastage: productDetails.wastage || '',
          setMc: productDetails.setMC || '',
          specificationMC: productDetails.specificationMC || '',
          specificationGramRate: productDetails.specificationGramRate || '',
          netGramMc: productDetails.netGramMC || '',
          netWtPurity: productDetails.purity || '',
          // lotSizes handled below
        }));

        // Assume registered has weights; init single row for non-lot, or multi if data exists
        const initRow = {
          size: '',  // Still select in drawer
          set: productDetails.set || '1',
          grossWt: productDetails.grossWt || '',
          netWt: productDetails.netWt || '',
          ...calculateItemAverages({ set: productDetails.set || '1', grossWt: productDetails.grossWt || '0', netWt: productDetails.netWt || '0' })
        };
        setLotSizes(Lot ? [initRow, ...Array.from({length: 1}, () => ({...initRow, size: ''}))] : [initRow]);  // Multi for lot, single for non
      } else {
        setSelectedProduct(null);
        // Reset auto-filled fields if no match
        setFormData(prev => ({
          ...prev,
          wastage: '',
          setMc: '',
          specificationMC: '',
          netGramMc: '',
          netWtPurity: '',
        }));
        // Reset lotSizes to default
        setLotSizes([{ size: '', set: '', grossWt: '', netWt: '', avgGrossWt: '', avgNetWt: '', avgSpecWt: '' }]);
      }
    }
  }, [formData.segment, formData.category, formData.productName, formData.styleType,
  formData.specification, formData.productSource, registeredProducts, Lot]); // Re-init on toggle

  const handleImageUpload = async (files) => {
    setUploading(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      const formDataCloud = new FormData();
      formDataCloud.append('file', file);
      formDataCloud.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      try {
        const response = await fetch(CLOUDINARY_API_URL, {
          method: 'POST',
          body: formDataCloud,
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

  // Toggle size dropdown visibility (kept for legacy, but not used in unified)
  const toggleSizeDropdown = () => {
    setIsSizeDropdownOpen(!isSizeDropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isSizeDropdownOpen && !event.target.closest('.multi-select-dropdown')) {
        setIsSizeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSizeDropdownOpen]);

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

    if (lotSizes.length === 0 || !lotSizes.every(item => item.size)) {  // Unified: Require sizes in rows
      showAlertMessage(Lot ? 'Please add at least one size to the lot.' : 'Please select a size in lot details.');
      return;
    }

    try {
      // Calculate final averages before saving
      const finalLotSizes = updateLotSizesWithAverages(lotSizes);
      const totals = calculateTotals();

      const productDataToSave = {
        sellerId: sellerId,
        segment: formData.segment,
        category: formData.category,
        productName: formData.productName,
        styleType: formData.styleType,
        specification: formData.specification,
        productSource: formData.productSource,
        Lot,
        specificationMC: formData.specificationMC,
        specificationGramRate: formData.specificationGramRate,
        images: uploadedImages,
        serviceType: activeTab,
        wastage: formData.wastage,
        setMc: formData.setMc,
        netGramMc: formData.netGramMc,
        purity: formData.netWtPurity,
        moqSet: formData.moqSet,
        instockGram: activeTab === 'ready' ? formData.instockGram : '',
        instockSet: activeTab === 'ready' ? formData.instockSet : '',
        grossWt: formData.grossWt,
        netWt: formData.netWt,
        specificationWt: formData.specification !== 'PLANE' ? totals.totalGrossWt - totals.totalNetWt : '',
        sizes: finalLotSizes.map(item => item.size).filter(Boolean),  // Derived
        lotDetails: finalLotSizes,
        lotTotals: totals,
        paymentMethod: formData.paymentMethod,
        status: 'pending',
        timestamp: new Date()
      };

      await addDoc(collection(db, 'products'), productDataToSave);
      alert('Product added successfully!');

      // Reset form
      setUploadedImages([]);
      setSelectedProduct(null);
      setLotSizes([{ size: '', set: '', grossWt: '', netWt: '', avgGrossWt: '', avgNetWt: '', avgSpecWt: '' }]);
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
        status: 'pending'
      });
      setIsSizeDropdownOpen(false);
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product. Please try again.');
    }
  };

  // Generate product title for display
  const generateProductTitle = () => {
    return `${formData.segment || ''}-${formData.category || ''}-${formData.productName || ''}-${formData.styleType || ''}-${formData.specification || ''}`;
  };

  // Get size info based on current formData (traverses nested JSON)
  const getSizeInfo = () => {
    const segment = formData.segment;
    const category = formData.category;
    const source = formData.productSource;
    const productName = formData.productName.toUpperCase();
    if (!segment || !category || !source || !productName) return null;
    return productData[segment]?.[category]?.[source]?.[productName] || null;
  };

  // Get size options based on product name
  const getSizeOptions = () => {
    const sizeInfo = getSizeInfo();
    return sizeInfo?.options || [];
  };

  // Get size unit based on product name
  const getSizeUnit = () => {
    const sizeInfo = getSizeInfo();
    return sizeInfo?.sizing_unit || '';
  };

  // Get categories based on selected segment
  const getCategoriesForSegment = () => {
    if (!formData.segment) return [];
    return categoriesBySegment[formData.segment] || [];
  };

  const sizeAverages = calculateSizeAverages();
  const totals = calculateTotals();

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
            <div className='productDetails'>
              <div className="section-title">Product Details</div>
              <div className="radio-group-horizontal">
                <div className="radio-item">
                  <input
                    type="radio"
                    checked={Lot}
                    onClick={toggleHandleLot}
                  />
                  <label className="radio-label">{Lot ? 'Lot (Multi-Size)' : 'Single Size'}</label>
                </div>
              </div>
            </div>

            {/* MOQ: Always show, auto-filled from totals */}
            <div className="form-grid-2">
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

            {/* Weights: Show read-only totals preview */}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Total Gross Wt. (g)</label>
                <input
                  type="number"
                  step="0.001"
                  value={totals.totalGrossWt.toFixed(3)}
                  readOnly
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Total Net Wt. (g)</label>
                <input
                  type="number"
                  step="0.001"
                  value={totals.totalNetWt.toFixed(3)}
                  readOnly
                  className="form-input"
                />
              </div>
            </div>
            {formData.specification && formData.specification !== "PLANE" && (
              <div className="form-group">
                <label className="form-label">Specification Weight (g)</label>
                <input
                  type="number"
                  step="0.001"
                  value={((totals.totalGrossWt - totals.totalNetWt).toFixed(3))}
                  readOnly
                  className="form-input"
                />
              </div>
            )}

            {/* Unified Lot Details: Always show preview; click opens drawer */}
            {formData.productName && getSizeInfo() && (
              <div className="lot-summary" onClick={() => openLotDrawer()}>
                <label>
                  Lot Details ({getSizeUnit()})
                  {getSizeInfo()?.note && (
                    <span className="size-note"> ({getSizeInfo().note})</span>
                  )}
                </label>
                <div className="lot-preview">
                  <div className="lot-preview-table">
                    <table className='lot-table'>
                      <thead>
                        <tr>
                          <th>Size</th>
                          <th>Sets</th>
                          <th>Gross(g)</th>
                          <th>Net(g)</th>
                          <th>Avg Gross-Net-{formData.specification === "PLANE" ? "" : formData.specification}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lotSizes.map((item, index) => (
                          <tr key={index}>
                            <td>{item.size || '-'}</td>
                            <td>{item.set || '0'}</td>
                            <td>{item.grossWt || '0.000'}</td>
                            <td>{item.netWt || '0.000'}</td>
                            <td>
                              {item.avgGrossWt || '0.000'}-{item.avgNetWt || '0.000'}-{formData.specification === "PLANE" ? "" : item.avgSpecWt || '0.000'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="totals-row">
                          <td>Total ({Lot ? 'Lot' : 'Single'})</td>
                          <td>{totals.totalSets}</td>
                          <td>{totals.totalGrossWt.toFixed(3)}</td>
                          <td>{totals.totalNetWt.toFixed(3)}</td>
                          {formData.specification && formData.specification !== "PLANE" && <td>({formData.specification}) {((totals.totalGrossWt - totals.totalNetWt)).toFixed(3)}</td>}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <div className="click-to-edit">Click to {Lot ? 'edit lot' : 'edit size'} details</div>
                </div>
              </div>
            )}

            <div
              style={{
                marginTop: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <label
                style={{
                  fontWeight: 600,
                  color: '#222',
                  fontSize: '1rem',
                  marginBottom: '0.25rem',
                }}
              >
                Payment Method
              </label>

              <div
                style={{
                  display: 'flex',
                  gap: '2rem',
                  alignItems: 'center',
                }}
              >
                {['RTGS', 'Metal'].map((method) => (
                  <label
                    key={method}
                    htmlFor={`payment-${method.toLowerCase()}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      color: '#333',
                      fontSize: '0.95rem',
                      position: 'relative',
                      userSelect: 'none',
                      gap: '0.5rem',
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      id={`payment-${method.toLowerCase()}`}
                      value={method}
                      checked={formData.paymentMethod === method}
                      onChange={(e) =>
                        handleInputChange('paymentMethod', e.target.value)
                      }
                      style={{
                        display: 'none',
                      }}
                    />
                    <span
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: '2px solid #c49b27',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor:
                          formData.paymentMethod === method ? '#c49b27' : 'transparent',
                        boxShadow:
                          formData.paymentMethod === method
                            ? '0 0 5px rgba(196,155,39,0.6)'
                            : 'none',
                        transition: 'all 0.25s ease',
                      }}
                    >
                      {formData.paymentMethod === method && (
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#fff',
                          }}
                        />
                      )}
                    </span>
                    {method}
                  </label>
                ))}
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
        {/* Lot Management Drawer */}
        {lotDrawerOpen && (
          <div className="lot-drawer-overlay" onClick={closeLotDrawer}>
            <div className="lot-drawer" onClick={e => e.stopPropagation()}>
              <div className="drawer-header">
                <h3>Add Lot Details</h3>
                <button className="close-btn" onClick={closeLotDrawer}>×</button>
              </div>

              <div className="drawer-body">
                {/* Size Input Section */}
                <div className="size-input-section">
                  <h4>Add Size Details</h4>
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

                      {lotSizes.length > 1 && Lot && (
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
                    onClick={handleAddLotSize}
                    className="add-size-btn"
                    disabled={!Lot || lotSizes.length >= getSizeOptions().length}
                  >
                    + Add More Size
                  </button>
                </div>

                {/* Size Averages Table */}
                {sizeAverages.length > 0 && (
                  <div className="size-averages-section">
                    <h4>Size & Totals</h4>
                    <div className="averages-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Size</th>
                            <th>Total Sets</th>
                            <th>Gross Wt (g)</th>
                            <th>Net Wt (g)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sizeAverages.map((avg, index) => (
                            <tr key={index}>
                              <td>{avg.size}</td>
                              <td>{avg.totalSets}</td>
                              <td>{avg.averageGrossWt.toFixed(3)}</td>
                              <td>{avg.averageNetWt.toFixed(3)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="totals-row">
                            <td colSpan="1">Total</td>
                            <td>{totals.totalSets}</td>
                            <td>{totals.totalGrossWt.toFixed(3)}</td>
                            <td>{totals.totalNetWt.toFixed(3)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="drawer-footer">
                <button className="cancel-btn" onClick={closeLotDrawer}>Cancel</button>
                <button
                  className="save-btn"
                  onClick={handleSaveLot}
                  disabled={!lotSizes.every(item => item.size && item.grossWt && item.netWt)}
                >
                  Save Lot
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UploadProduct;