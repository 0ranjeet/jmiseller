import React, { useState, useEffect, useCallback, useRef } from 'react';
import { doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp, deleteDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import bcrypt from 'bcryptjs';
import { db } from '../services/firebase';
import './SegmentRegistration.css';
import readyServicesTerms from './terms/ready-services.json';
import orderServicesTerms from './terms/order-services.json';
import openMarketTerms from './terms/open-market.json';
import { useSeller } from '../contexts/SellerContext';

// Constants
const OTP_EXPIRY_MINUTES = 10;
const USE_CASE_SELLER = "SELLER_SEGMENT_REGISTRATION";
const USE_CASE_OPERATOR = "OPERATOR_SEGMENT_APPROVAL";

// Reusable Digit Input Component
const DigitInputs = React.memo(({ digits, setDigits, disabled = false, isPasskey = false }) => {
  const refs = useRef([]);
  const inputType = isPasskey ? "password" : "text";

  const handleChange = (index, value) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 1);
    if (numericValue.length === 0 && value.length > 0) return;

    const newDigits = [...digits];
    newDigits[index] = numericValue;
    setDigits(newDigits);

    if (numericValue && index < 5 && refs.current[index + 1]) {
      refs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0 && refs.current[index - 1]) {
      e.preventDefault();
      refs.current[index - 1].focus();
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      setDigits(newDigits);
    }
  };

  return (
    <div className="digit-inputs" style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
      {digits.map((digit, index) => (
        <input
          key={index}
          type={inputType}
          maxLength="1"
          name={`${isPasskey ? 'passkey' : 'otp'}-digit-${index}`}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          required
          inputMode="numeric"
          pattern="\d{1}"
          disabled={disabled}
          ref={(el) => (refs.current[index] = el)}
          style={{ width: '50px', height: '50px', textAlign: 'center', fontSize: '18px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
      ))}
    </div>
  );
});

const SegmentRegistration = () => {
  const [operatorMobile, setOperatorMobile] = useState('');
  const [operatorDetails, setOperatorDetails] = useState(null);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [segment, setSegment] = useState('');
  const [existingRegistration, setExistingRegistration] = useState(null);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true);
  const [zone, setZone] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupContent, setPopupContent] = useState(null);

  // OTP States
  const [sellerOtp, setSellerOtp] = useState(['', '', '', '', '', '']);
  const [operatorOtp, setOperatorOtp] = useState(['', '', '', '', '', '']);
  const [isSellerOtpSent, setIsSellerOtpSent] = useState(false);
  const [isOperatorOtpSent, setIsOperatorOtpSent] = useState(false);
  const [isSellerVerified, setIsSellerVerified] = useState(false);
  const [isOperatorVerified, setIsOperatorVerified] = useState(false);
  const [isSendingSellerOtp, setIsSendingSellerOtp] = useState(false);
  const [isSendingOperatorOtp, setIsSendingOperatorOtp] = useState(false);
  const [isVerifyingSellerOtp, setIsVerifyingSellerOtp] = useState(false);
  const [isVerifyingOperatorOtp, setIsVerifyingOperatorOtp] = useState(false);

  const nav = useNavigate();
  const { seller } = useSeller();

  const termsAndConditions = {
    'ready-services': readyServicesTerms,
    'order-services': orderServicesTerms,
    'open-market': openMarketTerms
  };

  // Check for existing segment registration
  useEffect(() => {
    const checkExistingRegistration = async () => {
      if (!seller || !seller.sellerId) {
        setIsCheckingRegistration(false);
        return;
      }
      try {
        const segmentDocRef = doc(db, 'SellerSegmentRegistrations', seller.sellerId);
        const segmentDoc = await getDoc(segmentDocRef);

        if (segmentDoc.exists()) {
          const registrationData = segmentDoc.data();
          setExistingRegistration(registrationData);
          setSegment(registrationData.segment);
        }
      } catch (error) {
        console.error('Error checking existing registration:', error);
      } finally {
        setIsCheckingRegistration(false);
      }
    };

    checkExistingRegistration();
  }, [seller]);

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

  // Generate OTP function
  const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Send Seller OTP - Using exact format from provided example
  const handleSendSellerOtp = useCallback(async () => {
    if (!seller || !seller.mobile) {
      alert("Seller mobile number not found. Please login again.");
      return;
    }

    setIsSendingSellerOtp(true);

    try {
      const plainOtp = generateOtp();
      const hashedOtp = await bcrypt.hash(plainOtp, 10);
      const otpId = `+91${seller.mobile}_${USE_CASE_SELLER}`;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);
      const readableMessage = `Your Seller segment registration OTP is: ${plainOtp}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`;

      // Exact same format as provided example
      await setDoc(doc(db, "otps", otpId), {
        mobile: seller.mobile,
        otp: hashedOtp,
        plaintextOtp: plainOtp,
        message: readableMessage,
        sentByAdmin: false,
        useCase: USE_CASE_SELLER,
        status: "pending",
        createdAt: now,
        expiresAt,
      });

      console.log(`[DEV] Seller OTP generated for ${seller.mobile}: ${plainOtp}`);
      setIsSellerOtpSent(true);
      setSellerOtp(['', '', '', '', '', '']);
      alert(`✅ OTP request processed for seller ${seller.mobile}. OTP has been generated.`);
    } catch (error) {
      console.error("Error generating seller OTP:", error);
      alert("Failed to generate OTP. Please try again.");
    } finally {
      setIsSendingSellerOtp(false);
    }
  }, [seller]);

  // Verify Seller OTP - Using exact format from provided example
  const handleVerifySellerOtp = useCallback(async () => {
    const fullOtp = sellerOtp.join('');

    if (fullOtp.length !== 6 || isNaN(fullOtp)) {
      alert("Please enter the complete 6-digit OTP.");
      return;
    }

    if (!seller || !seller.mobile) {
      alert("Seller information not found.");
      return;
    }

    setIsVerifyingSellerOtp(true);

    try {
      const otpId = `+91${seller.mobile}_${USE_CASE_SELLER}`;
      const otpRef = doc(db, "otps", otpId);
      const otpSnap = await getDoc(otpRef);

      if (!otpSnap.exists()) {
        alert("No OTP found. Please request a new one.");
        return;
      }

      const data = otpSnap.data();
      const now = new Date();

      // Check for expiration
      if (now > data.expiresAt.toDate()) {
        alert("OTP has expired. Please request a new one.");
        await deleteDoc(otpRef);
        setIsSellerOtpSent(false);
        return;
      }

      // Verify the OTP against the hashed value
      const isValid = await bcrypt.compare(fullOtp, data.otp);
      if (!isValid) {
        alert("Invalid OTP. Please check and try again.");
        return;
      }

      // Mark the OTP as verified in the database
      await setDoc(otpRef, { status: "verified" }, { merge: true });
      setIsSellerVerified(true);
      alert("🎉 Seller verified successfully!");
    } catch (error) {
      console.error("Seller OTP verification error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsVerifyingSellerOtp(false);
    }
  }, [sellerOtp, seller]);

  // Send Operator OTP - Using exact format from provided example
  const handleSendOperatorOtp = useCallback(async () => {
    if (!operatorMobile || operatorMobile.length !== 10) {
      alert("Please enter a valid operator mobile number first.");
      return;
    }

    setIsSendingOperatorOtp(true);

    try {
      const plainOtp = generateOtp();
      const hashedOtp = await bcrypt.hash(plainOtp, 10);
      const otpId = `+91${operatorMobile}_${USE_CASE_OPERATOR}`;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);
      const readableMessage = `Your Operator segment approval OTP is: ${plainOtp}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`;

      // Exact same format as provided example
      await setDoc(doc(db, "otps", otpId), {
        mobile: operatorMobile,
        otp: hashedOtp,
        plaintextOtp: plainOtp,
        message: readableMessage,
        sentByAdmin: false,
        useCase: USE_CASE_OPERATOR,
        status: "pending",
        createdAt: now,
        expiresAt,
      });

      console.log(`[DEV] Operator OTP generated for ${operatorMobile}: ${plainOtp}`);
      setIsOperatorOtpSent(true);
      setOperatorOtp(['', '', '', '', '', '']);
      alert(`✅ OTP request processed for operator ${operatorMobile}. Ask operator to provide the OTP.`);
    } catch (error) {
      console.error("Error generating operator OTP:", error);
      alert("Failed to generate operator OTP. Please try again.");
    } finally {
      setIsSendingOperatorOtp(false);
    }
  }, [operatorMobile]);

  // Verify Operator OTP - Using exact format from provided example
  const handleVerifyOperatorOtp = useCallback(async () => {
    const fullOtp = operatorOtp.join('');

    if (fullOtp.length !== 6 || isNaN(fullOtp)) {
      alert("Please enter the complete 6-digit OTP.");
      return;
    }

    if (!operatorMobile) {
      alert("Operator mobile number not found.");
      return;
    }

    setIsVerifyingOperatorOtp(true);

    try {
      const otpId = `+91${operatorMobile}_${USE_CASE_OPERATOR}`;
      const otpRef = doc(db, "otps", otpId);
      const otpSnap = await getDoc(otpRef);

      if (!otpSnap.exists()) {
        alert("No OTP found. Please request a new one.");
        return;
      }

      const data = otpSnap.data();
      const now = new Date();

      // Check for expiration
      if (now > data.expiresAt.toDate()) {
        alert("OTP has expired. Please request a new one.");
        await deleteDoc(otpRef);
        setIsOperatorOtpSent(false);
        return;
      }

      // Verify the OTP against the hashed value
      const isValid = await bcrypt.compare(fullOtp, data.otp);
      if (!isValid) {
        alert("Invalid OTP. Please check and try again.");
        return;
      }

      // Mark the OTP as verified in the database
      await setDoc(otpRef, { status: "verified" }, { merge: true });
      setIsOperatorVerified(true);
      alert("🎉 Operator verified successfully!");
    } catch (error) {
      console.error("Operator OTP verification error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsVerifyingOperatorOtp(false);
    }
  }, [operatorOtp, operatorMobile]);

  // Fetch operator by mobile number
  useEffect(() => {
    const fetchOperatorByMobile = async () => {
      if (operatorMobile.length === 10) {
        setIsLoading(true);
        try {
          const operatorSegmentQuery = query(
            collection(db, 'OperatorSegmentRegistrations'),
            where('mobile', '==', operatorMobile)
          );

          const operatorSegmentSnapshot = await getDocs(operatorSegmentQuery);

          if (!operatorSegmentSnapshot.empty) {
            const operatorSegmentData = operatorSegmentSnapshot.docs[0].data();
            const operatorId = operatorSegmentData.operatorId;

            const zoneData = Object.values(operatorSegmentData.zone).flat();
            setZone(zoneData);

            const operatorDocRef = doc(db, 'operatorregistrations', operatorId);
            const operatorDoc = await getDoc(operatorDocRef);

            if (operatorDoc.exists()) {
              const operatorData = operatorDoc.data();

              const formattedDetails = {
                operatorId: operatorId,
                orgName: operatorData.organizationName,
                contact: operatorData.organizationContact,
                email: operatorData.organizationEmail,
                businessType: operatorData.businessType,
                gstinNumber: operatorData.gstinNumber,
                street: operatorData.streetAddress,
                address: operatorData.buildingName,
                city: operatorData.contactCity,
                district: operatorData.contactDistrict,
                state: operatorData.contactState,
                pincode: operatorData.contactPinCode,
                businessDocuments: operatorData.businessDocumentUrls || [],
                organizationPhotos: operatorData.organizationPhotoUrls || [],
                dealingPersons: operatorData.dealingPersons || [],
                logo: operatorData.storeLogoUrl,
                bankDetails: {
                  accountHolderName: operatorData.accountHolderName,
                  accountNumber: operatorData.accountNumber,
                  bankName: operatorData.bankName,
                  ifscCode: operatorData.ifscCode,
                  accountType: operatorData.accountType
                },
                segmentServices: operatorSegmentData.services || {},
                // Add seller IDs from OperatorSegmentRegistrations
                sellerIds: operatorSegmentData.sellerIds || []
              };

              setOperatorDetails(formattedDetails);
              setIsAccordionOpen(true);
            } else {
              setOperatorDetails(null);
              alert('Operator details not found');
            }
          } else {
            setOperatorDetails(null);
            alert('Operator not found with this mobile number');
          }
        } catch (error) {
          console.error('Error fetching operator details:', error);
          alert('Error fetching operator details');
          setOperatorDetails(null);
        } finally {
          setIsLoading(false);
        }
      } else {
        setOperatorDetails(null);
        setIsAccordionOpen(false);
      }
    };

    const debounceTimer = setTimeout(fetchOperatorByMobile, 1000);
    return () => clearTimeout(debounceTimer);
  }, [operatorMobile]);

  const handleOperatorMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setOperatorMobile(value);

    // Reset operator verification when mobile changes
    if (value !== operatorMobile) {
      setIsOperatorOtpSent(false);
      setIsOperatorVerified(false);
      setOperatorOtp(['', '', '', '', '', '']);
    }
  };

  const toggleAccordion = () => {
    setIsAccordionOpen(!isAccordionOpen);
  };

  // Add sellerId to OperatorSegmentRegistrations (only ID)
  const addSellerToOperatorSegment = async (operatorId) => {
    try {
      const operatorSegmentRef = doc(db, 'OperatorSegmentRegistrations', operatorId);

      // Add ONLY sellerId to the operator's sellerIds array
      await updateDoc(operatorSegmentRef, {
        sellerIds: arrayUnion(seller.sellerId),
        updatedAt: serverTimestamp()
      });

      console.log(`Seller ${seller.sellerId} added to operator ${operatorId} in OperatorSegmentRegistrations`);
    } catch (error) {
      console.error('Error adding seller to operator segment:', error);
      throw error;
    }
  };

  const saveSegmentRegistration = useCallback(async () => {
    try {
      if (!seller || !seller.sellerId) {
        throw new Error('Seller not found in context');
      }

      const segmentDocRef = doc(db, 'SellerSegmentRegistrations', seller.sellerId);

      // Get existing operators or initialize empty array
      const existingOperators = existingRegistration?.operators || [];

      // Check if operator already exists
      const operatorExists = existingOperators.includes(operatorDetails?.operatorId);

      if (operatorExists) {
        alert("This operator is already linked to your account.");
        return;
      }

      // Prepare registration data
      const registrationData = {
        sellerId: seller.sellerId,
        segment: segment,
        operatorMobile: operatorMobile,
        operatorId: operatorDetails?.operatorId,
        services: {
          readyServices: document.getElementById('ready-services')?.checked || false,
          orderServices: document.getElementById('order-services')?.checked || false,
          openMarket: document.getElementById('open-market')?.checked || false
        },
        agreedToTerms: document.getElementById('agree')?.checked || false,
        registrationComplete: true,
        updatedAt: serverTimestamp()
      };

      // Add ONLY operatorId to operators array
      registrationData.operators = [...existingOperators, operatorDetails?.operatorId];

      // If it's a new registration, add createdAt
      if (!existingRegistration) {
        registrationData.createdAt = serverTimestamp();
      }

      // 1. Save to SellerSegmentRegistrations (seller has operatorIds list)
      await setDoc(segmentDocRef, registrationData);

      // 2. Add sellerId to OperatorSegmentRegistrations (operator has sellerIds list)
      await addSellerToOperatorSegment(operatorDetails?.operatorId);

      alert("Operator added to segment successfully!");

      // Update seller profile
      const sellerProfileRef = doc(db, 'profile', seller.sellerId);
      await setDoc(sellerProfileRef, {
        SegmentRegistration: true,
        segment: segment
      }, { merge: true });
      const profileSnap = await getDoc(sellerProfileRef);

      let profileData = {};
      if (profileSnap.exists()) {
        profileData = profileSnap.data();
      }
      if (!profileData.ProductRegistration) {
        nav("/productregistration");
      } else {
        nav('/dashboard');
      }


    } catch (error) {
      console.error('Error saving segment registration:', error);
      alert("Error registering operator. Please try again.");
    }
  }, [segment, operatorMobile, operatorDetails, nav, seller, existingRegistration]);

  const handleSubmit = () => {
    // Validation
    if (!segment) {
      alert("Please select a Segment");
      return;
    }

    if (!operatorMobile || operatorMobile.length !== 10) {
      alert("Please enter a valid 10-digit mobile number");
      return;
    }

    if (!operatorDetails) {
      alert("Please fetch operator details first by entering a valid mobile number");
      return;
    }

    const readyServicesChecked = document.getElementById('ready-services')?.checked;
    const orderServicesChecked = document.getElementById('order-services')?.checked;
    const openMarketChecked = document.getElementById('open-market')?.checked;

    if (!readyServicesChecked && !orderServicesChecked && !openMarketChecked) {
      alert("Please select at least one Service");
      return;
    }

    const agreeCheckbox = document.getElementById('agree');
    if (!agreeCheckbox?.checked) {
      alert("Please agree to the Terms & Conditions");
      return;
    }

    // Check if both OTPs are verified
    if (!isSellerVerified) {
      alert("Please complete seller OTP verification");
      return;
    }

    if (!isOperatorVerified) {
      alert("Please complete operator OTP verification");
      return;
    }

    saveSegmentRegistration();
  };

  if (isCheckingRegistration) {
    return <div className="loading">Checking registration status...</div>;
  }

  return (
    <div className="segment-registration-container">
      <header className="sticky-header">
        <h1>Segment Registration</h1>
        {existingRegistration && (
          <div className="existing-registration-banner">
            ✓ Already registered in <strong>{existingRegistration.segment}</strong> segment
            {existingRegistration.operators && (
              <span> with {existingRegistration.operators.length} operator(s)</span>
            )}
          </div>
        )}
      </header>
      <main className="main-content">
        <section className="segment-information">
          <h2>Segment Information</h2>
          <div className="form-group">
            <label htmlFor="segment">Segment *</label>
            {existingRegistration ? (
              <input
                type="text"
                id="segment"
                name="segment"
                value={segment}
                readOnly
                className="read-only-segment"
              />
            ) : (
              <select
                id="segment"
                name="segment"
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                required
              >
                <option value="">Select Segment</option>
                <option value="gold">Gold</option>
                <option value="silver">Silver</option>
                <option value="platinum">Platinum</option>
                <option value="diamond">Diamond</option>
              </select>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="operator-mobile">Operator Mobile Number *</label>
            <input
              type="text"
              id="operator-mobile"
              name="operator-mobile"
              placeholder="e.g. 9876543210"
              value={operatorMobile}
              onChange={handleOperatorMobileChange}
              maxLength="10"
              inputMode="numeric"
              required
            />
            {isLoading && <div className="loading-spinner"></div>}
            <p className="helper-text">Enter operator's registered mobile number to fetch details</p>
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
                <div className='form-group'><span>Operator ID:</span><span>{operatorDetails.operatorId}</span></div>
                <div className='form-group'><span>GST No:</span><span>{operatorDetails.gstinNumber}</span></div>
                <div className='form-group'><span>PAN No:</span><span>{(operatorDetails.gstinNumber)?.substring(2, 12)}</span></div>

                {/* Display linked sellers count from OperatorSegmentRegistrations */}
                {operatorDetails.sellerIds && operatorDetails.sellerIds.length > 0 && (
                  <div className='form-group'>
                    <span>Linked Sellers:</span>
                    <span>{operatorDetails.sellerIds.length} seller(s)</span>
                  </div>
                )}

                <div className="form-group">
                  <span>Business Documents</span>
                  <div className="file-uploads">
                    {operatorDetails.businessDocuments.map((doc, index) => (
                      <div className="file-preview" key={index}>
                        <a href={doc} target="_blank" rel="noopener noreferrer">
                          Document {index + 1}
                        </a>
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
                  <span>Organization Name:</span>
                  <span>{operatorDetails.orgName}</span>
                </div>
                <div className="form-group">
                  <span>Organization Contact:</span>
                  <span>{operatorDetails.contact}</span>
                </div>
                <div className="form-group">
                  <span>Organization Mail:</span>
                  <span>{operatorDetails.email}</span>
                </div>
                <div className="form-group">
                  <span>Team Size:</span>
                  <span>{operatorDetails?.dealingPersons.length || 0}</span>
                </div>
                <div className="form-group">
                  <span>Logo:</span>
                  <span>
                    <img className='opertorLogo' src={operatorDetails.logo} alt="Operator Logo" />
                  </span>
                </div>
                <div>
                  <label>Business Address</label>
                  <span>{operatorDetails.street}</span>,
                  <span>{operatorDetails.address}</span>,
                  <span>{operatorDetails.city}</span>,
                  <span>{operatorDetails.district} </span>,
                  <span>{operatorDetails.state} </span>,
                  <span>{operatorDetails.pincode}</span>
                </div>

                {operatorDetails.dealingPersons && operatorDetails.dealingPersons.length > 0 && (
                  <div className="form-group">
                    <label>Dealing Persons</label>
                    {operatorDetails?.dealingPersons
                      ?.filter((person) => person.role === "CEO")
                      .slice(0, 1)
                      .map((person, index) => (
                        <div key={index} className="dealing-person">
                          <div>
                            <strong><span>Department:</span>{person.department}</strong>
                            <br />
                            <strong><span>Designation:</span></strong> {person.role} <br />
                            <strong><span>Name:</span></strong> {person.fullName}<br />
                            <strong><span>{person.role} Contact:</span></strong> {person.contactNumber}
                            <br />
                          </div>
                          <div><img className='delingPersonPic' src={person.photoUrl} alt="Dealing Person" /></div>
                        </div>
                      ))}
                  </div>
                )}
                <div className="form-group">
                  <strong><label htmlFor="">Districts:</label></strong>
                  <span>{zone.map((dist, index) => (
                    <span key={index}>{dist}, </span>
                  ))}</span>
                </div>
              </>
            ) : (
              <p style={{ padding: '0 16px 16px', margin: 0, color: '#6B7280' }}>
                Enter operator's mobile number to fetch details.
              </p>
            )}
          </div>
        </section>

        {/* Service Selection Section */}
        <section className="service-selection">
          <h2>Service Selection *</h2>
          <div className="checkbox-group">
            <input type="checkbox" id="ready-services" name="services" />
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
            <input type="checkbox" id="order-services" name="services" />
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
            <input type="checkbox" id="open-market" name="services" />
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
            <input type="checkbox" id="agree" required />
            <label htmlFor="agree">I agree to all availing services with Terms & Conditions *</label>
          </div>
        </section>

        {/* Verification Section with Dual OTP */}
        <section className="verification">
          <h2>Verification *</h2>

          {/* Seller OTP */}
          <div className="form-group">
            <label>Seller OTP Verification *</label>
            <div className="otp-section">
              <DigitInputs
                digits={sellerOtp}
                setDigits={setSellerOtp}
                disabled={isVerifyingSellerOtp || isSellerVerified}
                isPasskey={false}
              />
              <div className="otp-actions">
                <button
                  type="button"
                  className="send-otp-btn"
                  onClick={handleSendSellerOtp}
                  disabled={isSendingSellerOtp || isSellerVerified}
                  style={{ padding: '10px', cursor: 'pointer', backgroundColor: isSellerVerified ? '#4CAF50' : '#007BFF', color: 'white', border: 'none', borderRadius: '4px' }}
                >
                  {isSendingSellerOtp ? 'Processing...' : (isSellerOtpSent ? 'Resend Request' : 'Request OTP')}
                </button>
                {isSellerOtpSent && !isSellerVerified && (
                  <button
                    type="button"
                    className="verify-otp-btn"
                    onClick={handleVerifySellerOtp}
                    disabled={sellerOtp.join('').length !== 6 || isVerifyingSellerOtp}
                    style={{ marginTop: '10px', padding: '10px', cursor: 'pointer', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}
                  >
                    {isVerifyingSellerOtp ? 'Verifying...' : 'Verify Seller'}
                  </button>
                )}
              </div>
            </div>
            {isSellerVerified && (
              <p style={{ color: 'green', fontWeight: 'bold', marginTop: '10px' }}>
                ✅ Seller verified successfully
              </p>
            )}
            <p>OTP will be sent to your registered mobile: {seller?.mobile}</p>
          </div>

          {/* Operator OTP */}
          <div className="form-group">
            <label>Operator OTP Verification *</label>
            <div className="otp-section">
              <DigitInputs
                digits={operatorOtp}
                setDigits={setOperatorOtp}
                disabled={isVerifyingOperatorOtp || isOperatorVerified || !operatorDetails}
                isPasskey={false}
              />
              <div className="otp-actions">
                <button
                  type="button"
                  className="send-otp-btn"
                  onClick={handleSendOperatorOtp}
                  disabled={isSendingOperatorOtp || isOperatorVerified || !operatorDetails}
                  style={{ padding: '10px', cursor: 'pointer', backgroundColor: isOperatorVerified ? '#4CAF50' : '#007BFF', color: 'white', border: 'none', borderRadius: '4px' }}
                >
                  {isSendingOperatorOtp ? 'Processing...' : (isOperatorOtpSent ? 'Resend Request' : 'Request OTP')}
                </button>
                {isOperatorOtpSent && !isOperatorVerified && (
                  <button
                    type="button"
                    className="verify-otp-btn"
                    onClick={handleVerifyOperatorOtp}
                    disabled={operatorOtp.join('').length !== 6 || isVerifyingOperatorOtp}
                    style={{ marginTop: '10px', padding: '10px', cursor: 'pointer', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}
                  >
                    {isVerifyingOperatorOtp ? 'Verifying...' : 'Verify Operator'}
                  </button>
                )}
              </div>
            </div>
            {isOperatorVerified && (
              <p style={{ color: 'green', fontWeight: 'bold', marginTop: '10px' }}>
                ✅ Operator verified successfully
              </p>
            )}
            <p>OTP will be sent to operator's mobile: {operatorMobile}</p>
          </div>
        </section>
      </main>
      <footer className="sticky-footer">
        <button className="draft-btn">Save Draft</button>
        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={!isSellerVerified || !isOperatorVerified}
        >
          {existingRegistration ? 'Add Operator' : 'Register Segment'}
        </button>
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