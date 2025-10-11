import React, { useEffect, useState } from 'react';

const BankStep = React.memo(({
  bankName, // Kept to display the value from the parent state
  setBankName, // Kept to update the parent state from the API
  ifscCode,
  setIfscCode,
  accountType,
  setAccountType,
  accountHolderName,
  setAccountHolderName,
  accountNumber,
  setAccountNumber,
  confirmAccountNumber,
  setConfirmAccountNumber,
  errors,
  setErrors
}) => {
  const [branchDetails, setBranchDetails] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    const trimmed = ifscCode.trim().toUpperCase();

    // Clear if empty
    if (!trimmed) {
      setBankName(''); // Clear parent state
      setBranchDetails(null);
      return;
    }

    // Validate IFSC format: 4 letters + 7 alphanumeric (total 11 chars)
    if (!/^[A-Z]{4}[0-9A-Z]{7}$/.test(trimmed)) {
      setBankName(''); // Clear parent state
      setBranchDetails(null);
      return;
    }

    // Fetch from Razorpay IFSC API
    const fetchIfscDetails = async () => {
      setIsFetching(true);
      setBranchDetails(null);
      setBankName(''); // Clear state before fetch

      try {
        const response = await fetch(`https://ifsc.razorpay.com/${trimmed}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.BANK || !data.BRANCH) {
          throw new Error('Incomplete bank data');
        }

        // --- CHANGE HERE: Use the full bank name from API for display ---
        setBankName(data.BANK); // Set the full bank name in the parent state
        setBranchDetails(data);
      } catch (err) {
        console.warn('IFSC lookup failed:', err.message || err);
        setBankName('');
        setBranchDetails(null);
      } finally {
        setIsFetching(false);
      }
    };

    // Debounce: delay fetch by 300ms to avoid excessive requests while typing
    const handler = setTimeout(fetchIfscDetails, 300);
    return () => clearTimeout(handler);
    // Dependency array includes ifscCode and setBankName (from props)
  }, [ifscCode, setBankName]); 

  return (
    <div className="step-content">
      <h2>Organization Bank Details</h2>

      {/* IFSC Input */}
      <div className="form-group">
        <label className="required">
          IFSC Code <span className="required-asterisk">*</span>
        </label>
        <input
          type="text"
          placeholder="e.g. SBIN0001234"
          value={ifscCode}
          onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
          autoComplete="off"
          required
        />
        <small>Format: 4 letters followed by 7 alphanumeric characters</small>
        {errors.ifscCode && <span className="error-message">{errors.ifscCode}</span>}
      </div>

      {/* AUTO-FILLED Bank Name (Read-Only) */}
      <div className="form-group">
        <label className="required">
          Bank Name <span className="required-asterisk">*</span>
        </label>
        {isFetching ? (
          <p style={{ fontStyle: 'italic', color: '#555' }}>Fetching bank details...</p>
        ) : (
          <p style={{ fontWeight: 'bold', minHeight: '1.2em' }}>
            {bankName || (ifscCode.trim() ? 'Bank not found or IFSC is invalid.' : 'Enter IFSC code above.')}
          </p>
        )}
        {errors.bankName && <span className="error-message">{errors.bankName}</span>}
      </div>
      {/* The Bank Name Dropdown is now REMOVED */}

      {/* Show branch info if available */}
      {branchDetails && (
        <div className="form-group info-box" style={{ background: '#f0f4ff', padding: '12px', borderRadius: '4px', borderLeft: '3px solid #007bff' }}>
          <p><b>Branch:</b> {branchDetails.BRANCH}</p>
          <p><b>Address:</b> {branchDetails.ADDRESS}, {branchDetails.CITY}, {branchDetails.DISTRICT}, {branchDetails.STATE}</p>
        </div>
      )}

      {/* Rest of the form */}
      <div className="form-group">
        <label className="required">Account Type <span className="required-asterisk">*</span></label>
        <select value={accountType} onChange={(e) => setAccountType(e.target.value)} required>
          <option value="">Select account type</option>
          <option value="savings">Savings Account</option>
          <option value="current">Current Account</option>
          <option value="cc">Cash Credit</option>
          <option value="od">Overdraft</option>
        </select>
        {errors.accountType && <span className="error-message">{errors.accountType}</span>}
      </div>

      <div className="form-group">
        <label className="required">Account Holder Name <span className="required-asterisk">*</span></label>
        <input
          type="text"
          placeholder="Account holder name"
          value={accountHolderName}
          onChange={(e) => setAccountHolderName(e.target.value)}
          autoComplete="name"
          required
        />
        {errors.accountHolderName && <span className="error-message">{errors.accountHolderName}</span>}
      </div>

      <div className="form-group">
        <label className="required">Account Number <span className="required-asterisk">*</span></label>
        <input
          type="password"
          placeholder="Account number"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          autoComplete="off"
          required
        />
        {errors.accountNumber && <span className="error-message">{errors.accountNumber}</span>}
      </div>

      <div className="form-group">
        <label className="required">Confirm Account Number <span className="required-asterisk">*</span></label>
        <input
          type="text"
          placeholder="Re-enter account number"
          value={confirmAccountNumber}
          onChange={(e) => setConfirmAccountNumber(e.target.value)}
          autoComplete="off"
          required
        />
        {errors.confirmAccountNumber && <span className="error-message">{errors.confirmAccountNumber}</span>}
        {errors.accountNumbersMatch && <span className="error-message">{errors.accountNumbersMatch}</span>}
      </div>
    </div>
  );
});

export default BankStep;