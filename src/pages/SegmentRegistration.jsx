import React, { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import './SegmentRegistration.css';
import readyServicesTerms from './terms/ready-services.json';
import orderServicesTerms from './terms/order-services.json';
import openMarketTerms from './terms/open-market.json';
import { useSeller } from '../contexts/SellerContext';

const SegmentRegistration = () => {
  const [operatorId, setOperatorId] = useState('');
  const [operatorDetails, setOperatorDetails] = useState(null);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [operatorOtp, setOperatorOtp] = useState(['', '', '', '', '', '']);
  const [showPopup, setShowPopup] = useState(false);
  const [popupContent, setPopupContent] = useState(null);
  const [segment, setSegment] = useState('gold'); // Default segment is 'gold'
  const nav = useNavigate();
  const { seller } = useSeller();

  const termsAndConditions = {
    'ready-services': readyServicesTerms,
    'order-services': orderServicesTerms,
    'open-market': openMarketTerms
  };

  const openPopup = (serviceType) => {
    setPopupContent(termsAndConditions[serviceType]);
    setShowPopup(true);
    document.body.style.overflow = 'hidden';
  };

  const closePopup = () => {
    setShowPopup(false);
    setPopupContent(null);
    document.body.style.overflow = 'auto';
  };

  useEffect(() => {
    if (operatorId.length === 15) {
      setIsLoading(true);
      // Simulate an API call
      setTimeout(() => {
        const fetchedDetails = {
          businessDocuments: ['Document.pdf', 'License.jpg'],
          organizationPhotos: ['https://placehold.co/80x80/e5e7eb/000000?text=Img1', 'https://placehold.co/80x80/e5e7eb/000000?text=Img2'],
          orgName: 'Golden Jewelry Pvt. Ltd.',
          address: '123, Gold Souk Market',
          city: 'Mumbai',
          district: 'Mumbai City',
          state: 'Maharashtra',
          pincode: '400001',
          contact: '9876543210'
        };
        setOperatorDetails(fetchedDetails);
        setIsAccordionOpen(true);
        setIsLoading(false);
      }, 1500);
    } else {
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
    if (value.length > 1) return;

    const newOtp = isOperatorOtp ? [...operatorOtp] : [...otp];
    newOtp[index] = value;

    if (isOperatorOtp) {
      setOperatorOtp(newOtp);
    } else {
      setOtp(newOtp);
    }

    if (value && index < 5) {
      const nextInput = document.querySelector(
        `input[name="${isOperatorOtp ? 'operator-otp' : 'otp'}-${index + 1}"]`
      );
      if (nextInput) nextInput.focus();
    }

    if (!value && index > 0) {
      const prevInput = document.querySelector(
        `input[name="${isOperatorOtp ? 'operator-otp' : 'otp'}-${index - 1}"]`
      );
      if (prevInput) prevInput.focus();
    }
  };

  const saveSegmentRegistration = useCallback(async () => {
    try {
      if (!seller || !seller.sellerId) {
        throw new Error('Seller not found in context');
      }

      const segmentDocRef = doc(db, 'SellerSegmentRegistrations', seller.sellerId);
      await setDoc(segmentDocRef, {
        sellerId: seller.sellerId,
        segment: segment,
        operatorId: operatorId,
        operatorDetails: operatorDetails,
        services: {
          readyServices: document.getElementById('ready-services')?.checked || false,
          orderServices: document.getElementById('order-services')?.checked || false,
          openMarket: document.getElementById('open-market')?.checked || false
        },
        agreedToTerms: document.getElementById('agree')?.checked || false,
        registrationComplete: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      alert("Segment registered successfully!");
      const sellerProfileRef = doc(db, 'profile', seller.sellerId);

      await setDoc(sellerProfileRef, {
        SegmentRegistration: true,
      }, { merge: true });

      nav('/productregistration');

    } catch (error) {
      console.error('Error saving segment registration:', error);
      alert("Error registering segment. Please try again.");
    }
  }, [segment, operatorId, operatorDetails, nav, seller]);

  const handleSubmit = () => {
    // --- Validation for Required Fields ---
    if (!segment) { // Check if segment is selected (though default 'gold' makes this unlikely)
      alert("Please select a Segment");
      return;
    }

    if (!operatorId || operatorId.length !== 10) {
      alert("Please enter a valid 10-digit Operator ID")
      return;
    }

    if (!operatorDetails) {
      alert("Please fetch operator details first by entering a valid Operator ID");
      return;
    }

    

    const readyServicesChecked = document.getElementById('ready-services')?.checked;
    const orderServicesChecked = document.getElementById('order-services')?.checked;
    const openMarketChecked = document.getElementById('open-market')?.checked;

    // Check if at least one service is selected
    if (!readyServicesChecked && !orderServicesChecked && !openMarketChecked) {
      alert("Please select at least one Service");
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
            <label htmlFor="segment">Segment *</label> {/* Added asterisk */}
            <select
              id="segment"
              name="segment"
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              required // Added required attribute
            >
              <option value="">Select Segment</option> {/* Added default option */}
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
              <option value="platinum">Platinum</option>
              <option value="diamond">Diamond</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="operator-id">Operator ID *</label> {/* Added asterisk */}
            <input
              type="text"
              id="operator-id"
              name="operator-id"
              placeholder="e.g. 22AAAAA0000A1Z5"
              value={operatorId}
              onChange={handleOperatorIdChange}
              maxLength="15"
              required // Added required attribute
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
                {/* Operator Details fields are read-only, so they don't need 'required' */}
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
          <h2>Service Selection *</h2> {/* Added asterisk to section title */}
          <div className="checkbox-group">
            <input type="checkbox" id="ready-services" name="services" /> {/* Added name for grouping */}
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
            <input type="checkbox" id="order-services" name="services" /> {/* Added name for grouping */}
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
            <input type="checkbox" id="open-market" name="services" /> {/* Added name for grouping */}
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
            <input type="checkbox" id="agree" required /> {/* Added required attribute */}
            <label htmlFor="agree">I agree to all availing services with Terms & Conditions *</label> {/* Added asterisk */}
          </div>
        </section>

        <section className="verification">
          <h2>Verification *</h2> {/* Added asterisk to section title */}
          <div className="form-group">
            <label>OTP *</label> {/* Added asterisk */}
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
                  required // Added required attribute to each OTP input
                  inputMode="numeric" // Suggest numeric keyboard on mobile
                  pattern="[0-9]*"    // Suggest numeric keyboard on mobile
                />
              ))}
            </div>
            <p>OTP sent to your registered mobile number</p>
          </div>
          <div className="form-group">
            <label>Operator OTP *</label> {/* Added asterisk */}
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
                  required // Added required attribute to each Operator OTP input
                  inputMode="numeric" // Suggest numeric keyboard on mobile
                  pattern="[0-9]*"    // Suggest numeric keyboard on mobile
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