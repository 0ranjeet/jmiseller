import React, { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth } from './firebase-config'; // Adjust path as needed
import { useNavigate } from 'react-router-dom';
import { db } from './firebase-config'; // Adjust path as needed
import './SegmentRegistration.css';
// Import JSON files for Terms & Conditions
import readyServicesTerms from './terms/ready-services.json';
import orderServicesTerms from './terms/order-services.json';
import openMarketTerms from './terms/open-market.json';

const SegmentRegistration = () => {
  const [operatorId, setOperatorId] = useState('');
  const [operatorDetails, setOperatorDetails] = useState(null);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [operatorOtp, setOperatorOtp] = useState(['', '', '', '', '', '']);
  const [showPopup, setShowPopup] = useState(false);
  const [popupContent, setPopupContent] = useState(null);
  const [segment, setSegment] = useState('gold'); // Added state for segment selection
  const nav = useNavigate();

  // Terms & Conditions mapping to imported JSON files
  const termsAndConditions = {
    'ready-services': readyServicesTerms,
    'order-services': orderServicesTerms,
    'open-market': openMarketTerms
  };

  const openPopup = (serviceType) => {
    setPopupContent(termsAndConditions[serviceType]);
    setShowPopup(true);
    // Prevent body scroll when popup is open
    document.body.style.overflow = 'hidden';
  };

  const closePopup = () => {
    setShowPopup(false);
    setPopupContent(null);
    // Restore body scroll
    document.body.style.overflow = 'auto';
  };

  // Effect to watch for changes in operatorId
  useEffect(() => {
    // A simple check to trigger the fetch, e.g., when the length is 15
    if (operatorId.length === 15) {
      setIsLoading(true);
      // Simulate an API call
      setTimeout(() => {
        const fetchedDetails = {
          businessDocuments: ['Document.pdf', 'License.jpg'],
          organizationPhotos: ['https://placehold.co/80x80/e5e7eb/000000?text=Img1', '  https://placehold.co/80x80/e5e7eb/000000?text=Img2'],
          orgName: 'Golden Jewelry Pvt. Ltd.',
          address: '123, Gold Souk Market',
          city: 'Mumbai',
          district: 'Mumbai City',
          state: 'Maharashtra',
          pincode: '400001',
          contact: '9876543210'
        };
        setOperatorDetails(fetchedDetails);
        setIsAccordionOpen(true); // Open accordion when data is fetched
        setIsLoading(false);
      }, 1500); // 1.5-second delay to simulate fetching
    } else {
      // Reset if the ID is cleared or invalid
      setOperatorDetails(null);
      setIsAccordionOpen(false);
    }
  }, [operatorId]);

  const handleOperatorIdChange = (e) => {
    setOperatorId(e.target.value);
  };

  const toggleAccordion = () => {
    setIsAccordionOpen(!isAccordionOpen);
  };

  const handleOtpChange = (index, value, isOperatorOtp = false) => {
    if (value.length > 1) return; // Prevent multiple characters

    const newOtp = isOperatorOtp ? [...operatorOtp] : [...otp];
    newOtp[index] = value;

    if (isOperatorOtp) {
      setOperatorOtp(newOtp);
    } else {
      setOtp(newOtp);
    }

    // Auto-focus to next input
    if (value && index < 5) {
      const nextInput = document.querySelector(
        `input[name="${isOperatorOtp ? 'operator-otp' : 'otp'}-${index + 1}"]`
      );
      if (nextInput) nextInput.focus();
    }

    // Auto-focus to previous input on backspace
    if (!value && index > 0) {
      const prevInput = document.querySelector(
        `input[name="${isOperatorOtp ? 'operator-otp' : 'otp'}-${index - 1}"]`
      );
      if (prevInput) prevInput.focus();
    }
  };

  // Function to save segment registration data
  const saveSegmentRegistration = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create segment registration document
      const segmentDocRef = doc(db, 'segment-registrations', user.uid);
      await setDoc(segmentDocRef, {
        userId: user.uid,
        segment: segment,
        operatorId: operatorId,
        operatorDetails: operatorDetails,
        services: {
          readyServices: document.getElementById('ready-services')?.checked || false,
          orderServices: document.getElementById('order-services')?.checked || false,
          openMarket: document.getElementById('open-market')?.checked || false
        },
        agreedToTerms: document.getElementById('agree')?.checked || false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update user profile
      const profileRef = doc(db, 'profiles', user.uid);
      await setDoc(profileRef, {
        segmentRegistrationCompleted: true,
        productRegistrationCompleted: false,
        updatedAt: serverTimestamp()
      }, { merge: true });

      alert("Segment registered successfully!");
      nav('/productregistration');
    } catch (error) {
      console.error('Error saving segment registration:', error);
      alert("Error registering segment. Please try again.");
    }
  }, [segment, operatorId, operatorDetails, nav]);

  const handleSubmit = () => {
    // Validate required fields
    if (!operatorId || operatorId.length !== 15) {
      alert("Please enter a valid Operator ID");
      return;
    }

    if (!operatorDetails) {
      alert("Please fetch operator details first");
      return;
    }

    const otpValue = otp.join('');
    const operatorOtpValue = operatorOtp.join('');
    
    if (otpValue.length !== 6) {
      alert("Please enter a valid OTP");
      return;
    }

    if (operatorOtpValue.length !== 6) {
      alert("Please enter a valid Operator OTP");
      return;
    }

    const agreeCheckbox = document.getElementById('agree');
    if (!agreeCheckbox?.checked) {
      alert("Please agree to the Terms & Conditions");
      return;
    }

    // Save segment registration and navigate
    saveSegmentRegistration();
  };

  return (
    <div className="segment-registration-container">
      <header className="sticky-header">
        <h1>Segment Registration</h1>
      </header>
      <main className="main-content">
        <section className="segment-information">
          <h2>Segment Information</h2>
          <div className="form-group">
            <label htmlFor="segment">Segment</label>
            <select 
              id="segment" 
              name="segment"
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
            >
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
              <option value="platinum">Platinum</option>
              <option value="diamond">Diamond</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="operator-id">Operator ID</label>
            <input
              type="text"
              id="operator-id"
              name="operator-id"
              placeholder="e.g. 22AAAAA0000A1Z5"
              value={operatorId}
              onChange={handleOperatorIdChange}
              maxLength="15"
            />
            {isLoading && <div className="loading-spinner"></div>}
          </div>
        </section>

        <section className="operator-details">
          <div className="section-header" onClick={toggleAccordion} style={{ cursor: 'pointer' }}>
            <h2>Operator Details</h2>
            <button type="button" className={isAccordionOpen ? 'open' : ''} style={{ transform: isAccordionOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>&#9660;</button>
          </div>
          <div className={`accordion-content ${isAccordionOpen ? 'open' : ''}`}>
            {operatorDetails ? (
              <>
                <div className="form-group">
                  <label>Business Documents</label>
                  <div className="file-uploads">
                    {operatorDetails.businessDocuments.map((doc, index) => (
                      <div className="file-preview" key={index}>
                        <span>{doc}</span>
                        <button className="delete-btn">x</button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Organization Photos</label>
                  <div className="image-uploads">
                    {operatorDetails.organizationPhotos.map((photo, index) => (
                      <img key={index} src={photo} alt={`Organization ${index + 1}`} />
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="org-name">Organization Name</label>
                  <input
                    type="text"
                    id="org-name"
                    name="org-name"
                    placeholder="Enter Org. Name"
                    defaultValue={operatorDetails.orgName}
                    readOnly
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="address">Address</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    placeholder="Street/Building"
                    defaultValue={operatorDetails.address}
                    readOnly
                  />
                  <div className="address-details">
                    <input type="text" placeholder="City" defaultValue={operatorDetails.city} readOnly />
                    <input type="text" placeholder="District" defaultValue={operatorDetails.district} readOnly />
                  </div>
                  <div className="address-details">
                    <select defaultValue={operatorDetails.state} disabled>
                      <option>{operatorDetails.state}</option>
                      <option>Another State</option>
                    </select>
                    <input type="text" placeholder="Pincode" defaultValue={operatorDetails.pincode} readOnly />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="org-contact">Organization Contact</label>
                  <input
                    type="text"
                    id="org-contact"
                    name="org-contact"
                    placeholder="Enter Org. Contact No."
                    defaultValue={operatorDetails.contact}
                    readOnly
                  />
                </div>
              </>
            ) : (
              <p style={{ padding: '0 16px 16px', margin: 0, color: '#6B7280' }}>Enter an Operator ID to fetch details.</p>
            )}
          </div>
        </section>

        <section className="service-selection">
          <h2>Service Selection</h2>
          <div className="checkbox-group">
            <input type="checkbox" id="ready-services" />
            <label htmlFor="ready-services">Ready Services</label>
            <button
              type="button"
              className="terms-link"
              onClick={() => openPopup('ready-services')}
            >
              Terms & Conditions
            </button>
          </div>
          <div className="checkbox-group">
            <input type="checkbox" id="order-services" />
            <label htmlFor="order-services">Order Services</label>
            <button
              type="button"
              className="terms-link"
              onClick={() => openPopup('order-services')}
            >
              Terms & Conditions
            </button>
          </div>
          <div className="checkbox-group">
            <input type="checkbox" id="open-market" />
            <label htmlFor="open-market">Open Market</label>
            <button
              type="button"
              className="terms-link"
              onClick={() => openPopup('open-market')}
            >
              Terms & Conditions
            </button>
          </div>
          <div className="checkbox-group agreement">
            <input type="checkbox" id="agree" />
            <label htmlFor="agree">I agree to all availing services with Terms & Conditions</label>
          </div>
        </section>

        <section className="verification">
          <h2>Verification</h2>
          <div className="form-group">
            <label>OTP</label>
            <div className="otp-inputs">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  name={`otp-${index}`}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !digit && index > 0) {
                      const prevInput = document.querySelector(`input[name="otp-${index - 1}"]`);
                      if (prevInput) prevInput.focus();
                    }
                  }}
                />
              ))}
            </div>
            <p>OTP sent to your registered mobile number</p>
          </div>
          <div className="form-group">
            <label>Operator OTP</label>
            <div className="otp-inputs">
              {operatorOtp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  name={`operator-otp-${index}`}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value, true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !digit && index > 0) {
                      const prevInput = document.querySelector(`input[name="operator-otp-${index - 1}"]`);
                      if (prevInput) prevInput.focus();
                    }
                  }}
                />
              ))}
            </div>
            <span href="#" className="resend-otp">Resend OTP</span>
          </div>
        </section>
      </main>
      <footer className="sticky-footer">
        <button className="draft-btn">Save Draft</button>
        <button className="submit-btn" onClick={handleSubmit}>Submit</button>
      </footer>

      {/* Terms & Conditions Popup */}
      {showPopup && popupContent && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>{popupContent.title}</h3>
              <button className="close-btn" onClick={closePopup}>×</button>
            </div>
            <div className="popup-body">
              {popupContent.content.map((section, index) => (
                <div key={index} className="terms-section">
                  <h4>{section.section}</h4>
                  <p>{section.text}</p>
                </div>
              ))}
            </div>
            <div className="popup-footer">
              <button className="popup-close-btn" onClick={closePopup}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SegmentRegistration;