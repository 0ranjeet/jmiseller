import React, { useState, useEffect, useMemo } from 'react';
import { X, Edit, ChevronDown, Upload, AlertCircle } from 'lucide-react';
import { db } from '../services/firebase';
import { doc, setDoc, collection, getDocs, getDoc } from 'firebase/firestore';
import './ProductRegistration.css';
import { useNavigate } from 'react-router-dom';
import { useSeller } from '../contexts/SellerContext';
import PageHeader from '../components/PageHeader';
import ProductData from './SELLERPRODUCT.json';

const ProductRegistration = () => {
  const nav = useNavigate();
  const { seller } = useSeller();
  const sellerId = seller?.sellerId;
  const Segment = (seller?.segment)?.toUpperCase();
  
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [currentProductForDetails, setCurrentProductForDetails] = useState(null);
  const [currentStyleType, setCurrentStyleType] = useState('Regular');
  const [productDetails, setProductDetails] = useState({
    purity: '',
    wastage: '',
    setMC: '',
    netGramMC: '',
    specification: 'PLANE',
    specificationMC: '',
    specificationGramRate: ''
  });
  const [productSpecs, setProductSpecs] = useState([]);
  const [loadingSpecs, setLoadingSpecs] = useState(true);
  const [showCategoryAlert, setShowCategoryAlert] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [registeredProducts, setRegisteredProducts] = useState([]);
  const [uploading, setUploading] = useState(true);

  const purityLimits = {
    GOLD: {
      '916HUID': { min: 91.6, max: 92 },
      '750HUID': { min: 72, max: 75 },
      '840': { min: 80, max: 88 },
      '650': { min: 60, max: 70 },
      '480': { min: 45, max: 48 }
    },
    SILVER: {
      '925': { min: 90, max: 95 },
      '999': { min: 95, max: 100 },
      '800': { min: 75, max: 85 },
      '900': { min: 85, max: 95 }
    },
    PLATINUM: {
      '950': { min: 90, max: 98 },
      '900': { min: 85, max: 95 },
      '850': { min: 80, max: 90 }
    },
    DIAMOND: {
      'VS1': { min: 0, max: 100 },
      'VS2': { min: 0, max: 100 },
      'VVS1': { min: 0, max: 100 },
      'VVS2': { min: 0, max: 100 },
      'SI1': { min: 0, max: 100 },
      'SI2': { min: 0, max: 100 }
    },
    GEMS: {
      'Emerald': { min: 0, max: 100 },
      'Ruby': { min: 0, max: 100 },
      'Sapphire': { min: 0, max: 100 },
      'Topaz': { min: 0, max: 100 }
    },
    PEARLS: {
      'Freshwater': { min: 0, max: 100 },
      'Akoya': { min: 0, max: 100 },
      'Tahitian': { min: 0, max: 100 },
      'South Sea': { min: 0, max: 100 }
    }
  };

  // Extract data from new JSON structure
  const segments = useMemo(() => Object.keys(ProductData), []);
  
  const categoriesBySegment = useMemo(() => {
    const result = {};
    segments.forEach(segment => {
      result[segment] = Object.keys(ProductData[segment] || {});
    });
    return result;
  }, [segments]);

  const getSubcategories = useMemo(() => {
    if (!Segment || !selectedCategory) return [];
    return Object.keys(ProductData[Segment]?.[selectedCategory] || {});
  }, [Segment, selectedCategory]);

  const getProductNames = useMemo(() => {
    if (!Segment || !selectedCategory || !selectedSubcategory) return [];
    return Object.keys(ProductData[Segment]?.[selectedCategory]?.[selectedSubcategory] || {});
  }, [Segment, selectedCategory, selectedSubcategory]);

  // Get available finish types for a specific product
  const getAvailableFinishTypes = (productName) => {
    if (!Segment || !selectedCategory || !selectedSubcategory || !productName) return [];
    
    const productData = ProductData[Segment]?.[selectedCategory]?.[selectedSubcategory]?.[productName];
    if (!productData?.finishTypes) return [];
    
    return Object.keys(productData.finishTypes);
  };

  // Get available specifications for a specific product and finish type
  const getAvailableSpecifications = (productName, finishType) => {
    if (!Segment || !selectedCategory || !selectedSubcategory || !productName || !finishType) {
      return ['PLANE', 'MEENAWORK', 'STONEWORK', 'OTHERWORK'];
    }
    
    const productData = ProductData[Segment]?.[selectedCategory]?.[selectedSubcategory]?.[productName];
    return productData?.finishTypes?.[finishType] || ['PLANE', 'MEENAWORK', 'STONEWORK', 'OTHERWORK'];
  };

  const allProducts = useMemo(() => {
    const products = [];
    let id = 1;
    
    segments.forEach(segment => {
      const categories = Object.keys(ProductData[segment] || {});
      categories.forEach(category => {
        const subcategories = Object.keys(ProductData[segment][category] || {});
        subcategories.forEach(subcategory => {
          const productNames = Object.keys(ProductData[segment][category][subcategory] || {});
          productNames.forEach(name => {
            const productInfo = ProductData[segment][category][subcategory][name];
            
            // Get available finish types directly from JSON (no mapping)
            const styleTypes = Object.keys(productInfo.finishTypes || {});
            
            products.push({
              id: id++,
              name,
              image: `https://placehold.co/60x60/E0E0E0/333333?text=${name[0]}`,
              segment,
              categoryId: category,
              subcategoryId: subcategory,
              styleTypes,
              productInfo
            });
          });
        });
      });
    });
    return products;
  }, [segments]);

  useEffect(() => {
    const fetchProductSpecs = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'productSpecs'));
        const specsData = [];
        querySnapshot.forEach((doc) => {
          specsData.push({ id: doc.id, ...doc.data() });
        });
        setProductSpecs(specsData);
        setLoadingSpecs(false);
      } catch (error) {
        console.error('Error fetching product specs:', error);
        setLoadingSpecs(false);
      }
    };
    fetchProductSpecs();
  }, []);

  useEffect(() => {
    const fetchRegisteredProducts = async () => {
      if (!sellerId) return;
      try {
        const docRef = doc(db, 'ProductRegistrations', sellerId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const approved = data.registrations?.filter(reg => reg.status === 'approved') || [];
          setRegisteredProducts(approved);
        }
      } catch (error) {
        console.error('Error fetching registered products:', error);
      }
    };
    fetchRegisteredProducts();
  }, [sellerId]);

  const [productData, setProductData] = useState(() => {
    const initialProductData = {};
    allProducts.forEach(product => {
      const productEntry = { selectedStyleType: null };
      
      // Create entries for each style type dynamically from JSON
      product.styleTypes.forEach(styleType => {
        productEntry[styleType] = {
          selected: false,
          image: null,
          details: {
            purity: '',
            wastage: '',
            setMC: '',
            netGramMC: '',
            specification: 'PLANE',
            specificationMC: '',
            specificationGramRate: ''
          }
        };
      });
      
      initialProductData[product.id] = productEntry;
    });
    return initialProductData;
  });

  const isCategoryConfigured = (segment, category, subcategory) => {
    return productSpecs.some(spec =>
      spec.segment === segment &&
      spec.category === category &&
      spec.productSource === subcategory
    );
  };

  const getCategoryLimits = (segment, category, subcategory, productName, selectedSpecification = null) => {
    if (selectedSpecification) {
      const exactSpecMatch = productSpecs.find(spec =>
        spec.segment === segment &&
        spec.category === category &&
        spec.productSource === subcategory &&
        spec.productName === productName &&
        spec.specification === selectedSpecification
      );
      if (exactSpecMatch) {
        return exactSpecMatch;
      }
    }

    const productMatch = productSpecs.find(spec =>
      spec.segment === segment &&
      spec.category === category &&
      spec.productSource === subcategory &&
      spec.productName === productName
    );
    if (productMatch) {
      return productMatch;
    }

    const categorySpecs = productSpecs.find(spec =>
      spec.segment === segment &&
      spec.category === category &&
      spec.productSource === subcategory
    );
    return categorySpecs || null;
  };

  const validateSpecificationConstraint = (field, value, categoryLimits, specType) => {
    if (!categoryLimits) return true;
    let maxValue = null;
    let fieldName = '';

    if (field === 'mc') {
      const sanitizedSpecType = specType.replace(/\s+/g, '').toUpperCase();
      const specificFieldName = `max${sanitizedSpecType}MakingSeller`;
      maxValue = categoryLimits[specificFieldName];
      fieldName = 'Specification MC';

      if (maxValue === undefined || maxValue === null) {
        maxValue = categoryLimits.maxSpecificationMakingSeller;
      }
    } else if (field === 'gramRate') {
      const sanitizedSpecType = specType.replace(/\s+/g, '').toUpperCase();
      const specificFieldName = `max${sanitizedSpecType}GramRateSeller`;
      maxValue = categoryLimits[specificFieldName];
      fieldName = 'Specification Gram Rate';

      if (maxValue === undefined || maxValue === null) {
        maxValue = categoryLimits.maxSpecificationGramRateSeller;
      }
    }

    const numMaxValue = parseFloat(maxValue);
    const numValue = parseFloat(value);
    if (!isNaN(numMaxValue) && !isNaN(numValue) && numValue > numMaxValue) {
      return `${fieldName} cannot exceed ${numMaxValue} for ${specType}`;
    }
    return true;
  };

  const calculateTotalWastage = (details) => {
    if (details.specification === 'PLANE') {
      const baseWastage = parseFloat(details.wastage) || 0;
      return baseWastage;
    } else {
      const baseWastage = parseFloat(details.wastage) + (details?.specificationMC > 0 ? parseFloat(details.specificationMC) : 0);
      return baseWastage;
    }
  };

  const calculateTotalMakingCharges = (details) => {
    const setMC = parseFloat(details.setMC) || 0;
    const netGramMC = parseFloat(details.netGramMC) || 0;
    return setMC + netGramMC;
  };

  const filteredProducts = useMemo(() => {
    if (!Segment || !selectedCategory || !selectedSubcategory) {
      return [];
    }
    return allProducts.filter(
      (product) =>
        product.segment === Segment &&
        product.categoryId === selectedCategory &&
        product.subcategoryId === selectedSubcategory
    );
  }, [Segment, selectedCategory, selectedSubcategory, allProducts]);

  const getStyleLabel = (style) => {
    // Return the style as-is from JSON (Regular, LightWeight, HighFancy, HighFinish)
    return style;
  };

  const handleStyleSelect = (productId, styleType) => {
    const product = allProducts.find(p => p.id === productId);
    if (!isCategoryConfigured(Segment, selectedCategory, selectedSubcategory)) {
      setShowCategoryAlert(true);
      return;
    }

    const newProductData = { ...productData };
    const currentSelectedStyle = newProductData[productId].selectedStyleType;

    if (currentSelectedStyle === styleType) {
      newProductData[productId].selectedStyleType = null;
      newProductData[productId][styleType].selected = false;
      setSelectedProducts(selectedProducts.filter(p => !(p.productId === productId)));
    } else {
      if (currentSelectedStyle) {
        newProductData[productId][currentSelectedStyle].selected = false;
      }
      newProductData[productId].selectedStyleType = styleType;
      newProductData[productId][styleType].selected = true;

      const updatedSelectedProducts = selectedProducts.filter(p => p.productId !== productId);
      setSelectedProducts([...updatedSelectedProducts, {
        productId: productId,
        styleType: styleType,
        productName: product.name
      }]);

      if (!newProductData[productId][styleType].details ||
        !newProductData[productId][styleType].details.purity) {
        setCurrentProductForDetails(productId);
        setCurrentStyleType(styleType);
        setProductDetails({ ...newProductData[productId][styleType].details, specification: 'PLANE' });
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
    setValidationErrors({});
  };

  const handleImageUpload = async (event, productId) => {
    if (!isCategoryConfigured(Segment, selectedCategory, selectedSubcategory)) {
      setShowCategoryAlert(true);
      return;
    }

    event.stopPropagation();
    const file = event.target.files[0];
    if (!file) return;

    const product = allProducts.find(p => p.id === productId);
    const currentSelectedStyle = productData[productId].selectedStyleType || product.styleTypes[0];
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

        if (!newProductData[productId][currentSelectedStyle].selected) {
          newProductData[productId].selectedStyleType = currentSelectedStyle;
          newProductData[productId][currentSelectedStyle].selected = true;

          const updatedSelectedProducts = selectedProducts.filter(p => p.productId !== productId);
          setSelectedProducts([...updatedSelectedProducts, {
            productId: productId,
            styleType: currentSelectedStyle,
            productName: allProducts.find(p => p.id === productId)?.name
          }]);
        }
        setProductData(newProductData);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      const reader = new FileReader();
      reader.onloadend = () => {
        const newProductData = { ...productData };
        newProductData[productId][currentSelectedStyle].image = reader.result;

        if (!newProductData[productId][currentSelectedStyle].selected) {
          newProductData[productId].selectedStyleType = currentSelectedStyle;
          newProductData[productId][currentSelectedStyle].selected = true;

          const updatedSelectedProducts = selectedProducts.filter(p => p.productId !== productId);
          setSelectedProducts([...updatedSelectedProducts, {
            productId: productId,
            styleType: currentSelectedStyle,
            productName: allProducts.find(p => p.id === productId)?.name
          }]);
        }
        setProductData(newProductData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCardClick = (productId) => {
    if (!isCategoryConfigured(Segment, selectedCategory, selectedSubcategory)) {
      setShowCategoryAlert(true);
      return;
    }

    const product = allProducts.find(p => p.id === productId);
    if (!productData[productId].selectedStyleType && product.styleTypes.length > 0) {
      handleStyleSelect(productId, product.styleTypes[0]);
    }
  };

  const handleSendToQC = async () => {
    if (!sellerId) {
      alert('Seller ID not found. Please log in again.');
      return;
    }
    setUploading(false);
    if (!isCategoryConfigured(Segment, selectedCategory, selectedSubcategory)) {
      setShowCategoryAlert(true);
      return;
    }

    if (selectedProducts.length === 0) {
      alert('Please select at least one product with details before submitting.');
      return;
    }

    try {
      const timestamp = Date.now();
      const docRef = doc(db, 'ProductRegistrations', sellerId);

      const docSnap = await getDoc(docRef);
      let existingRegistrations = docSnap.exists() ? docSnap.data().registrations || [] : [];

      const newRegistrations = [];

      selectedProducts.forEach(({ productId, styleType, productName }) => {
        const product = allProducts.find(p => p.id === productId);
        const styleData = productData[productId][styleType];

        if (styleData.selected && styleData.details.purity) {
          const newRegistration = {
            registrationId: `${sellerId}_${productId}_${styleType}_${timestamp}`,
            status: 'pending_approval',
            approved: false,
            requestTimestamp: new Date(),
            segment: Segment,
            category: selectedCategory,
            productSource: selectedSubcategory,
            products: {
              [productName]: {
                productId: productId,
                segment: Segment,
                category: selectedCategory,
                productSource: selectedSubcategory,
                purity: styleData.details.purity,
                wastage: styleData.details.wastage,
                setMC: styleData.details.setMC,
                netGramMC: styleData.details.netGramMC,
                specification: styleData.details.specification,
                specificationMC: styleData.details.specificationMC || "",
                specificationGramRate: styleData.details.specificationGramRate || "",
                image: styleData.image || "",
                selectedStyleType: styleType
              }
            }
          };

          newRegistrations.push(newRegistration);
        }
      });

      if (newRegistrations.length === 0) {
        alert('No valid products with complete details selected.');
        return;
      }

      const updatedRegistrations = [...existingRegistrations];

      newRegistrations.forEach(newReg => {
        const productName = Object.keys(newReg.products)[0];
        const productData = newReg.products[productName];

        const registrationKey = `${Segment}_${selectedCategory}_${selectedSubcategory}_${productName}_${productData.selectedStyleType}_${productData.specification}`;

        const existingIndex = updatedRegistrations.findIndex(existingReg => {
          const existingProductName = Object.keys(existingReg.products || {})[0];
          const existingProductData = existingReg.products[existingProductName];

          if (!existingProductData) return false;

          const existingKey = `${existingReg.segment}_${existingReg.category}_${existingReg.productSource}_${existingProductName}_${existingProductData.selectedStyleType}_${existingProductData.specification}`;
          return existingKey === registrationKey;
        });

        if (existingIndex !== -1) {
          updatedRegistrations[existingIndex] = {
            ...updatedRegistrations[existingIndex],
            ...newReg,
            registrationId: updatedRegistrations[existingIndex].registrationId,
            requestTimestamp: new Date(),
            status: 'pending_approval'
          };
        } else {
          updatedRegistrations.push(newReg);
        }
      });

      const saveData = {
        sellerId: sellerId,
        registrations: updatedRegistrations,
        ...(docSnap.exists() ? { lastUpdated: new Date() } : {
          createdAt: new Date(),
          lastUpdated: new Date()
        })
      };

      await setDoc(docRef, saveData);

      const sellerProfileRef = doc(db, 'profile', sellerId);
      await setDoc(sellerProfileRef, {
        ProductRegistration: true,
      }, { merge: true });
      
      setUploading(true);
      nav("/QCApprovalPage", { state: { totalSelected: selectedProducts.length } });

      setSelectedProducts([]);
    } catch (error) {
      console.error('Error sending data for approval:', error);
      alert('Error submitting product registration. Please try again.');
    }
  };

  const handleSaveProductDetails = () => {
    const currentProduct = allProducts.find(p => p.id === currentProductForDetails);
    const categoryLimits = getCategoryLimits(
      Segment,
      selectedCategory,
      selectedSubcategory,
      currentProduct.name,
      productDetails.specification
    );

    const errors = {};
    const segmentPurityLimits = purityLimits[Segment] || {};
    const categoryPurityLimits = segmentPurityLimits[selectedCategory] || { min: 0, max: 100 };

    if (parseFloat(productDetails.purity) < categoryPurityLimits.min ||
      parseFloat(productDetails.purity) > categoryPurityLimits.max) {
      errors.purity = `Purity must be between ${categoryPurityLimits.min} and ${categoryPurityLimits.max} for ${Segment} - ${selectedCategory}`;
    }

    if (categoryLimits) {
      const totalWastage = calculateTotalWastage(productDetails);
      if (totalWastage > (parseFloat(categoryLimits.maxWastageSeller) + (parseFloat(categoryLimits.specificationMC)))) {
        errors.totalWastage = `Total wastage (${totalWastage.toFixed(2)}%) cannot exceed ${categoryLimits.maxWastageSeller}%`;
      }

      if (productDetails.specification === 'PLANE') {
        if (parseFloat(productDetails.setMC) > parseFloat(categoryLimits.maxSetMakingSeller)) {
          errors.setMC = `Set making charges cannot exceed ${categoryLimits.maxSetMakingSeller}`;
        }
        if (parseFloat(productDetails.netGramMC) > parseFloat(categoryLimits.maxGramMakingSeller)) {
          errors.netGramMC = `Net Gram MC cannot exceed ${categoryLimits.maxGramMakingSeller}`;
        }
      } else {
        const specType = productDetails.specification;
        const specMCError = validateSpecificationConstraint('mc', productDetails.specificationMC, categoryLimits, specType);
        if (specMCError !== true) {
          errors.specificationMC = specMCError;
        }

        const specGramRateError = validateSpecificationConstraint('gramRate', productDetails.specificationGramRate, categoryLimits, specType);
        if (specGramRateError !== true) {
          errors.specificationGramRate = specGramRateError;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    const newProductData = { ...productData };
    newProductData[currentProductForDetails][currentStyleType].details = { ...productDetails };
    newProductData[currentProductForDetails][currentStyleType].selected = true;
    newProductData[currentProductForDetails].selectedStyleType = currentStyleType;

    const updatedSelectedProducts = selectedProducts.filter(p => p.productId !== currentProductForDetails);
    setSelectedProducts([...updatedSelectedProducts, {
      productId: currentProductForDetails,
      styleType: currentStyleType,
      productName: allProducts.find(p => p.id === currentProductForDetails)?.name
    }]);

    setProductData(newProductData);
    setShowProductDetails(false);
  };

  const getTotalSelected = () => {
    return selectedProducts.length;
  };

  const hasStyleSelected = (productId) => {
    return productData[productId].selectedStyleType !== null;
  };

  const getCurrentImage = (productId) => {
    const selectedStyle = productData[productId].selectedStyleType;
    if (selectedStyle && productData[productId][selectedStyle]) {
      return productData[productId][selectedStyle].image;
    }
    // Return first available style type image as default
    const product = allProducts.find(p => p.id === productId);
    if (product && product.styleTypes.length > 0) {
      return productData[productId][product.styleTypes[0]]?.image;
    }
    return null;
  };

  const getCurrentDetails = (productId) => {
    const selectedStyle = productData[productId].selectedStyleType;
    if (selectedStyle && productData[productId][selectedStyle]) {
      return productData[productId][selectedStyle].details;
    }
    // Return first available style type details as default
    const product = allProducts.find(p => p.id === productId);
    if (product && product.styleTypes.length > 0) {
      return productData[productId][product.styleTypes[0]]?.details;
    }
    return null;
  };

  const renderProductDetailsPopup = () => {
    if (!showProductDetails) return null;

    const currentProduct = allProducts.find(p => p.id === currentProductForDetails);
    const categoryLimits = getCategoryLimits(
      Segment,
      selectedCategory,
      selectedSubcategory,
      currentProduct.name,
      productDetails.specification
    );

    // Get available specifications for this product and finish type
    const availableSpecifications = getAvailableSpecifications(
      currentProduct.name,
      currentStyleType
    );

    const segmentPurityLimits = purityLimits[Segment] || {};
    const categoryPurityLimits = segmentPurityLimits[selectedCategory] || { min: 0, max: 100 };
    const totalWastage = calculateTotalWastage(productDetails);

    const handleSpecificationChange = (e) => {
      const newSpec = e.target.value;
      setProductDetails(prev => ({
        ...prev,
        specification: newSpec,
        ...(newSpec === 'PLANE' ? {
          specificationMC: '',
          specificationGramRate: ''
        } : {})
      }));
    };

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
            <div className="form-group" style={{ textAlign: 'center', marginBottom: '25px' }}>
              <label className="form-label" style={{ marginBottom: '10px' }}>
                Sample Image for {getStyleLabel(currentStyleType)}
              </label>
              <div className="product-image-upload-area" style={{ margin: '0 auto', width: '100px', height: '100px', backgroundColor: 'var(--primary-color)' }}>
                {productData[currentProductForDetails][currentStyleType].image ? (
                  <img
                    src={productData[currentProductForDetails][currentStyleType].image}
                    alt="Product Sample"
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100/E0E0E0/333333?text=Error'; }}
                  />
                ) : (
                  <Upload color="white" size={48} />
                )}
              </div>
            </div>
            <div>
              <div className="form-group">
                <label className="form-label">Enter Purity(%) *</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder={`Min: ${categoryPurityLimits.min}, Max: ${categoryPurityLimits.max}`}
                  value={productDetails.purity}
                  onChange={(e) => setProductDetails({ ...productDetails, purity: e.target.value })}
                  className="form-input"
                  required
                />
                {validationErrors.purity && <span className="error-message">{validationErrors.purity}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Wastage (%) *</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder={`Max: ${categoryLimits?.maxWastageSeller || 'N/A'}%`}
                  value={productDetails.wastage}
                  onChange={(e) => setProductDetails({ ...productDetails, wastage: e.target.value })}
                  className="form-input"
                  required
                />
                {validationErrors.wastage && <span className="error-message">{validationErrors.wastage}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Set MC *</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder={`Max: ${categoryLimits?.maxSetMakingSeller || 'N/A'}`}
                  value={productDetails.setMC}
                  onChange={(e) => setProductDetails({ ...productDetails, setMC: e.target.value })}
                  className="form-input"
                  required
                />
                {validationErrors.setMC && <span className="error-message">{validationErrors.setMC}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Net Gram MC *</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder={`Max: ${categoryLimits?.maxGramMakingSeller || 'N/A'}`}
                  value={productDetails.netGramMC}
                  onChange={(e) => setProductDetails({ ...productDetails, netGramMC: e.target.value })}
                  className="form-input"
                  required
                />
                {validationErrors.netGramMC && <span className="error-message">{validationErrors.netGramMC}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Specification *</label>
                <select
                  value={productDetails.specification}
                  onChange={handleSpecificationChange}
                  className="form-input"
                  required
                >
                  <option value="">Select Specification</option>
                  {availableSpecifications.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
                {validationErrors.specification && <span className="error-message">{validationErrors.specification}</span>}
              </div>

              {productDetails.specification !== 'PLANE' ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Specification wastage</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder={`Max: ${categoryLimits?.maxSpecificationMakingSeller || 'N/A'}`}
                      value={productDetails.specificationMC}
                      onChange={(e) => setProductDetails({ ...productDetails, specificationMC: e.target.value })}
                      className="form-input"
                    />
                    {validationErrors.specificationMC && <span className="error-message">{validationErrors.specificationMC}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Specification Gram Rate</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder={`Max: ${categoryLimits?.maxSpecificationGramRateSeller || 'N/A'}`}
                      value={productDetails.specificationGramRate}
                      onChange={(e) => setProductDetails({ ...productDetails, specificationGramRate: e.target.value })}
                      className="form-input"
                    />
                    {validationErrors.specificationGramRate && <span className="error-message">{validationErrors.specificationGramRate}</span>}
                  </div>
                </>
              ) : ""}
            </div>

            <div className="totals-section">
              <div className="total-row">
                <span className="total-label">Total Wastage:</span>
                <span className="total-value">{totalWastage.toFixed(2)}%</span>
              </div>
              <div className="total-row">
                <span className="total-label">Set Making Charges:</span>
                <span className="total-value">{productDetails?.setMC}</span>
              </div>
              <div className="total-row">
                <span className="total-label">Gram Making Charges:</span>
                <span className="total-value">{productDetails?.netGramMC}</span>
              </div>
              {productDetails.specification !== 'PLANE' && <div className="total-row">
                <span className="total-label">{productDetails.specification} Gram rate:</span>
                <span className="total-value">{productDetails?.specificationGramRate}</span>
              </div>}
              {validationErrors.totalWastage && (
                <div className="error-message total-error">{validationErrors.totalWastage}</div>
              )}
              {validationErrors.totalMaking && (
                <div className="error-message total-error">{validationErrors.totalMaking}</div>
              )}
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
              disabled={Object.keys(validationErrors).length > 0}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCategoryAlert = () => {
    if (!showCategoryAlert) return null;

    return (
      <div className="alert-overlay">
        <div className="alert-popup">
          <div className="alert-header">
            <AlertCircle size={24} color="#dc2626" />
            <h3>Category Not Configured</h3>
          </div>
          <div className="alert-content">
            <p>The selected combination "{Segment} / {selectedCategory} / {selectedSubcategory}" is not configured in the system.</p>
            <p>Please contact JMI to configure this combination before proceeding with product registration.</p>
          </div>
          <div className="alert-actions">
            <button
              onClick={() => setShowCategoryAlert(false)}
              className="alert-button"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <PageHeader title="Product Registration" />
      <div className="app-container">
        <div className="main-content">
          <p className="sub-heading">Choose your product category, sub-type, and styles to begin listing.</p>

          <div className="form-group">
            <label className="form-label">Segment</label>
            <div className="horizontal-scroll-container">
              <button
                className="category-button selected"
              >
                {Segment}
              </button>
            </div>
          </div>

          {Segment && (
            <div className="form-group">
              <label className="form-label">Category</label>
              <div className="horizontal-scroll-container">
                {categoriesBySegment[Segment]?.map(cat => (
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
          )}

          {selectedCategory && (
            <div className="form-group">
              <label className="form-label">Subcategory</label>
              <div className="horizontal-scroll-container">
                {getSubcategories.map(sub => (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubcategory(sub)}
                    className={`category-button ${selectedSubcategory === sub ? 'selected' : ''} ${!isCategoryConfigured(Segment, selectedCategory, sub) ? 'not-configured' : ''}`}
                    title={!isCategoryConfigured(Segment, selectedCategory, sub) ? 'Segment/Category/Subcategory not configured - Contact JMI' : ''}
                  >
                    {sub}
                    {!isCategoryConfigured(Segment, selectedCategory, sub) && <AlertCircle size={14} />}
                  </button>
                ))}
              </div>
            </div>
          )}

          <h3 className="section-title">Select Products</h3>

          {Segment && selectedCategory && selectedSubcategory ? (
            !isCategoryConfigured(Segment, selectedCategory, selectedSubcategory) ? (
              <div className="category-warning">
                <AlertCircle size={24} />
                <p>This segment/category/subcategory combination is not configured. Please contact JMI to configure "{Segment} / {selectedCategory} / {selectedSubcategory}" before proceeding.</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div style={{ marginBottom: '30px' }}>
                {filteredProducts.map(product => {
                  const selectedStyle = productData[product.id].selectedStyleType;
                  const currentDetails = getCurrentDetails(product.id);
                  const currentImage = getCurrentImage(product.id);
                  const totalWastage = calculateTotalWastage(currentDetails);
                  const totalMakingCharges = calculateTotalMakingCharges(currentDetails);

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
                            <Upload color="#999" size={24} />
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
                          <p className="product-specs">{product.segment} / {product.categoryId} / {product.subcategoryId}</p>
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
                            <Edit
                              onClick={(e) => { e.stopPropagation(); handleEditDetails(product.id, selectedStyle); }}
                              className="metrics-edit-icon"
                            />
                          </div>
                          <div className="metric-item">
                            <div className="metric-grid">
                              <div>Purity: <span className="metric-value">{currentDetails.purity || '-'}%</span></div>
                              <div>Specification: <span className="metric-value">{currentDetails.specification || '-'}</span></div>
                              <div>Wastage: <span className="metric-value">{currentDetails.wastage || '-'}%</span></div>

                              {currentDetails.specification === 'PLANE' ? (
                                <>
                                  <div>Set MC: <span className="metric-value">{currentDetails.setMC || '-'}</span></div>
                                  <div>Net Gram MC: <span className="metric-value">{currentDetails.netGramMC || '-'}</span></div>
                                </>
                              ) : (
                                <>
                                  <div>Spec MC: <span className="metric-value">{currentDetails.specificationMC || '-'}</span></div>
                                  <div>Spec Gram Rate: <span className="metric-value">{currentDetails.specificationGramRate || '-'}</span></div>
                                </>
                              )}
                            </div>
                            <div className="total-metrics">
                              <div>Total Wastage: <span className="metric-value">{totalWastage.toFixed(3)}%</span></div>
                              <div>Total Making: <span className="metric-value">{totalMakingCharges.toFixed(2)}</span></div>
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
              <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>No products found for the selected segment, category, and subcategory.</p>
            )
          ) : (
            <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>Please select a segment, category, and subcategory to view products.</p>
          )}
        </div>

        <div className="sticky-footer">
          <span className="selected-products-count">Selected: {getTotalSelected()} Products</span>
          <button
            className="send-to-qc-button"
            onClick={handleSendToQC}
            disabled={!uploading || selectedProducts.length === 0 || !isCategoryConfigured(Segment, selectedCategory, selectedSubcategory)}
          >
            Send to QC
          </button>
        </div>

        {renderProductDetailsPopup()}
        {renderCategoryAlert()}
      </div>
    </>
  );
};

export default ProductRegistration;