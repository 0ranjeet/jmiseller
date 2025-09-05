import React, { useState, useCallback, memo,  useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import "./SellerRegistration.css";
import { useNavigate } from 'react-router-dom';
import { useSeller } from '../contexts/SellerContext'; // Import useSeller

const BusinessStep = memo(({ gstrStatus, setGstrStatus, gstinNumber, setGstinNumber, businessDocuments, setBusinessDocuments, organizationPhotos, setOrganizationPhotos, organizationName, setOrganizationName, address, setAddress, city, setCity, district, setDistrict, state, setState, pinCode, setPinCode, organizationContact, setOrganizationContact, organizationEmail, setOrganizationEmail, businessTypes, setBusinessTypes, storeLogo, setStoreLogo, removeBusinessType, removeBusinessDocument, removeOrganizationPhoto, handleBusinessTypeKeyPress }) => (
  <div className="step-content">
    <h2>Organisation Information</h2>
    <div className="form-group">
      <label>GSTR Status</label>
      <div className="radio-group">
        <label className={`radio-option ${gstrStatus === 'registered' ? 'active' : ''}`}>
          <input
            type="radio"
            value="registered"
            checked={gstrStatus === 'registered'}
            onChange={(e) => setGstrStatus(e.target.value)}
          />
          Registered
        </label>
        <label className={`radio-option ${gstrStatus === 'non-registered' ? 'active' : ''}`}>
          <input
            type="radio"
            value="non-registered"
            checked={gstrStatus === 'non-registered'}
            onChange={(e) => setGstrStatus(e.target.value)}
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
        value={gstinNumber}
        onChange={(e) => setGstinNumber(e.target.value)}
        autoComplete="off"
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
          onChange={(e) => setBusinessDocuments(Array.from(e.target.files))}
          style={{ display: 'none' }}
          id="business-docs"
        />
        <label htmlFor="business-docs" className="btn-secondary">Select Files</label>
      </div>
      {businessDocuments.length > 0 && (
        <div className="uploaded-files">
          {businessDocuments.map((file, index) => (
            <div key={file.name + index} className="file-item">
              <span>📄 {file.name}</span>
              <button
                type="button"
                className="remove-file"
                onClick={() => removeBusinessDocument(index)}
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
          onChange={(e) => setOrganizationPhotos(Array.from(e.target.files))}
          style={{ display: 'none' }}
          id="org-photos"
        />
        <label htmlFor="org-photos" className="btn-secondary">Add Photos</label>
      </div>
      {organizationPhotos.length > 0 && (
        <div className="photo-grid">
          {organizationPhotos.map((file, index) => (
            <div key={file.name + index} className="photo-item">
              <img
                src={URL.createObjectURL(file)}
                alt={`Store ${index + 1}`}
                style={{ width: '100px', height: '100px', objectFit: 'cover' }}
              />
              <button
                type="button"
                className="remove-photo"
                onClick={() => removeOrganizationPhoto(index)}
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
        value={organizationName}
        onChange={(e) => setOrganizationName(e.target.value)}
        autoComplete="organization"
      />
    </div>
    <div className="form-group">
      <label>Address</label>
      <input
        type="text"
        placeholder="Street/Building"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        autoComplete="street-address"
      />
    </div>
    <div className="form-row">
      <div className="form-group">
        <label>City/Village</label>
        <input
          type="text"
          placeholder="City/Village"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          autoComplete="address-level2"
        />
      </div>
      <div className="form-group">
        <label>District</label>
        <input
          type="text"
          placeholder="District"
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          autoComplete="off"
        />
      </div>
    </div>
    <div className="form-row">
      <div className="form-group">
        <label>State</label>
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
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
          value={pinCode}
          onChange={(e) => setPinCode(e.target.value)}
          autoComplete="postal-code"
        />
      </div>
    </div>
    <div className="form-group">
      <label>Organization Contact</label>
      <input
        type="tel"
        placeholder="10-digit mobile number"
        value={organizationContact}
        onChange={(e) => setOrganizationContact(e.target.value)}
        autoComplete="tel"
      />
    </div>
    <div className="form-group">
      <label>Organization Email</label>
      <input
        type="email"
        placeholder="business@example.com"
        value={organizationEmail}
        onChange={(e) => setOrganizationEmail(e.target.value)}
        autoComplete="email"
      />
    </div>
    <div className="form-group">
      <label>Nature of Business</label>
      <div className="business-types">
        {businessTypes.map((type, index) => (
          <span key={type + index} className="business-tag">
            {type}
            <span
              className="remove"
              onClick={() => removeBusinessType(index)}
            >
              ×
            </span>
          </span>
        ))}
      </div>
      <input
        type="text"
        placeholder="Add more business types"
        onKeyPress={handleBusinessTypeKeyPress}
        autoComplete="off"
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
          onChange={(e) => setStoreLogo(e.target.files[0])}
          style={{ display: 'none' }}
          id="store-logo"
        />
        <label htmlFor="store-logo" className="btn-secondary">Upload Logo</label>
      </div>
      {storeLogo && (
        <div className="logo-preview">
          <img
            src={URL.createObjectURL(storeLogo)}
            alt="Store Logo"
            style={{ width: '100px', height: '100px', objectFit: 'cover' }}
          />
          <button
            type="button"
            onClick={() => setStoreLogo(null)}
            className="remove-logo"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  </div>
));

const PersonStep = memo(({ dealingPersons, setDealingPersons, addDealingPerson, updateDealingPerson, removeDealingPerson }) => (
  <div className="step-content">
    <h2>Dealing Person Details</h2>
    <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
      Add contact details for the person(s) who will be handling business communication or transactions.
    </p>
    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
      You can add more than one contact person for your business.
    </p>
    {dealingPersons.map((person, index) => (
      <div key={index} className="person-card">
        <div className="person-header">
          <h3>Person {index + 1}</h3>
          <div className="person-actions">
            {dealingPersons.length > 1 && (
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
            autoComplete="name"
          />
        </div>
        <div className="form-group">
          <label>Contact Number</label>
          <input
            type="tel"
            placeholder="10-digit mobile number"
            value={person.contactNumber}
            onChange={(e) => updateDealingPerson(index, 'contactNumber', e.target.value)}
            autoComplete="tel"
          />
        </div>
        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            placeholder="person@example.com"
            value={person.email}
            onChange={(e) => updateDealingPerson(index, 'email', e.target.value)}
            autoComplete="email"
          />
        </div>
        <div className="form-group">
          <label>Department</label>
          <input
            type="text"
            placeholder="Enter department"
            value={person.department}
            onChange={(e) => updateDealingPerson(index, 'department', e.target.value)}
            autoComplete="organization-title"
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
));

const ContactStep = memo(({ transactionalMobile, setTransactionalMobile, transactionalEmail, setTransactionalEmail, shopNumber, setShopNumber, buildingName, setBuildingName, streetAddress, setStreetAddress, contactCity, setContactCity, contactDistrict, setContactDistrict, contactState, setContactState, contactPinCode, setContactPinCode }) => (
  <div className="step-content">
    <h2>Transactional Contact</h2>
    <div className="form-group">
      <label>Mobile</label>
      <input
        type="tel"
        placeholder="10-digit mobile number"
        value={transactionalMobile}
        onChange={(e) => setTransactionalMobile(e.target.value)}
        autoComplete="tel"
      />
    </div>
    <div className="form-group">
      <label>Email</label>
      <input
        type="email"
        placeholder="business@example.com"
        value={transactionalEmail}
        onChange={(e) => setTransactionalEmail(e.target.value)}
        autoComplete="email"
      />
    </div>
    <h2 style={{ marginTop: '40px' }}>Shipping Address</h2>
    <div className="form-group">
      <label>Shop Number / Flat Number</label>
      <input
        type="text"
        placeholder="Shop/Flat Number"
        value={shopNumber}
        onChange={(e) => setShopNumber(e.target.value)}
        autoComplete="off"
      />
    </div>
    <div className="form-group">
      <label>Building / Complex Name</label>
      <input
        type="text"
        placeholder="Building or Complex"
        value={buildingName}
        onChange={(e) => setBuildingName(e.target.value)}
        autoComplete="off"
      />
    </div>
    <div className="form-group">
      <label>Street Address</label>
      <input
        type="text"
        placeholder="Street Address"
        value={streetAddress}
        onChange={(e) => setStreetAddress(e.target.value)}
        autoComplete="street-address"
      />
    </div>
    <div className="form-group">
      <label>City / Village</label>
      <input
        type="text"
        placeholder="City or Village"
        value={contactCity}
        onChange={(e) => setContactCity(e.target.value)}
        autoComplete="address-level2"
      />
    </div>
    <div className="form-group">
      <label>District</label>
      <input
        type="text"
        placeholder="District"
        value={contactDistrict}
        onChange={(e) => setContactDistrict(e.target.value)}
        autoComplete="off"
      />
    </div>
    <div className="form-row">
      <div className="form-group">
        <label>State</label>
        <select
          value={contactState}
          onChange={(e) => setContactState(e.target.value)}
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
          value={contactPinCode}
          onChange={(e) => setContactPinCode(e.target.value)}
          autoComplete="postal-code"
        />
      </div>
    </div>
  </div>
));

const BankStep = memo(({ bankName, setBankName, ifscCode, setIfscCode, accountType, setAccountType, accountHolderName, setAccountHolderName, accountNumber, setAccountNumber, confirmAccountNumber, setConfirmAccountNumber }) => (
  <div className="step-content">
    <h2>Organization Bank Details</h2>
    <div className="form-group">
      <label className="required">Bank Name</label>
      <select
        value={bankName}
        onChange={(e) => setBankName(e.target.value)}
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
        value={ifscCode}
        onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
        autoComplete="off"
      />
      <small>Format: 4 letters followed by 7 numbers</small>
    </div>
    <div className="form-group">
      <label className="required">Account Type</label>
      <select
        value={accountType}
        onChange={(e) => setAccountType(e.target.value)}
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
        value={accountHolderName}
        onChange={(e) => setAccountHolderName(e.target.value)}
        autoComplete="name"
      />
    </div>
    <div className="form-group">
      <label className="required">Account Number</label>
      <input
        type="text"
        placeholder="Account number"
        value={accountNumber}
        onChange={(e) => setAccountNumber(e.target.value)}
        autoComplete="off"
      />
    </div>
    <div className="form-group">
      <label className="required">Confirm Account Number</label>
      <input
        type="text"
        placeholder="Re-enter account number"
        value={confirmAccountNumber}
        onChange={(e) => setConfirmAccountNumber(e.target.value)}
        autoComplete="off"
      />
    </div>
  </div>
));

const SecurityStep = memo(({ jmiOfficerID, setJmiOfficerID, privatePasskey, setPrivatePasskey, confirmPasskey, setConfirmPasskey }) => (
  <div className="step-content">
    <div className="security-section">
      <h3>Enter Officer ID</h3>
      <div className="otp-section">
        <div className="form-group">
          <label>JMI Officer ID</label>
          <input
            type="text"
            placeholder="Enter ID"
            value={jmiOfficerID}
            onChange={(e) => setJmiOfficerID(e.target.value)}
            autoComplete="off"
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
          value={privatePasskey}
          onChange={(e) => setPrivatePasskey(e.target.value)}
          autoComplete="new-password"
        />
      </div>
      <div className="form-group">
        <label>Re-enter Private Passkey</label>
        <input
          type="password"
          placeholder="Re-enter a Passkey"
          value={confirmPasskey}
          onChange={(e) => setConfirmPasskey(e.target.value)}
          autoComplete="new-password"
        />
      </div>
    </div>
  </div>
));

const StepIndicator = memo(({ steps, currentStep, completedSteps }) => (
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
));

// --- Main Component ---

const SellerRegistration = () => {
  const nav = useNavigate();
  const { seller } = useSeller(); // Get seller object from context
  const sellerId = seller?.sellerId; // Extract sellerId

  // --- ALL HOOKS MUST BE AT THE TOP LEVEL ---
  // Step and progress states
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  // Organization states
  const [gstrStatus, setGstrStatus] = useState('registered');
  const [gstinNumber, setGstinNumber] = useState('');
  const [businessDocuments, setBusinessDocuments] = useState([]);
  const [organizationPhotos, setOrganizationPhotos] = useState([]);
  const [organizationName, setOrganizationName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [organizationContact, setOrganizationContact] = useState('');
  const [organizationEmail, setOrganizationEmail] = useState('');
  const [businessTypes, setBusinessTypes] = useState(['Gold Jewelry', 'Diamond Jewelry']);
  const [storeLogo, setStoreLogo] = useState(null);

  // Dealing persons state
  const [dealingPersons, setDealingPersons] = useState([{
    fullName: '',
    contactNumber: '',
    email: '',
    department: '',
    role: '',
    photo: null
  }]);

  // Transactional contact states
  const [transactionalMobile, setTransactionalMobile] = useState('');
  const [transactionalEmail, setTransactionalEmail] = useState('');
  const [shopNumber, setShopNumber] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [contactCity, setContactCity] = useState('');
  const [contactDistrict, setContactDistrict] = useState('');
  const [contactState, setContactState] = useState('');
  const [contactPinCode, setContactPinCode] = useState('');

  // Bank details states
  const [bankName, setBankName] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountType, setAccountType] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');

  // Security states
  const [jmiOfficerID, setJmiOfficerID] = useState('');
  const [privatePasskey, setPrivatePasskey] = useState('');
  const [confirmPasskey, setConfirmPasskey] = useState('');

  // Cloudinary configuration
  const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_UPLOAD_PRESET = "jmiseller";

  const steps = [
    { number: 1, title: 'Organization', key: 'business' },
    { number: 2, title: 'Person', key: 'person' },
    { number: 3, title: 'Credentials', key: 'contact' },
    { number: 4, title: 'Bank', key: 'bank' },
    { number: 5, title: 'Security', key: 'security' }
  ];

  // --- EFFECT TO HANDLE MISSING CONTEXT ---
  useEffect(() => {
    if (sellerId === undefined) { // Check if context is still loading or missing
       console.warn("Seller ID not found in context. Redirecting...");
       alert("Registration session expired or not found. Please log in again.");
       nav('/login'); // Or appropriate redirect
    }
  }, [sellerId, nav]);

  // Upload single file to Cloudinary
  const uploadToCloudinary = useCallback(async (file, folder = '') => {
    try {
      if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
        throw new Error('Cloudinary configuration missing.');
      }
      const formDataCloud = new FormData();
      formDataCloud.append('file', file);
      formDataCloud.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      if (folder) {
        formDataCloud.append('folder', `seller-registration/${folder}`);
      }
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      formDataCloud.append('public_id', fileName);
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formDataCloud,
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Upload failed: ${errorData.error?.message || response.statusText}`);
      }
      const data = await response.json();
      return {
        url: data.secure_url,
        publicId: data.public_id
      };
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw error;
    }
  }, [CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET]);

  // Upload multiple files to Cloudinary
  const uploadMultipleFiles = useCallback(async (files, folder = '') => {
    const uploadPromises = Array.from(files).map(file => uploadToCloudinary(file, folder));
    return Promise.all(uploadPromises);
  }, [uploadToCloudinary]);

  // Save data to Firestore - Modified to use sellerId
  const saveToFirestore = useCallback(async (data) => {
    if (!sellerId) {
        console.error("Cannot save to Firestore: sellerId is missing.");
        throw new Error("Seller ID is required to save registration data.");
    }
    try {
      // Use sellerId as the document ID in 'sellerregistrations' collection
      const docRef = doc(db, 'sellerregistrations', sellerId);

      // Save seller registration data using sellerId
      await setDoc(docRef, {
        ...data,
        sellerId: sellerId,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Update the main seller document (in 'sellers' collection) to indicate registration completion
      const sellerProfileRef = doc(db, 'profile', sellerId);
      await setDoc(sellerProfileRef, {
        SellerRegistration: true,
      }, { merge: true });

      alert("Seller registered successfully!");
      nav('/segmentregistration');
    } catch (error) {
      console.error('Error saving to Firestore:', error);
      throw error;
    }
  }, [nav, sellerId]);

  const handleNext = useCallback(() => {
    if (currentStep < 5) {
      setCompletedSteps(prev => [...prev, currentStep]);
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleRegister = useCallback(async () => {
    if (!sellerId) {
        alert("Registration session expired. Please log in again.");
        nav('/login');
        return;
    }
    setLoading(true);
    setUploadProgress({}); // Reset progress
    try {
      const dataToSave = {
        gstrStatus,
        gstinNumber,
        organizationName,
        address,
        city,
        district,
        state,
        pinCode,
        organizationContact,
        organizationEmail,
        businessTypes,
        dealingPersons,
        transactionalMobile,
        transactionalEmail,
        shopNumber,
        buildingName,
        streetAddress,
        contactCity,
        contactDistrict,
        contactState,
        contactPinCode,
        bankName,
        ifscCode,
        accountType,
        accountHolderName,
        accountNumber,
        confirmAccountNumber,
        jmiOfficerID,
        privatePasskey,
        confirmPasskey
      };

      // Upload business documents
      if (businessDocuments.length > 0) {
        setUploadProgress(prev => ({ ...prev, businessDocs: 'Uploading business documents...' }));
        const businessDocResults = await uploadMultipleFiles(businessDocuments, 'business-documents');
        dataToSave.businessDocumentUrls = businessDocResults.map(result => result.url);
        dataToSave.businessDocumentIds = businessDocResults.map(result => result.publicId);
      }

      // Upload organization photos
      if (organizationPhotos.length > 0) {
        setUploadProgress(prev => ({ ...prev, orgPhotos: 'Uploading organization photos...' }));
        const orgPhotoResults = await uploadMultipleFiles(organizationPhotos, 'organization-photos');
        dataToSave.organizationPhotoUrls = orgPhotoResults.map(result => result.url);
        dataToSave.organizationPhotoIds = orgPhotoResults.map(result => result.publicId);
      }

      // Upload dealing person photos
      setUploadProgress(prev => ({ ...prev, personPhotos: 'Uploading person photos...' }));
      dataToSave.dealingPersons = await Promise.all(
        dealingPersons.map(async (person, index) => {
          if (person.photo) {
            const photoResult = await uploadToCloudinary(person.photo, `person-photos`);
            return {
              ...person,
              photoUrl: photoResult.url,
              photoId: photoResult.publicId,
              photo: null
            };
          }
          return person;
        })
      );

      // Upload store logo
      if (storeLogo) {
        setUploadProgress(prev => ({ ...prev, logo: 'Uploading store logo...' }));
        const logoResult = await uploadToCloudinary(storeLogo, 'store-logos');
        dataToSave.storeLogoUrl = logoResult.url;
        dataToSave.storeLogoId = logoResult.publicId;
      }

      setUploadProgress(prev => ({ ...prev, saving: 'Saving registration data...' }));

      // Save to Firestore using sellerId
      await saveToFirestore(dataToSave);

      setCompletedSteps(prev => [...prev, currentStep]);
      alert(`Registration completed successfully! Your ID is: ${sellerId}`);

    } catch (error) {
      console.error('Registration failed:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setLoading(false);
      setUploadProgress({});
    }
  }, [
    sellerId, nav, gstrStatus, gstinNumber, organizationName, address, city, district, state, pinCode,
    organizationContact, organizationEmail, businessTypes, storeLogo, dealingPersons,
    transactionalMobile, transactionalEmail, shopNumber, buildingName, streetAddress,
    contactCity, contactDistrict, contactState, contactPinCode, bankName, ifscCode,
    accountType, accountHolderName, accountNumber, confirmAccountNumber, jmiOfficerID,
    privatePasskey, confirmPasskey, businessDocuments, organizationPhotos, currentStep,
    uploadToCloudinary, uploadMultipleFiles, saveToFirestore
  ]);

  const addDealingPerson = useCallback(() => {
    setDealingPersons(prev => [...prev, {
      fullName: '',
      contactNumber: '',
      email: '',
      department: '',
      role: '',
      photo: null
    }]);
  }, []);

  const updateDealingPerson = useCallback((index, field, value) => {
    setDealingPersons(prev => prev.map((person, i) =>
      i === index ? { ...person, [field]: value } : person
    ));
  }, []);

  const removeDealingPerson = useCallback((index) => {
    setDealingPersons(prev => prev.filter((_, i) => i !== index));
  }, []);

  const removeBusinessType = useCallback((indexToRemove) => {
    setBusinessTypes(prev => prev.filter((_, index) => index !== indexToRemove));
  }, []);

  const removeBusinessDocument = useCallback((indexToRemove) => {
    setBusinessDocuments(prev => prev.filter((_, index) => index !== indexToRemove));
  }, []);

  const removeOrganizationPhoto = useCallback((indexToRemove) => {
    setOrganizationPhotos(prev => prev.filter((_, index) => index !== indexToRemove));
  }, []);

  const handleBusinessTypeKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const newType = e.target.value.trim();
      if (!businessTypes.includes(newType)) {
        setBusinessTypes(prev => [...prev, newType]);
      }
      e.target.value = '';
    }
  }, [businessTypes]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <BusinessStep
            gstrStatus={gstrStatus}
            setGstrStatus={setGstrStatus}
            gstinNumber={gstinNumber}
            setGstinNumber={setGstinNumber}
            businessDocuments={businessDocuments}
            setBusinessDocuments={setBusinessDocuments}
            organizationPhotos={organizationPhotos}
            setOrganizationPhotos={setOrganizationPhotos}
            organizationName={organizationName}
            setOrganizationName={setOrganizationName}
            address={address}
            setAddress={setAddress}
            city={city}
            setCity={setCity}
            district={district}
            setDistrict={setDistrict}
            state={state}
            setState={setState}
            pinCode={pinCode}
            setPinCode={setPinCode}
            organizationContact={organizationContact}
            setOrganizationContact={setOrganizationContact}
            organizationEmail={organizationEmail}
            setOrganizationEmail={setOrganizationEmail}
            businessTypes={businessTypes}
            setBusinessTypes={setBusinessTypes}
            storeLogo={storeLogo}
            setStoreLogo={setStoreLogo}
            removeBusinessType={removeBusinessType}
            removeBusinessDocument={removeBusinessDocument}
            removeOrganizationPhoto={removeOrganizationPhoto}
            handleBusinessTypeKeyPress={handleBusinessTypeKeyPress}
          />
        );
      case 2:
        return (
          <PersonStep
            dealingPersons={dealingPersons}
            setDealingPersons={setDealingPersons}
            addDealingPerson={addDealingPerson}
            updateDealingPerson={updateDealingPerson}
            removeDealingPerson={removeDealingPerson}
          />
        );
      case 3:
        return (
          <ContactStep
            transactionalMobile={transactionalMobile}
            setTransactionalMobile={setTransactionalMobile}
            transactionalEmail={transactionalEmail}
            setTransactionalEmail={setTransactionalEmail}
            shopNumber={shopNumber}
            setShopNumber={setShopNumber}
            buildingName={buildingName}
            setBuildingName={setBuildingName}
            streetAddress={streetAddress}
            setStreetAddress={setStreetAddress}
            contactCity={contactCity}
            setContactCity={setContactCity}
            contactDistrict={contactDistrict}
            setContactDistrict={setContactDistrict}
            contactState={contactState}
            setContactState={setContactState}
            contactPinCode={contactPinCode}
            setContactPinCode={setContactPinCode}
          />
        );
      case 4:
        return (
          <BankStep
            bankName={bankName}
            setBankName={setBankName}
            ifscCode={ifscCode}
            setIfscCode={setIfscCode}
            accountType={accountType}
            setAccountType={setAccountType}
            accountHolderName={accountHolderName}
            setAccountHolderName={setAccountHolderName}
            accountNumber={accountNumber}
            setAccountNumber={setAccountNumber}
            confirmAccountNumber={confirmAccountNumber}
            setConfirmAccountNumber={setConfirmAccountNumber}
          />
        );
      case 5:
        return (
          <SecurityStep
            jmiOfficerID={jmiOfficerID}
            setJmiOfficerID={setJmiOfficerID}
            privatePasskey={privatePasskey}
            setPrivatePasskey={setPrivatePasskey}
            confirmPasskey={confirmPasskey}
            setConfirmPasskey={setConfirmPasskey}
          />
        );
      default:
        return (
          <BusinessStep
            gstrStatus={gstrStatus}
            setGstrStatus={setGstrStatus}
            gstinNumber={gstinNumber}
            setGstinNumber={setGstinNumber}
            businessDocuments={businessDocuments}
            setBusinessDocuments={setBusinessDocuments}
            organizationPhotos={organizationPhotos}
            setOrganizationPhotos={setOrganizationPhotos}
            organizationName={organizationName}
            setOrganizationName={setOrganizationName}
            address={address}
            setAddress={setAddress}
            city={city}
            setCity={setCity}
            district={district}
            setDistrict={setDistrict}
            state={state}
            setState={setState}
            pinCode={pinCode}
            setPinCode={setPinCode}
            organizationContact={organizationContact}
            setOrganizationContact={setOrganizationContact}
            organizationEmail={organizationEmail}
            setOrganizationEmail={setOrganizationEmail}
            businessTypes={businessTypes}
            setBusinessTypes={setBusinessTypes}
            storeLogo={storeLogo}
            setStoreLogo={setStoreLogo}
            removeBusinessType={removeBusinessType}
            removeBusinessDocument={removeBusinessDocument}
            removeOrganizationPhoto={removeOrganizationPhoto}
            handleBusinessTypeKeyPress={handleBusinessTypeKeyPress}
          />
        );
    }
  };

  // Render nothing or a loading state while checking context or if sellerId is missing
  if (sellerId === undefined) {
      return <div>Loading registration session...</div>; // Or null, or a specific loading/error component
  }

  if (!sellerId) {
      // This case is handled by the useEffect and handleRegister, but a fallback UI is good
      return <div>Registration session not found. Redirecting...</div>;
  }

  return (
    <div className="seller-registration" style={{
      maxWidth: '600px',
      margin: '0px',
      background: '#ffffff',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div className="registration-header" style={{
        background: '#ffffff',
        padding: '20px',
        borderBottom: '1px solid #ddd'
      }}>
        <h1 style={{
          color: '#333',
          fontSize: '24px',
          fontWeight: '600',
          marginBottom: '20px'
        }}>Seller Registration</h1>
        <StepIndicator steps={steps} currentStep={currentStep} completedSteps={completedSteps} />
      </div>
      <div className="registration-content" style={{ padding: '30px' }}>
        {renderStepContent()}
        <div className="step-navigation" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: '1px solid #ddd'
        }}>
          <button
            type="button"
            onClick={handlePrevious}
            style={{
              background: '#ffffff',
              color: '#333',
              border: '1px solid #ddd',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
              minWidth: '120px',
              opacity: currentStep === 1 ? 0.5 : 1
            }}
            disabled={currentStep === 1}
          >
            Previous
          </button>
          {currentStep === 5 ? (
            <button
              type="button"
              onClick={handleRegister}
              style={{
                background: loading ? '#e0e0e0' : '#b8860b',
                color: '#ffffff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                minWidth: '120px'
              }}
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              style={{
                background: '#b8860b',
                color: '#ffffff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                minWidth: '120px'
              }}
            >
              Next
            </button>
          )}
        </div>
        {loading && (
          <div style={{
            marginTop: '20px',
            padding: '20px',
            background: '#f9f9f9',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <h3 style={{
              color: '#333',
              fontSize: '16px',
              marginBottom: '16px',
              textAlign: 'center'
            }}>Processing Registration...</h3>
            {Object.entries(uploadProgress).map(([key, message]) => (
              <div key={key} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 0',
                color: '#666',
                fontSize: '14px'
              }}>
                <span style={{
                  fontSize: '16px',
                  animation: 'spin 1s linear infinite'
                }}>⏳</span>
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