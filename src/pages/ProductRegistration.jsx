import React, { useState, useEffect, useMemo } from 'react';
import { X, Edit, ChevronDown, Upload, AlertCircle } from 'lucide-react';
import { db } from '../services/firebase';
import { doc, setDoc, collection, getDocs, getDoc } from 'firebase/firestore';
import './ProductRegistration.css';
import { useNavigate } from 'react-router-dom';
import { useSeller } from '../contexts/SellerContext';
import PageHeader from '../components/PageHeader';

const ProductRegistration = () => {
  const nav = useNavigate();
  const { seller } = useSeller();
  const sellerId = seller?.sellerId;
  const [selectedSegment, setSelectedSegment] = useState('Gold');
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
    specification: 'PLANE',
    specificationMC: '',
    specificationGramRate: ''
  });
  const [productSpecs, setProductSpecs] = useState([]);
  const [loadingSpecs, setLoadingSpecs] = useState(true);
  const [showCategoryAlert, setShowCategoryAlert] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [registeredProducts, setRegisteredProducts] = useState([]);
  
  const purityLimits = {
    Gold: {
      '916 HUID': { min: 91.6, max: 92 },
      '750 HUID': { min: 72, max: 75 },
      '840': { min: 80, max: 88 },
      '650': { min: 60, max: 70 },
      '480': { min: 45, max: 48 }
    },
    Silver: {
      '925': { min: 90, max: 95 },
      '999': { min: 95, max: 100 },
      '800': { min: 75, max: 85 },
      '900': { min: 85, max: 95 }
    },
    Platinum: {
      '950': { min: 90, max: 98 },
      '900': { min: 85, max: 95 },
      '850': { min: 80, max: 90 }
    },
    Diamond: {
      'VS1': { min: 0, max: 100 },
      'VS2': { min: 0, max: 100 },
      'VVS1': { min: 0, max: 100 },
      'VVS2': { min: 0, max: 100 },
      'SI1': { min: 0, max: 100 },
      'SI2': { min: 0, max: 100 }
    },
    Gems: {
      'Emerald': { min: 0, max: 100 },
      'Ruby': { min: 0, max: 100 },
      'Sapphire': { min: 0, max: 100 },
      'Topaz': { min: 0, max: 100 }
    },
    Pearls: {
      'Freshwater': { min: 0, max: 100 },
      'Akoya': { min: 0, max: 100 },
      'Tahitian': { min: 0, max: 100 },
      'South Sea': { min: 0, max: 100 }
    }
  };
  
  const segments = ['Gold', 'Silver', 'Platinum', 'Diamond', 'Gems', 'Pearls'];
  const categoriesBySegment = {
    Gold: ['916 HUID', '750 HUID', '840', '650', '480'],
    Silver: ['925', '999', '800', '900'],
    Platinum: ['950', '900', '850'],
    Diamond: ['VS1', 'VS2', 'VVS1', 'VVS2', 'SI1', 'SI2'],
    Gems: ['Emerald', 'Ruby', 'Sapphire', 'Topaz'],
    Pearls: ['Freshwater', 'Akoya', 'Tahitian', 'South Sea']
  };
  
  const subcategories = [
    'KATAKI', 'RAJKOT', 'BOMBAY', 'COIMBATORE', 'KOLKATA', 'CASTING',
    'MACHINE MADE', 'SOUTH', 'TURKEY', 'CNC', 'ITALIAN', 'SANKHA POLA',
    'NAKASHI', 'DIECE THUKAI', 'ACCESORIES', 'MARWAD'
  ];
  
  const productNames = [
    'MANGTIKA', 'NATH', 'NOSEPIN', 'MANGAL SUTRA', 'CHAINS', 'DOKIA',
    'SHORT NECKLACE', 'LONG NECKLACE', 'CHOKKAR', 'CHEEK', 'PENDENTS',
    'BABY LOCKET', 'GOD LOCKET', 'BAJU BANDH', 'BANGLE', 'SANKHA POLA',
    'BRASLET & KADA', 'LADIES RING', 'GENTS RING', 'BABY RING',
    'KAMAR BANDH', 'PAYAL', 'BICHHIYA', 'ACCESORIES'
  ];
  
  const styleTypes = ['regular', 'highFancy', 'highFinish', 'lightWeight'];
  const specifications = ['PLANE', 'MEENA WORK', 'STONE WORK', 'OTHER WORK'];
  
  const allProducts = useMemo(() => {
    const products = [];
    let id = 1;
    segments.forEach(segment => {
      categoriesBySegment[segment].forEach(category => {
        subcategories.forEach(subcategory => {
          productNames.forEach(name => {
            products.push({
              id: id++,
              name,
              image: `https://placehold.co/60x60/E0E0E0/333333?text=${name[0]}`,
              segment,
              categoryId: category,
              subcategoryId: subcategory,
              styleTypes
            });
          });
        });
      });
    });
    return products;
  }, []);

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

  useEffect(() => {
    if (productDetails.setMC && productDetails.setMC !== '0' && productDetails.setMC !== '') {
      if (productDetails.netGramMC !== '0') {
        setProductDetails(prev => ({ ...prev, netGramMC: '0' }));
      }
    } else if (productDetails.netGramMC && productDetails.netGramMC !== '0' && productDetails.netGramMC !== '') {
      if (productDetails.setMC !== '0') {
        setProductDetails(prev => ({ ...prev, setMC: '0' }));
      }
    }
  }, [productDetails.setMC, productDetails.netGramMC]);

  const [productData, setProductData] = useState(() => {
    const initialProductData = {};
    allProducts.forEach(product => {
      initialProductData[product.id] = {
        selectedStyleType: null,
        regular: {
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
        },
        highFancy: {
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
        },
        highFinish: {
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
        },
        lightWeight: {
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
        }
      };
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
        console.log("Found exact spec match:", exactSpecMatch);
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
      console.log("Found product match:", productMatch);
      return productMatch;
    }
    
    const categorySpecs = productSpecs.find(spec =>
      spec.segment === segment &&
      spec.category === category &&
      spec.productSource === subcategory
    );
    console.log("Found category match or null:", categorySpecs);
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
    const baseWastage = parseFloat(details.wastage) || 0;
    return baseWastage;
  };

  const calculateTotalMakingCharges = (details) => {
    if (details.specification === 'PLANE') {
      const setMC = parseFloat(details.setMC) || 0;
      const netGramMC = parseFloat(details.netGramMC) || 0;
      return setMC + netGramMC;
    } else {
      const specMC = parseFloat(details.specificationMC) || 0;
      const specGramRate = parseFloat(details.specificationGramRate) || 0;
      return specMC + specGramRate;
    }
  };

  const filteredProducts = useMemo(() => {
    if (!selectedSegment || !selectedCategory || !selectedSubcategory) {
      return [];
    }
    return allProducts.filter(
      (product) =>
        product.segment === selectedSegment &&
        product.categoryId === selectedCategory &&
        product.subcategoryId === selectedSubcategory
    );
  }, [selectedSegment, selectedCategory, selectedSubcategory, allProducts]);

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
    const product = allProducts.find(p => p.id === productId);
    if (!isCategoryConfigured(selectedSegment, selectedCategory, selectedSubcategory)) {
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
    if (!isCategoryConfigured(selectedSegment, selectedCategory, selectedSubcategory)) {
      setShowCategoryAlert(true);
      return;
    }
    
    event.stopPropagation();
    const file = event.target.files[0];
    if (!file) return;
    
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
        
        if (currentSelectedStyle !== 'regular') {
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
            setSelectedProducts([...updatedSelectedProducts, {
              productId: productId,
              styleType: currentSelectedStyle,
              productName: allProducts.find(p => p.id === productId)?.name
            }]);
          }
        }
        setProductData(newProductData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCardClick = (productId) => {
    if (!isCategoryConfigured(selectedSegment, selectedCategory, selectedSubcategory)) {
      setShowCategoryAlert(true);
      return;
    }
    
    if (!productData[productId].selectedStyleType) {
      handleStyleSelect(productId, 'regular');
    }
  };

  const getProductFormatKey = (registration) => {
    const segment = registration.segment || 'NO_SEGMENT';
    const category = registration.category || 'NO_CATEGORY';
    const subcategory = registration.subcategory || 'NO_SUBCATEGORY';
    const productSource = registration.productSource || subcategory || 'NO_SOURCE';

    let productName = 'NO_NAME';
    let finishType = 'NO_FINISH_TYPE';
    let specification = 'NO_SPEC';

    const productEntries = Object.entries(registration.products || {});
    if (productEntries.length > 0) {
      const [firstProductName, firstProductDetails] = productEntries[0];
      productName = firstProductName || 'NO_NAME';
      const styleType = firstProductDetails.selectedStyleType || 'regular';
      finishType = getStyleLabel(styleType).replace(/\s+/g, '');
      specification = firstProductDetails.specification || 'NO_SPEC';
    }

    return `${segment}_${category}_${subcategory}_${productSource}_${productName}_${finishType}_${specification}`;
  };

  const handleSendToQC = async () => {
    if (!sellerId) {
      alert('Seller ID not found. Please log in again.');
      return;
    }
    
    if (!isCategoryConfigured(selectedSegment, selectedCategory, selectedSubcategory)) {
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

      // Create the new registration entry
      const newRegistration = {
        registrationId: `${sellerId}_${timestamp}`,
        status: 'pending_approval',
        approved: false,
        requestTimestamp: new Date(),
        products: {}
      };

      // Process each selected product
      selectedProducts.forEach(({ productId, styleType, productName }) => {
        const product = allProducts.find(p => p.id === productId);
        const styleData = productData[productId][styleType];
        
        if (styleData.selected && styleData.details.purity) {
          newRegistration.products[productName] = {
            productId: productId,
            segment: selectedSegment,
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
          };
        }
      });

      if (Object.keys(newRegistration.products).length === 0) {
        alert('No valid products with complete details selected.');
        return;
      }
      
      const newRegistrationKey = getProductFormatKey(newRegistration);

      // Check if document exists first
      const docSnap = await getDoc(docRef);
      let updatedRegistrations = [];

      if (docSnap.exists()) {
        const currentData = docSnap.data();
        const existingRegistrations = currentData.registrations || [];

        // MODIFIED: Find an existing registration with the same format regardless of status
        const existingIndex = existingRegistrations.findIndex(reg =>
          getProductFormatKey(reg) === newRegistrationKey
        );

        if (existingIndex !== -1) {
          // Update the existing registration regardless of status
          console.log("Updating existing registration:", existingRegistrations[existingIndex].registrationId);
          updatedRegistrations = [...existingRegistrations];
          
          updatedRegistrations[existingIndex] = {
            ...updatedRegistrations[existingIndex],
            ...newRegistration,
            registrationId: updatedRegistrations[existingIndex].registrationId,
            requestTimestamp: new Date(),
            status: 'pending_approval'
          };
        } else {
          // No matching registration found, add as new
          console.log("Adding new registration");
          updatedRegistrations = [...existingRegistrations, newRegistration];
        }
      } else {
        // Document doesn't exist, create new one with this registration
        console.log("Creating new document with registration");
        updatedRegistrations = [newRegistration];
      }

      // Save the updated registrations array back to Firestore
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

      console.log('Product registration submitted/updated:', newRegistration);
      alert('Product registration submitted for approval!');
      nav("/QCApprovalPage");

      // Reset form
      setSelectedProducts([]);
    } catch (error) {
      console.error('Error sending data for approval:', error);
      alert('Error submitting product registration. Please try again.');
    }
  };

  const handleSaveProductDetails = () => {
    const currentProduct = allProducts.find(p => p.id === currentProductForDetails);
    const categoryLimits = getCategoryLimits(
      selectedSegment,
      selectedCategory,
      selectedSubcategory,
      currentProduct.name,
      productDetails.specification
    );
    
    const errors = {};
    const segmentPurityLimits = purityLimits[selectedSegment] || {};
    const categoryPurityLimits = segmentPurityLimits[selectedCategory] || { min: 0, max: 100 };
    
    if (parseFloat(productDetails.purity) < categoryPurityLimits.min ||
      parseFloat(productDetails.purity) > categoryPurityLimits.max) {
      errors.purity = `Purity must be between ${categoryPurityLimits.min} and ${categoryPurityLimits.max} for ${selectedSegment} - ${selectedCategory}`;
    }
    
    if (categoryLimits) {
      const totalWastage = calculateTotalWastage(productDetails);
      if (totalWastage > parseFloat(categoryLimits.maxWastageSeller)) {
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
    if (selectedStyle) {
      return productData[productId][selectedStyle].image;
    }
    return productData[productId].regular.image;
  };

  const getCurrentDetails = (productId) => {
    const selectedStyle = productData[productId].selectedStyleType;
    if (selectedStyle) {
      return productData[productId][selectedStyle].details;
    }
    return productData[productId].regular.details;
  };

  const renderProductDetailsPopup = () => {
    if (!showProductDetails) return null;
    
    const currentProduct = allProducts.find(p => p.id === currentProductForDetails);
    const categoryLimits = getCategoryLimits(
      selectedSegment,
      selectedCategory,
      selectedSubcategory,
      currentProduct.name,
      productDetails.specification
    );
    
    const segmentPurityLimits = purityLimits[selectedSegment] || {};
    const categoryPurityLimits = segmentPurityLimits[selectedCategory] || { min: 0, max: 100 };
    const totalWastage = calculateTotalWastage(productDetails);
    const totalMakingCharges = calculateTotalMakingCharges(productDetails);

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

    const handleMCChange = (field, value) => {
      let updatedDetails = { ...productDetails };
      updatedDetails[field] = value;
      
      if (field === 'setMC' && value !== '' && value !== '0') {
        updatedDetails.netGramMC = '0';
      } else if (field === 'netGramMC' && value !== '' && value !== '0') {
        updatedDetails.setMC = '0';
      }
      
      setProductDetails(updatedDetails);
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
                  onChange={(e) => handleMCChange('setMC', e.target.value)}
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
                  onChange={(e) => handleMCChange('netGramMC', e.target.value)}
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
                  {specifications.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
                {validationErrors.specification && <span className="error-message">{validationErrors.specification}</span>}
              </div>
              
              {productDetails.specification !== 'PLANE' ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Specification westage</label>
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
                <span className="total-label">Total Making Charges:</span>
                <span className="total-value">{totalMakingCharges.toFixed(2)}</span>
              </div>
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
            <p>The selected combination "{selectedSegment} / {selectedCategory} / {selectedSubcategory}" is not configured in the system.</p>
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
              {segments.map(segment => (
                <button
                  key={segment}
                  onClick={() => {
                    setSelectedSegment(segment);
                    setSelectedCategory(null);
                    setSelectedSubcategory(null);
                  }}
                  className={`category-button ${selectedSegment === segment ? 'selected' : ''}`}
                >
                  {segment}
                </button>
              ))}
            </div>
          </div>
          
          {selectedSegment && (
            <div className="form-group">
              <label className="form-label">Category</label>
              <div className="horizontal-scroll-container">
                {categoriesBySegment[selectedSegment].map(cat => (
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
                {subcategories.map(sub => (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubcategory(sub)}
                    className={`category-button ${selectedSubcategory === sub ? 'selected' : ''} ${!isCategoryConfigured(selectedSegment, selectedCategory, sub) ? 'not-configured' : ''}`}
                    title={!isCategoryConfigured(selectedSegment, selectedCategory, sub) ? 'Segment/Category/Subcategory not configured - Contact JMI' : ''}
                  >
                    {sub}
                    {!isCategoryConfigured(selectedSegment, selectedCategory, sub) && <AlertCircle size={14} />}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <h3 className="section-title">Select Products</h3>
          
          {selectedSegment && selectedCategory && selectedSubcategory ? (
            !isCategoryConfigured(selectedSegment, selectedCategory, selectedSubcategory) ? (
              <div className="category-warning">
                <AlertCircle size={24} />
                <p>This segment/category/subcategory combination is not configured. Please contact JMI to configure "{selectedSegment} / {selectedCategory} / {selectedSubcategory}" before proceeding.</p>
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
                              <div>Total Wastage: <span className="metric-value">{totalWastage.toFixed(2)}%</span></div>
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
            disabled={selectedProducts.length === 0 || !isCategoryConfigured(selectedSegment, selectedCategory, selectedSubcategory)}
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