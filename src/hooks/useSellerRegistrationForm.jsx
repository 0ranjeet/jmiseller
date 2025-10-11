import { useState, useCallback } from 'react';
import { db } from '../services/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = 'jmiseller';

export const useSellerRegistrationForm = (buyerId, nav) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState({});

  // --- Organization ---
  const [gstrStatus, setGstrStatus] = useState('registered');
  const [gstinNumber, setGstinNumber] = useState('');
  const [businessDocuments, setBusinessDocuments] = useState([]);
  const [organizationPhotos, setOrganizationPhotos] = useState([]);
  const [organizationName, setOrganizationName] = useState('');
  const [organizationContact, setOrganizationContact] = useState('');
  const [organizationEmail, setOrganizationEmail] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [storeLogo, setStoreLogo] = useState(null);

  // --- Dealing Persons ---
  const [dealingPersons, setDealingPersons] = useState([{ fullName: '', contactNumber: '', email: '', department: '', role: '', photo: null }]);

  // --- Contact ---
  const [transactionalMobile, setTransactionalMobile] = useState('');
  const [transactionalEmail, setTransactionalEmail] = useState('');
  const [shopNumber, setShopNumber] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [contactCity, setContactCity] = useState('');
  const [contactDistrict, setContactDistrict] = useState('');
  const [contactState, setContactState] = useState('');
  const [contactPinCode, setContactPinCode] = useState('');
  const [shippingLatitude, setShippingLatitude] = useState(null);
  const [shippingLongitude, setShippingLongitude] = useState(null);

  // --- Bank ---
  const [bankName, setBankName] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountType, setAccountType] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');

  // --- Security ---
  const [jmiOfficerID, setJmiOfficerID] = useState('');
  const [privatePasskey, setPrivatePasskey] = useState(['', '', '', '', '', '']);
  const [confirmPasskey, setConfirmPasskey] = useState(['', '', '', '', '', '']);

  // --- Validation ---
  const validateStep = useCallback((stepNumber) => {
    const newErrors = {};
    switch (stepNumber) {
      case 1:
        if (!gstrStatus) newErrors.gstrStatus = 'GSTR Status is required.';
        if (!gstinNumber.trim()) newErrors.gstinNumber = `${gstrStatus === 'non-registered' ? 'Pan Number' : 'GSTIN Number'} is required.`;
        if (businessDocuments.length === 0) newErrors.businessDocuments = 'At least one business document is required.';
        if (organizationPhotos.length === 0) newErrors.organizationPhotos = 'At least one organization photo is required.';
        if (!organizationName.trim()) newErrors.organizationName = 'Organization Name is required.';
        if (!organizationContact.trim()) newErrors.organizationContact = 'Organization Contact is required.';
        if (!organizationEmail.trim()) newErrors.organizationEmail = 'Organization Email is required.';
        if (!businessType) newErrors.businessType = 'Business Type is required.';
        if (!teamSize || parseInt(teamSize) <= 0) newErrors.teamSize = 'Team Size must be a positive number.';
        break;
      case 2:
        dealingPersons.forEach((p, i) => {
          if (!p.fullName.trim()) newErrors[`dealingPerson_${i}_fullName`] = 'Full Name is required.';
          if (!p.contactNumber.trim()) newErrors[`dealingPerson_${i}_contactNumber`] = 'Contact Number is required.';
          if (!p.email.trim()) newErrors[`dealingPerson_${i}_email`] = 'Email is required.';
          if (!p.department.trim()) newErrors[`dealingPerson_${i}_department`] = 'Department is required.';
          if (!p.role) newErrors[`dealingPerson_${i}_role`] = 'Role is required.';
          if (!p.photo) newErrors[`dealingPerson_${i}_photo`] = 'Photo is required.';
        });
        break;
      case 3:
        if (!transactionalMobile.trim()) newErrors.transactionalMobile = 'Mobile is required.';
        if (!transactionalEmail.trim()) newErrors.transactionalEmail = 'Email is required.';
        if (!shopNumber.trim()) newErrors.shopNumber = 'Shop Number is required.';
        if (!buildingName.trim()) newErrors.buildingName = 'Building Name is required.';
        if (!streetAddress.trim()) newErrors.streetAddress = 'Street Address is required.';
        if (!contactCity.trim()) newErrors.contactCity = 'City is required.';
        if (!contactDistrict.trim()) newErrors.contactDistrict = 'District is required.';
        if (!contactState) newErrors.contactState = 'State is required.';
        if (!contactPinCode.trim()) newErrors.contactPinCode = 'PIN Code is required.';
        break;
      case 4:
        if (!bankName) newErrors.bankName = 'Bank Name is required.';
        if (!ifscCode.trim()) newErrors.ifscCode = 'IFSC Code is required.';
        if (!accountType) newErrors.accountType = 'Account Type is required.';
        if (!accountHolderName.trim()) newErrors.accountHolderName = 'Account Holder Name is required.';
        if (!accountNumber.trim()) newErrors.accountNumber = 'Account Number is required.';
        if (!confirmAccountNumber.trim()) newErrors.confirmAccountNumber = 'Confirm Account Number is required.';
        if (accountNumber !== confirmAccountNumber) newErrors.accountNumbersMatch = 'Account numbers do not match.';
        break;
      case 5:
        if (!jmiOfficerID.trim()) newErrors.jmiOfficerID = 'JMI Officer ID is required.';
        const fullPrivatePasskey = privatePasskey.join('');
        const fullConfirmPasskey = confirmPasskey.join('');
        if (fullPrivatePasskey.length !== 6) newErrors.privatePasskey = 'Private Passkey must be exactly 6 digits.';
        if (fullConfirmPasskey.length !== 6) newErrors.confirmPasskey = 'Re-enter Passkey must be exactly 6 digits.';

        if (fullPrivatePasskey !== fullConfirmPasskey) {
          newErrors.passkeysMatch = 'Passkeys do not match.';
        }
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [
    gstrStatus, gstinNumber, businessDocuments, organizationPhotos, organizationName, 
    organizationContact, organizationEmail, businessType, teamSize,
    dealingPersons,
    transactionalMobile, transactionalEmail, shopNumber, buildingName, streetAddress,
    contactCity, contactDistrict, contactState, contactPinCode,
    bankName, ifscCode, accountType, accountHolderName, accountNumber, confirmAccountNumber,
    jmiOfficerID, privatePasskey, confirmPasskey
  ]);

  // --- Upload ---
  const uploadToCloudinary = useCallback(async (file, folder = '') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    if (folder) formData.append('folder', `seller-registration/${folder}`);
    const timestamp = Date.now();
    const safeName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    formData.append('public_id', safeName);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
    const data = await res.json();
    return { url: data.secure_url, publicId: data.public_id };
  }, []);

  const uploadMultipleFiles = useCallback(async (files, folder) => {
    return Promise.all(Array.from(files).map(f => uploadToCloudinary(f, folder)));
  }, [uploadToCloudinary]);

  // --- Save ---
  const saveToFirestore = useCallback(async (data) => {
    const docRef = doc(db, 'sellerregistrations', buyerId);
    await setDoc(docRef, { ...data, buyerId, updatedAt: serverTimestamp() }, { merge: true });

    const profileRef = doc(db, 'profile', buyerId);
    await setDoc(profileRef, { SellerRegistration: true }, { merge: true });
  }, [buyerId]);

  // --- Navigation ---
  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
      setCurrentStep(p => p + 1);
      setErrors({});
    } else {
      alert('Please fill all required fields correctly.');
    }
  }, [currentStep, validateStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) setCurrentStep(p => p - 1);
  }, [currentStep]);

  // --- Submit ---
  const handleRegister = useCallback(async () => {
    if (!validateStep(5)) {
      alert('Please fill all required fields correctly.');
      return;
    }
    setLoading(true);
    setUploadProgress({});

    try {
      let data = {
        gstrStatus, gstinNumber, organizationName,
        organizationContact, organizationEmail, businessType, teamSize,
        dealingPersons, transactionalMobile, transactionalEmail, shopNumber, buildingName,
        streetAddress, contactCity, contactDistrict, contactState, contactPinCode,
        shippingLatitude, shippingLongitude,
        bankName, ifscCode, accountType, accountHolderName, accountNumber, confirmAccountNumber,
        jmiOfficerID, privatePasskey, confirmPasskey
      };

      if (businessDocuments.length > 0) {
        setUploadProgress(p => ({ ...p, businessDocs: 'Uploading business docs...' }));
        const docs = await uploadMultipleFiles(businessDocuments, 'business-documents');
        data.businessDocumentUrls = docs.map(d => d.url);
        data.businessDocumentIds = docs.map(d => d.publicId);
      }

      if (organizationPhotos.length > 0) {
        setUploadProgress(p => ({ ...p, orgPhotos: 'Uploading photos...' }));
        const photos = await uploadMultipleFiles(organizationPhotos, 'organization-photos');
        data.organizationPhotoUrls = photos.map(p => p.url);
        data.organizationPhotoIds = photos.map(p => p.publicId);
      }

      setUploadProgress(p => ({ ...p, personPhotos: 'Uploading person photos...' }));
      data.dealingPersons = await Promise.all(
        dealingPersons.map(async (p) => {
          if (p.photo) {
            const res = await uploadToCloudinary(p.photo, 'person-photos');
            return { ...p, photoUrl: res.url, photoId: res.publicId, photo: null };
          }
          return p;
        })
      );

      if (storeLogo) {
        setUploadProgress(p => ({ ...p, logo: 'Uploading logo...' }));
        const logoRes = await uploadToCloudinary(storeLogo, 'store-logos');
        data.storeLogoUrl = logoRes.url;
        data.storeLogoId = logoRes.publicId;
      }

      setUploadProgress(p => ({ ...p, saving: 'Saving data...' }));
      await saveToFirestore(data);
      nav('/segmentregistration');
    } catch (err) {
      console.error('Registration failed:', err);
      alert('Registration failed. Please try again.');
    } finally {
      setLoading(false);
      setUploadProgress({});
    }
  }, [
    buyerId, nav, validateStep, uploadToCloudinary, uploadMultipleFiles, saveToFirestore,
    // All form values (same as in validateStep dependencies)
    gstrStatus, gstinNumber, organizationName,
    organizationContact, organizationEmail, businessType, teamSize, storeLogo,
    dealingPersons, transactionalMobile, transactionalEmail, shopNumber, buildingName,
    streetAddress, contactCity, contactDistrict, contactState, contactPinCode,
    shippingLatitude, shippingLongitude,
    bankName, ifscCode, accountType, accountHolderName, accountNumber, confirmAccountNumber,
    jmiOfficerID, privatePasskey, confirmPasskey,
    businessDocuments, organizationPhotos
  ]);

  // --- Helpers ---
  const addDealingPerson = useCallback(() =>
    setDealingPersons(p => [...p, { fullName: '', contactNumber: '', email: '', department: '', role: '', photo: null }]),
    []
  );

  const updateDealingPerson = useCallback((index, field, value) => {
    setDealingPersons(p => p.map((person, i) => i === index ? { ...person, [field]: value } : person));
    if (errors[`dealingPerson_${index}_${field}`]) {
      setErrors(prev => {
        const e = { ...prev };
        delete e[`dealingPerson_${index}_${field}`];
        return e;
      });
    }
  }, [errors]);

  const removeDealingPerson = useCallback((index) => {
    setDealingPersons(p => p.filter((_, i) => i !== index));
    setErrors(prev => {
      const e = { ...prev };
      Object.keys(e).forEach(k => {
        if (k.startsWith(`dealingPerson_${index}_`)) delete e[k];
      });
      return e;
    });
  }, []);

  const removeBusinessDocument = useCallback((i) => {
    setBusinessDocuments(p => p.filter((_, idx) => idx !== i));
  }, []);

  const removeOrganizationPhoto = useCallback((i) => {
    setOrganizationPhotos(p => p.filter((_, idx) => idx !== i));
  }, []);

  return {
    // State
    currentStep,
    completedSteps,
    loading,
    uploadProgress,
    errors,
    shippingLatitude,
    shippingLongitude,
    // Setters
    setShippingLatitude,
    setShippingLongitude,
    // Form values (for steps)
    gstrStatus, setGstrStatus, gstinNumber, setGstinNumber,
    businessDocuments, setBusinessDocuments, organizationPhotos, setOrganizationPhotos,
    organizationName, setOrganizationName,
    organizationContact, setOrganizationContact, organizationEmail, setOrganizationEmail,
    businessType, setBusinessType, teamSize, setTeamSize, storeLogo, setStoreLogo,
    dealingPersons, setDealingPersons,
    transactionalMobile, setTransactionalMobile, transactionalEmail, setTransactionalEmail,
    shopNumber, setShopNumber, buildingName, setBuildingName, streetAddress, setStreetAddress,
    contactCity, setContactCity, contactDistrict, setContactDistrict,
    contactState, setContactState, contactPinCode, setContactPinCode,
    bankName, setBankName, ifscCode, setIfscCode, accountType, setAccountType,
    accountHolderName, setAccountHolderName, accountNumber, setAccountNumber,
    confirmAccountNumber, setConfirmAccountNumber,
    jmiOfficerID, setJmiOfficerID, privatePasskey, setPrivatePasskey,
    confirmPasskey, setConfirmPasskey,
    // Handlers
    handleNext,
    handlePrevious,
    handleRegister,
    addDealingPerson,
    updateDealingPerson,
    removeDealingPerson,
    removeBusinessDocument,
    removeOrganizationPhoto
  };
};
export default useSellerRegistrationForm;