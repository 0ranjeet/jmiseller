import React, { useState } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import imagekit from '../services/imgkit'; // Import ImageKit client
import './SellerRegistration.css';

const SellerRegistration = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [formData, setFormData] = useState({
    gstrStatus: 'registered',
    gstinNumber: '',
    businessDocuments: [],
    organizationPhotos: [],
    organizationName: '',
    address: '',
    city: '',
    district: '',
    state: '',
    pinCode: '',
    organizationContact: '',
    organizationEmail: '',
    businessTypes: ['Gold Jewelry', 'Diamond Jewelry'],
    storeLogo: null,
    dealingPersons: [{
      fullName: '',
      contactNumber: '',
      email: '',
      role: '',
      photo: null
    }],
    transactionalMobile: '',
    transactionalEmail: '',
    shopNumber: '',
    buildingName: '',
    streetAddress: '',
    contactCity: '',
    contactDistrict: '',
    contactState: '',
    contactPinCode: '',
    bankName: '',
    ifscCode: '',
    accountType: '',
    accountHolderName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    jmiOfficerID: '',
    privatePasskey: '',
    confirmPasskey: ''
  });

  const steps = [
    { number: 1, title: 'Business', key: 'business' },
    { number: 2, title: 'Person', key: 'person' },
    { number: 3, title: 'Contact', key: 'contact' },
    { number: 4, title: 'Bank', key: 'bank' },
    { number: 5, title: 'Security', key: 'security' }
  ];

  // Upload single file to ImageKit
  const uploadFile = async (file, path) => {
    try {
      const response = await imagekit.upload({
        file: file,
        fileName: `${Date.now()}_${file.name}`,
        folder: `/seller-registration/${path}`,
        useUniqueFileName: true,
      });
      return response.url;
    } catch (error) {
      console.error('Error uploading file to ImageKit:', error);
      throw error;
    }
  };

  // Upload multiple files
  const uploadMultipleFiles = async (files, path) => {
    const uploadPromises = Array.from(files).map(file => uploadFile(file, path));
    return Promise.all(uploadPromises);
  };

  // Save data to Firestore
  const saveToFirestore = async (data) => {
    try {
      const docRef = await addDoc(collection(db, 'seller-registrations'), {
        ...data,
        createdAt: serverTimestamp(),
        status: 'pending',
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error saving to Firestore:', error);
      throw error;
    }
  };

  // Handle file selection
  const handleFileChange = (field, files) => {
    setFormData(prev => ({
      ...prev,
      [field]: Array.from(files)
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCompletedSteps(prev => [...prev, currentStep]);
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const dataToSave = { ...formData };

      // Upload business documents
      if (formData.businessDocuments.length > 0) {
        setUploadProgress(prev => ({ ...prev, businessDocs: 'Uploading business documents...' }));
        dataToSave.businessDocumentUrls = await uploadMultipleFiles(
          formData.businessDocuments,
          'business-documents'
        );
      }

      // Upload organization photos
      if (formData.organizationPhotos.length > 0) {
        setUploadProgress(prev => ({ ...prev, orgPhotos: 'Uploading organization photos...' }));
        dataToSave.organizationPhotoUrls = await uploadMultipleFiles(
          formData.organizationPhotos,
          'organization-photos'
        );
      }

      // Upload dealing person photos
      setUploadProgress(prev => ({ ...prev, personPhotos: 'Uploading person photos...' }));
      dataToSave.dealingPersons = await Promise.all(
        formData.dealingPersons.map(async (person, index) => {
          if (person.photo) {
            const photoUrl = await uploadFile(person.photo, `person-photos/${index}`);
            return { ...person, photoUrl, photo: null };
          }
          return person;
        })
      );

      // Upload store logo
      if (formData.storeLogo) {
        setUploadProgress(prev => ({ ...prev, logo: 'Uploading store logo...' }));
        dataToSave.storeLogoUrl = await uploadFile(formData.storeLogo, 'store-logos');
      }

      // Remove file objects before saving to Firestore
      delete dataToSave.businessDocuments;
      delete dataToSave.organizationPhotos;
      delete dataToSave.storeLogo;

      setUploadProgress(prev => ({ ...prev, saving: 'Saving registration data...' }));

      // Save to Firestore
      const docId = await saveToFirestore(dataToSave);

      setCompletedSteps(prev => [...prev, currentStep]);
      alert(`Registration completed successfully! Your registration ID is: ${docId}`);

      // Reset form
      setCurrentStep(1);
      setCompletedSteps([]);
      setFormData({
        gstrStatus: 'registered',
        gstinNumber: '',
        businessDocuments: [],
        organizationPhotos: [],
        organizationName: '',
        address: '',
        city: '',
        district: '',
        state: '',
        pinCode: '',
        organizationContact: '',
        organizationEmail: '',
        businessTypes: ['Gold Jewelry', 'Diamond Jewelry'],
        storeLogo: null,
        dealingPersons: [{
          fullName: '',
          contactNumber: '',
          email: '',
          role: '',
          photo: null
        }],
        transactionalMobile: '',
        transactionalEmail: '',
        shopNumber: '',
        buildingName: '',
        streetAddress: '',
        contactCity: '',
        contactDistrict: '',
        contactState: '',
        contactPinCode: '',
        bankName: '',
        ifscCode: '',
        accountType: '',
        accountHolderName: '',
        accountNumber: '',
        confirmAccountNumber: '',
        jmiOfficerID: '',
        privatePasskey: '',
        confirmPasskey: ''
      });
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setLoading(false);
      setUploadProgress({});
    }
  };

  const addDealingPerson = () => {
    setFormData(prev => ({
      ...prev,
      dealingPersons: [...prev.dealingPersons, {
        fullName: '',
        contactNumber: '',
        email: '',
        role: '',
        photo: null
      }]
    }));
  };

  const updateDealingPerson = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      dealingPersons: prev.dealingPersons.map((person, i) =>
        i === index ? { ...person, [field]: value } : person
      )
    }));
  };

  const removeDealingPerson = (index) => {
    setFormData(prev => ({
      ...prev,
      dealingPersons: prev.dealingPersons.filter((_, i) => i !== index)
    }));
  };

  const StepIndicator = ({ steps, currentStep, completedSteps }) => (
    <div className="step-indicator">
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          <div className={`step ${currentStep === step.number ? 'active' : ''} ${completedSteps.includes(step.number) ? 'completed' : ''}`}>
            <div className="step-circle">
              {completedSteps.includes(step.number) ? '✓' : step.number}
            </div>
            <span className="step-title">{step.title}</span>
          </div>
          {index < steps.length - 1 && <div className="step-connector"></div>}
        </React.Fragment>
      ))}
    </div>
  );

  const BusinessStep = () => (
    <div className="step-content">
      <h2>Organisation Information</h2>
      
      <div className="form-group">
        <label>GSTR Status</label>
        <div className="radio-group">
          <label className={`radio-option ${formData.gstrStatus === 'registered' ? 'active' : ''}`}>
            <input
              type="radio"
              value="registered"
              checked={formData.gstrStatus === 'registered'}
              onChange={(e) => handleInputChange('gstrStatus', e.target.value)}
            />
            Registered
          </label>
          <label className={`radio-option ${formData.gstrStatus === 'non-registered' ? 'active' : ''}`}>
            <input
              type="radio"
              value="non-registered"
              checked={formData.gstrStatus === 'non-registered'}
              onChange={(e) => handleInputChange('gstrStatus', e.target.value)}
            />
            Non-Registered
          </label>
        </div>
      </div>

      <div className="form-group">
        <label>GSTIN Number</label>
        <input
          type="text"
          placeholder="e.g. 22AAAAA0000A1Z5"
          value={formData.gstinNumber}
          onChange={(e) => handleInputChange('gstinNumber', e.target.value)}
        />
        <small>Format: 22AAAAA0000A1Z5</small>
      </div>

      <div className="form-group">
        <label>Business Documents</label>
        <div className="upload-area">
          <div className="upload-icon">📄</div>
          <p>Upload PDF, JPG or PNG files</p>
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => handleFileChange('businessDocuments', e.target.files)}
            style={{ display: 'none' }}
            id="business-docs"
          />
          <label htmlFor="business-docs" className="btn-secondary">Select Files</label>
        </div>
        {formData.businessDocuments.length > 0 && (
          <div className="uploaded-files">
            {formData.businessDocuments.map((file, index) => (
              <div key={index} className="file-item">
                <span>📄 {file.name}</span>
                <button 
                  type="button"
                  className="remove-file"
                  onClick={() => {
                    const newFiles = [...formData.businessDocuments];
                    newFiles.splice(index, 1);
                    handleInputChange('businessDocuments', newFiles);
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="form-group">
        <label>Organization Photos</label>
        <div className="upload-area">
          <div className="upload-icon">📷</div>
          <p>Upload store photos</p>
          <input
            type="file"
            multiple
            accept=".jpg,.jpeg,.png"
            onChange={(e) => handleFileChange('organizationPhotos', e.target.files)}
            style={{ display: 'none' }}
            id="org-photos"
          />
          <label htmlFor="org-photos" className="btn-secondary">Add Photos</label>
        </div>
        {formData.organizationPhotos.length > 0 && (
          <div className="photo-grid">
            {formData.organizationPhotos.map((file, index) => (
              <div key={index} className="photo-item">
                <img 
                  src={URL.createObjectURL(file)} 
                  alt={`Store ${index + 1}`} 
                  style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                />
                <button 
                  type="button"
                  className="remove-photo"
                  onClick={() => {
                    const newPhotos = [...formData.organizationPhotos];
                    newPhotos.splice(index, 1);
                    handleInputChange('organizationPhotos', newPhotos);
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="form-group">
        <label>Organization Name</label>
        <input
          type="text"
          placeholder="Enter business name"
          value={formData.organizationName}
          onChange={(e) => handleInputChange('organizationName', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Address</label>
        <input
          type="text"
          placeholder="Street/Building"
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>City/Village</label>
          <input
            type="text"
            placeholder="City/Village"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>District</label>
          <input
            type="text"
            placeholder="District"
            value={formData.district}
            onChange={(e) => handleInputChange('district', e.target.value)}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>State</label>
          <select
            value={formData.state}
            onChange={(e) => handleInputChange('state', e.target.value)}
          >
            <option value="">Select State</option>
            <option value="andhra-pradesh">Andhra Pradesh</option>
            <option value="arunachal-pradesh">Arunachal Pradesh</option>
            <option value="assam">Assam</option>
            <option value="bihar">Bihar</option>
            <option value="chhattisgarh">Chhattisgarh</option>
            <option value="goa">Goa</option>
            <option value="gujarat">Gujarat</option>
            <option value="haryana">Haryana</option>
            <option value="himachal-pradesh">Himachal Pradesh</option>
            <option value="jharkhand">Jharkhand</option>
            <option value="karnataka">Karnataka</option>
            <option value="kerala">Kerala</option>
            <option value="madhya-pradesh">Madhya Pradesh</option>
            <option value="maharashtra">Maharashtra</option>
            <option value="manipur">Manipur</option>
            <option value="meghalaya">Meghalaya</option>
            <option value="mizoram">Mizoram</option>
            <option value="nagaland">Nagaland</option>
            <option value="odisha">Odisha</option>
            <option value="punjab">Punjab</option>
            <option value="rajasthan">Rajasthan</option>
            <option value="sikkim">Sikkim</option>
            <option value="tamil-nadu">Tamil Nadu</option>
            <option value="telangana">Telangana</option>
            <option value="tripura">Tripura</option>
            <option value="uttar-pradesh">Uttar Pradesh</option>
            <option value="uttarakhand">Uttarakhand</option>
            <option value="west-bengal">West Bengal</option>
          </select>
        </div>
        <div className="form-group">
          <label>PIN Code</label>
          <input
            type="text"
            placeholder="PIN Code"
            value={formData.pinCode}
            onChange={(e) => handleInputChange('pinCode', e.target.value)}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Organization Contact</label>
        <input
          type="tel"
          placeholder="10-digit mobile number"
          value={formData.organizationContact}
          onChange={(e) => handleInputChange('organizationContact', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Organization Email</label>
        <input
          type="email"
          placeholder="business@example.com"
          value={formData.organizationEmail}
          onChange={(e) => handleInputChange('organizationEmail', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Nature of Business</label>
        <div className="business-types">
          {formData.businessTypes.map((type, index) => (
            <span key={index} className="business-tag">
              {type}
              <span 
                className="remove"
                onClick={() => {
                  const newTypes = formData.businessTypes.filter((_, i) => i !== index);
                  handleInputChange('businessTypes', newTypes);
                }}
              >
                ×
              </span>
            </span>
          ))}
        </div>
        <input
          type="text"
          placeholder="Add more business types"
          onKeyPress={(e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
              handleInputChange('businessTypes', [...formData.businessTypes, e.target.value.trim()]);
              e.target.value = '';
            }
          }}
        />
      </div>

      <div className="form-group">
        <label>Store Logo (Optional)</label>
        <div className="upload-area">
          <div className="upload-icon">🖼️</div>
          <p>Upload your store logo</p>
          <input
            type="file"
            accept=".jpg,.jpeg,.png"
            onChange={(e) => handleInputChange('storeLogo', e.target.files[0])}
            style={{ display: 'none' }}
            id="store-logo"
          />
          <label htmlFor="store-logo" className="btn-secondary">Upload Logo</label>
        </div>
        {formData.storeLogo && (
          <div className="logo-preview">
            <img 
              src={URL.createObjectURL(formData.storeLogo)} 
              alt="Store Logo" 
              style={{ width: '100px', height: '100px', objectFit: 'cover' }}
            />
            <button 
              type="button"
              onClick={() => handleInputChange('storeLogo', null)}
              className="remove-logo"
            >
              Remove
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const PersonStep = () => (
    <div className="step-content">
      <h2>Dealing Person Details</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
        Add contact details for the person(s) who will be handling business communication or transactions.
      </p>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        You can add more than one contact person for your business.
      </p>

      {formData.dealingPersons.map((person, index) => (
        <div key={index} className="person-card">
          <div className="person-header">
            <h3>Person {index + 1}</h3>
            <div className="person-actions">
              {formData.dealingPersons.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDealingPerson(index)}
                  className="remove-person"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Enter full name"
              value={person.fullName}
              onChange={(e) => updateDealingPerson(index, 'fullName', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Contact Number</label>
            <input
              type="tel"
              placeholder="10-digit mobile number"
              value={person.contactNumber}
              onChange={(e) => updateDealingPerson(index, 'contactNumber', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="person@example.com"
              value={person.email}
              onChange={(e) => updateDealingPerson(index, 'email', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Designation/Role</label>
            <select
              value={person.role}
              onChange={(e) => updateDealingPerson(index, 'role', e.target.value)}
            >
              <option value="">Select role</option>
              <option value="owner">Owner</option>
              <option value="manager">Manager</option>
              <option value="sales-executive">Sales Executive</option>
              <option value="accountant">Accountant</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Person Photos</label>
            <div className="upload-area">
              <div className="upload-icon">📷</div>
              <p>Upload JPG or PNG files</p>
              <input
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={(e) => updateDealingPerson(index, 'photo', e.target.files[0])}
                style={{ display: 'none' }}
                id={`person-photo-${index}`}
              />
              <label htmlFor={`person-photo-${index}`} className="btn-secondary">Take Photo</label>
            </div>
            {person.photo && (
              <div className="photo-preview">
                <img 
                  src={URL.createObjectURL(person.photo)} 
                  alt="Person" 
                  style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                />
                <button 
                  type="button"
                  onClick={() => updateDealingPerson(index, 'photo', null)}
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addDealingPerson}
        className="add-person-btn"
      >
        + Add Dealing Person
      </button>
    </div>
  );

  const ContactStep = () => (
    <div className="step-content">
      <h2>Transactional Contact</h2>

      <div className="form-group">
        <label>Mobile</label>
        <input
          type="tel"
          placeholder="10-digit mobile number"
          value={formData.transactionalMobile}
          onChange={(e) => handleInputChange('transactionalMobile', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Email</label>
        <input
          type="email"
          placeholder="business@example.com"
          value={formData.transactionalEmail}
          onChange={(e) => handleInputChange('transactionalEmail', e.target.value)}
        />
      </div>

      <h2 style={{ marginTop: '40px' }}>Shipping Address</h2>

      <div className="form-group">
        <label>Shop Number / Flat Number</label>
        <input
          type="text"
          placeholder="Shop/Flat Number"
          value={formData.shopNumber}
          onChange={(e) => handleInputChange('shopNumber', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Building / Complex Name</label>
        <input
          type="text"
          placeholder="Building or Complex"
          value={formData.buildingName}
          onChange={(e) => handleInputChange('buildingName', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Street Address</label>
        <input
          type="text"
          placeholder="Street Address"
          value={formData.streetAddress}
          onChange={(e) => handleInputChange('streetAddress', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>City / Village</label>
        <input
          type="text"
          placeholder="City or Village"
          value={formData.contactCity}
          onChange={(e) => handleInputChange('contactCity', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>District</label>
        <input
          type="text"
          placeholder="District"
          value={formData.contactDistrict}
          onChange={(e) => handleInputChange('contactDistrict', e.target.value)}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>State</label>
          <select
            value={formData.contactState}
            onChange={(e) => handleInputChange('contactState', e.target.value)}
          >
            <option value="">Select State</option>
            <option value="andhra-pradesh">Andhra Pradesh</option>
            <option value="arunachal-pradesh">Arunachal Pradesh</option>
            <option value="assam">Assam</option>
            <option value="bihar">Bihar</option>
            <option value="chhattisgarh">Chhattisgarh</option>
            <option value="goa">Goa</option>
            <option value="gujarat">Gujarat</option>
            <option value="haryana">Haryana</option>
            <option value="himachal-pradesh">Himachal Pradesh</option>
            <option value="jharkhand">Jharkhand</option>
            <option value="karnataka">Karnataka</option>
            <option value="kerala">Kerala</option>
            <option value="madhya-pradesh">Madhya Pradesh</option>
            <option value="maharashtra">Maharashtra</option>
            <option value="manipur">Manipur</option>
            <option value="meghalaya">Meghalaya</option>
            <option value="mizoram">Mizoram</option>
            <option value="nagaland">Nagaland</option>
            <option value="odisha">Odisha</option>
            <option value="punjab">Punjab</option>
            <option value="rajasthan">Rajasthan</option>
            <option value="sikkim">Sikkim</option>
            <option value="tamil-nadu">Tamil Nadu</option>
            <option value="telangana">Telangana</option>
            <option value="tripura">Tripura</option>
            <option value="uttar-pradesh">Uttar Pradesh</option>
            <option value="uttarakhand">Uttarakhand</option>
            <option value="west-bengal">West Bengal</option>
          </select>
        </div>
        <div className="form-group">
          <label>PIN Code</label>
          <input
            type="text"
            placeholder="PIN Code"
            value={formData.contactPinCode}
            onChange={(e) => handleInputChange('contactPinCode', e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const BankStep = () => (
    <div className="step-content">
      <h2>Organization Bank Details</h2>

      <div className="form-group">
        <label className="required">Bank Name</label>
        <select
          value={formData.bankName}
          onChange={(e) => handleInputChange('bankName', e.target.value)}
        >
          <option value="">Enter bank name</option>
          <option value="sbi">State Bank of India</option>
          <option value="hdfc">HDFC Bank</option>
          <option value="icici">ICICI Bank</option>
          <option value="axis">Axis Bank</option>
          <option value="kotak">Kotak Mahindra Bank</option>
          <option value="pnb">Punjab National Bank</option>
          <option value="canara">Canara Bank</option>
          <option value="union">Union Bank of India</option>
          <option value="bob">Bank of Baroda</option>
          <option value="indian">Indian Bank</option>
        </select>
      </div>

      <div className="form-group">
        <label className="required">IFSC Code</label>
        <input
          type="text"
          placeholder="e.g. SBIN0001234"
          value={formData.ifscCode}
          onChange={(e) => handleInputChange('ifscCode', e.target.value.toUpperCase())}
        />
        <small>Format: 4 letters followed by 7 numbers</small>
      </div>

      <div className="form-group">
        <label className="required">Account Type</label>
        <select
          value={formData.accountType}
          onChange={(e) => handleInputChange('accountType', e.target.value)}
        >
          <option value="">Select account type</option>
          <option value="savings">Savings Account</option>
          <option value="current">Current Account</option>
          <option value="cc">Cash Credit</option>
          <option value="od">Overdraft</option>
        </select>
      </div>

      <div className="form-group">
        <label className="required">Account Holder Name</label>
        <input
          type="text"
          placeholder="Account holder name"
          value={formData.accountHolderName}
          onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="required">Account Number</label>
        <input
          type="text"
          placeholder="Account number"
          value={formData.accountNumber}
          onChange={(e) => handleInputChange('accountNumber', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="required">Confirm Account Number</label>
        <input
          type="text"
          placeholder="Re-enter account number"
          value={formData.confirmAccountNumber}
          onChange={(e) => handleInputChange('confirmAccountNumber', e.target.value)}
        />
      </div>
    </div>
  );

  const SecurityStep = () => (
    <div className="step-content">
      <div className="security-section">
        <h3>Enter Officer ID</h3>
        <div className="otp-section">
          <div className="form-group">
            <label>JMI Officer ID</label>
            <input
              type="text"
              placeholder="Enter ID"
              value={formData.jmiOfficerID}
              onChange={(e) => handleInputChange('jmiOfficerID', e.target.value)}
            />
          </div>
          <button type="button" className="send-otp-btn">
            Send OTP
          </button>
        </div>
      </div>

      <div className="security-section">
        <h3>Set Private Passkey</h3>
        <div className="form-group">
          <label>Private Passkey</label>
          <input
            type="password"
            placeholder="Create a Passkey"
            value={formData.privatePasskey}
            onChange={(e) => handleInputChange('privatePasskey', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Re-enter Private Passkey</label>
          <input
            type="password"
            placeholder="Re-enter a Passkey"
            value={formData.confirmPasskey}
            onChange={(e) => handleInputChange('confirmPasskey', e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <BusinessStep />;
      case 2:
        return <PersonStep />;
      case 3:
        return <ContactStep />;
      case 4:
        return <BankStep />;
      case 5:
        return <SecurityStep />;
      default:
        return <BusinessStep />;
    }
  };

  return (
    <div className="seller-registration">
      <div className="registration-header">
        <h1>Seller Registration</h1>
        <StepIndicator steps={steps} currentStep={currentStep} completedSteps={completedSteps} />
      </div>
      
      <div className="registration-content">
        {renderStepContent()}
        
        <div className="step-navigation">
          <button 
            type="button" 
            onClick={handlePrevious} 
            className="btn-outline"
            disabled={currentStep === 1}
          >
            Previous
          </button>
          {currentStep === 5 ? (
            <button 
              type="button" 
              onClick={handleRegister} 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          ) : (
            <button 
              type="button" 
              onClick={handleNext} 
              className="btn-primary"
            >
              Next
            </button>
          )}
        </div>

        {loading && (
          <div className="upload-progress">
            <h3>Processing Registration...</h3>
            {Object.entries(uploadProgress).map(([key, message]) => (
              <div key={key} className="progress-item">
                <span className="progress-icon">⏳</span>
                <span>{message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerRegistration;