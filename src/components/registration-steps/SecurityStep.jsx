import React, { useState, useCallback, useRef } from 'react';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import bcrypt from "bcryptjs";
// NOTE: Assuming you have 'db' and other services correctly set up in this path
import { db } from '../../services/firebase';

// Constants
const OTP_EXPIRY_MINUTES = 10;
const USE_CASE = "JMI_OFFICER_VERIFICATION";

// --- Reusable 6-Digit Input Component (DigitInputs) ---
const DigitInputs = React.memo(({ digits, setDigits, disabled = false, isPasskey = false }) => {
  const refs = useRef([]);
  // Determines if the input shows characters (text) or dots (password)
  const inputType = isPasskey ? "password" : "text";

  const handleChange = (index, value) => {
    // Allows only one numeric digit
    const numericValue = value.replace(/\D/g, '').slice(0, 1);
    // Prevents non-numeric input from clearing the box
    if (numericValue.length === 0 && value.length > 0) return;

    const newDigits = [...digits];
    newDigits[index] = numericValue;
    setDigits(newDigits);

    // Auto-focus to the next input only if a digit was entered
    if (numericValue && index < 5 && refs.current[index + 1]) {
      refs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace: moves back and clears the previous box if current is empty
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
          // --- Reapplied consistent UI style ---
          style={{ width: '50px', height: '50px', textAlign: 'center', fontSize: '18px', border: '1px solid #ccc', borderRadius: '4px' }}
          // -------------------------------------
        />
      ))}
    </div>
  );
});

// Since DigitInputs is a reusable sub-component, it's good practice to export it.
export { DigitInputs }; 

// --- Main SecurityStep Component ---
const SecurityStep = React.memo(({
  jmiOfficerID,
  setJmiOfficerID,
  // IMPORTANT: These MUST be 6-element arrays in the parent component: useState(['', '', '', '', '', ''])
  privatePasskey,
  setPrivatePasskey,
  confirmPasskey,
  setConfirmPasskey,
  errors,
  setErrors,
}) => {
  const [officerOtp, setOfficerOtp] = useState(['', '', '', '', '', '']);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOfficerVerified, setIsOfficerVerified] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Safely join the array digits into strings for validation and API calls
  const fullOtp = officerOtp.join('');
  const fullPrivatePasskey = Array.isArray(privatePasskey) ? privatePasskey.join('') : '';
  const fullConfirmPasskey = Array.isArray(confirmPasskey) ? confirmPasskey.join('') : '';

  const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // --- OTP SEND/GENERATE LOGIC ---
  const handleSendOtp = useCallback(async () => {
    // Basic validation on the ID
    if (jmiOfficerID.length !== 10 || isNaN(jmiOfficerID)) {
      alert("Enter a valid 10-digit JMI Officer ID.");
      return;
    }

    setIsSending(true);

    try {
      const plainOtp = generateOtp();
      // Using bcrypt for hashing the OTP before storing it is good practice
      const hashedOtp = await bcrypt.hash(plainOtp, 10);
      const otpId = `+91${jmiOfficerID}_${USE_CASE}`;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);
      const readableMessage = `Your JMI Officer verification OTP is: ${plainOtp}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`;

      // Simulating a Firestore write to store the OTP
      await setDoc(doc(db, "otps", otpId), {
        mobile: jmiOfficerID,
        otp: hashedOtp,
        plaintextOtp: plainOtp,
        message: readableMessage,
        sentByAdmin: false,
        useCase: USE_CASE,
        status: "pending",
        createdAt: now,
        expiresAt,
      });

      console.log(`[DEV] OTP generated for ${jmiOfficerID}: ${plainOtp}`);

      setIsOtpSent(true);
      // Clear the input fields for the user to enter the new OTP
      setOfficerOtp(['', '', '', '', '', '']);
      alert(`✅ OTP request processed for JMI Officer ID ${jmiOfficerID}. Ask support to send it via WhatsApp/SMS.`);
    } catch (error) {
      console.error("Error generating OTP:", error);
      alert("Failed to generate OTP. Please try again.");
    } finally {
      setIsSending(false);
    }
  }, [jmiOfficerID]);
  
  // --- OTP VERIFY LOGIC ---
  const handleVerifyOtp = useCallback(async () => {
    if (fullOtp.length !== 6 || isNaN(fullOtp)) {
      alert("Please enter the complete 6-digit OTP.");
      return;
    }

    setIsVerifying(true);

    try {
      const otpId = `+91${jmiOfficerID}_${USE_CASE}`;
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
        setIsOtpSent(false);
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
      setIsOfficerVerified(true);
      alert("🎉 JMI Officer verified successfully!");
    } catch (error) {
      console.error("Verification error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  }, [fullOtp, jmiOfficerID]);

  // --- PASSKEY VALIDATION LOGIC (Effect) ---
  React.useEffect(() => {
    const p1 = fullPrivatePasskey;
    const p2 = fullConfirmPasskey;
    console.log(p1, p2);
    let newErrors = {};

    

    // Validation for Private Passkey length
    if (p1.length > 0 && p1.length < 6) {
      newErrors.privatePasskey = 'Passkey must be exactly 6 digits.';
    }

    // Validation for Confirm Passkey length
    if (p2.length > 0 && p2.length < 6) {
      newErrors.confirmPasskey = 'Passkey must be exactly 6 digits.';
    }

    // Check for match only if both are full length (6 digits)
    if (p1.length === 6 && p2.length === 6) {
      if (p1 !== p2) {
        newErrors.passkeysMatch = 'Passkeys do not match.';
      }
    }
    
    
  }, [fullPrivatePasskey, fullConfirmPasskey, setErrors]);


  // --- COMPONENT RENDER ---
  return (
    <div className="step-content">
      {/* JMI Officer ID & OTP Section */}
      <div className="security-section">
        <h3>Verify JMI Officer</h3>
        <div className="form-group">
          <label>JMI Officer ID <span className="required-asterisk">*</span></label>
          <div className="otp-section" style={{ gap: '10px' }}>
            <input
              type="text"
              placeholder="Enter 10-digit ID"
              value={jmiOfficerID}
              onChange={(e) => {
                // Ensure only digits up to 10 characters are accepted
                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                
                // Reset verification state if ID changes
                if (value !== jmiOfficerID) {
                  setIsOtpSent(false);
                  setIsOfficerVerified(false);
                  setOfficerOtp(['', '', '', '', '', '']);
                }
                
                setJmiOfficerID(value);
              }}
              maxLength={10}
              inputMode="numeric"
              disabled={isOfficerVerified || isSending}
              style={{ flexGrow: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <button
              type="button"
              className="send-otp-btn"
              onClick={handleSendOtp}
              disabled={jmiOfficerID.length !== 10 || isSending || isOfficerVerified}
              style={{ padding: '10px', cursor: 'pointer', backgroundColor: isOfficerVerified ? '#4CAF50' : '#007BFF', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              {isSending ? 'Processing...' : (isOtpSent ? 'Resend Request' : 'Request OTP')}
            </button>
          </div>
        </div>

        {isOtpSent && !isOfficerVerified && (
          <div className="otp-verification-block" style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
            <div className="form-group">
              <label>Enter OTP (6-digits) <span className="required-asterisk">*</span></label>
              <DigitInputs
                digits={officerOtp}
                setDigits={setOfficerOtp}
                disabled={isVerifying}
                isPasskey={false} // Use standard text input for OTP
              />
              <button
                type="button"
                className="submit-btn"
                onClick={handleVerifyOtp}
                disabled={fullOtp.length !== 6 || isVerifying}
                style={{ marginTop: '15px', width: '100%', padding: '10px', cursor: 'pointer', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                {isVerifying ? 'Verifying...' : 'Verify Officer'}
              </button>
            </div>
          </div>
        )}

        {isOfficerVerified && (
          <p style={{ color: 'green', fontWeight: 'bold', marginTop: '10px', textAlign: 'center' }}>
            ✅ JMI Officer Verified.
          </p>
        )}
      </div>

      {/* Private Passkey Section - Now using 6-Digit Input UI */}
      <div
        className="security-section"
        style={{
          opacity: isOfficerVerified ? 1 : 0.5,
          pointerEvents: isOfficerVerified ? 'auto' : 'none',
          marginTop: '24px'
        }}
      >
        <h3>Set Private Passkey</h3>
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label>Private Passkey (6-digits) <span className="required-asterisk">*</span></label>
          <DigitInputs
            digits={privatePasskey}
            setDigits={setPrivatePasskey}
            disabled={!isOfficerVerified}
            isPasskey={true} // Passkey: password input type (dots)
          />
          {errors.privatePasskey && <span className="error-message" style={{ color: 'red', fontSize: '12px' }}>{errors.privatePasskey}</span>}
        </div>

        <div className="form-group">
          <label>Re-enter Private Passkey <span className="required-asterisk">*</span></label>
          <DigitInputs
            digits={confirmPasskey}
            setDigits={setConfirmPasskey}
            disabled={!isOfficerVerified}
            isPasskey={true} // Passkey: password input type (dots)
          />
          {errors.confirmPasskey && <span className="error-message" style={{ color: 'red', fontSize: '12px' }}>{errors.confirmPasskey}</span>}
          {errors.passkeysMatch && <span className="error-message" style={{ color: 'red', fontSize: '12px' }}>{errors.passkeysMatch}</span>}
        </div>
      </div>
    </div>
  );
});

export default SecurityStep;
