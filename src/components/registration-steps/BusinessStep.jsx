import React from 'react';

const BusinessStep = ({
  gstrStatus, setGstrStatus, gstinNumber, setGstinNumber,
  businessDocuments, setBusinessDocuments,
  organizationPhotos, setOrganizationPhotos,
  organizationName, setOrganizationName,
  organizationContact, setOrganizationContact,
  organizationEmail, setOrganizationEmail,
  // --- New Props ---
  businessType, setBusinessType, // Replaces businessTypes array
  teamSize, setTeamSize, // New field
  storeLogo, setStoreLogo,
  removeBusinessDocument,
  removeOrganizationPhoto,
  // --- Validation ---
  errors,
  setErrors
  // --- End of Validation Props ---
}) => {


  return (
    <div className="step-content">
      <h2>Organisation Information</h2>
      <div className="form-group">
        <label>GSTR Status <span className="required-asterisk">*</span></label>
        <div className="Registration-radio-group">
          <label className={`radio-option ${gstrStatus === 'registered' ? 'active' : ''}`}>
            <input
              type="radio"
              value="registered"
              name="gstrStatus"
              checked={gstrStatus === 'registered'}
              onChange={(e) => setGstrStatus(e.target.value)}
              required
            />
            Registered
          </label>
          <label className={`radio-option ${gstrStatus === 'non-registered' ? 'active' : ''}`}>
            <input
              type="radio"
              value="non-registered"
              name="gstrStatus"
              checked={gstrStatus === 'non-registered'}
              onChange={(e) => setGstrStatus(e.target.value)}
            />
            Non-Registered
          </label>
        </div>
        {errors.gstrStatus && <span className="error-message">{errors.gstrStatus}</span>}
      </div>
      <div className="form-group">
        <label>{gstrStatus === 'non-registered' ? 'Pan Number' : 'GSTIN Number'} <span className="required-asterisk">*</span></label>
        <input
          type="text"
          className='Registration-radio'
          placeholder={gstrStatus === 'non-registered' ? "e.g. ABCDE1234F" : "e.g. 22AAAAA0000A1Z5"}
          value={gstinNumber}
          onChange={(e) => {
            let value = e.target.value.toUpperCase();

            // Remove any non-alphanumeric characters
            value = value.replace(/[^A-Z0-9]/g, '');

            // Set max length based on GSTR status
            const maxLength = gstrStatus === 'non-registered' ? 10 : 15;
            value = value.slice(0, maxLength);

            setGstinNumber(value);
          }}
          autoComplete="off"
          required={gstrStatus === 'registered' || gstrStatus === 'non-registered'}
          maxLength={gstrStatus === 'non-registered' ? 10 : 15}
          pattern={gstrStatus === 'non-registered' ? "[A-Z]{5}[0-9]{4}[A-Z]{1}" : "[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}"}
          title={
            gstrStatus === 'non-registered'
              ? "PAN must be 10 characters (5 letters + 4 numbers + 1 letter)"
              : "GSTIN must be 15 characters (2 numbers + 5 letters + 4 numbers + 1 letter + 1 character + Z + 1 character)"
          }
        />
        <small>{gstrStatus === 'non-registered' ? "Format: ABCDE1234F" : "Format: 22AAAAA0000A1Z5"}</small>
        {errors.gstinNumber && <span className="error-message">{errors.gstinNumber}</span>}
      </div>
      <div className="form-group">
        <label>Business Documents <span className="required-asterisk">*</span></label>
        <div className="upload-area">
          <div className="upload-icon">📄</div>
          <p>Upload GST Certificate,BIS License</p>
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setBusinessDocuments(Array.from(e.target.files))}
            style={{ display: 'none' }}
            required={businessDocuments.length === 0} // Required if no files uploaded
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
        {errors.businessDocuments && <span className="error-message">{errors.businessDocuments}</span>}
      </div>
      <div className="form-group">
        <label>Organization Photos <span className="required-asterisk">*</span></label>
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
            required={organizationPhotos.length === 0} // Required if no photos uploaded
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
        {errors.organizationPhotos && <span className="error-message">{errors.organizationPhotos}</span>}
      </div>
      <div className="form-group">
        <label>Organization Name <span className="required-asterisk">*</span></label>
        <input
          type="text"
          placeholder="Enter business name"
          value={organizationName}
          onChange={(e) => setOrganizationName(e.target.value)}
          autoComplete="organization"
          required
        />
        {errors.organizationName && <span className="error-message">{errors.organizationName}</span>}
      </div>

      <div className="form-group">
        <label>Organization Contact <span className="required-asterisk">*</span></label>
        <input
          type="tel"
          placeholder="10-digit mobile number"
          value={organizationContact}
          onChange={(e) => setOrganizationContact(e.target.value)}
          autoComplete="tel"
          maxLength={10}
          required
        />
        {errors.organizationContact && <span className="error-message">{errors.organizationContact}</span>}
      </div>
      <div className="form-group">
        <label>Organization Email <span className="required-asterisk">*</span></label>
        <input
          type="email"
          placeholder="business@example.com"
          value={organizationEmail}
          onChange={(e) => {
            const value = e.target.value;
            setOrganizationEmail(value);
          }}
          autoComplete="email"
          required
        />
        {errors.organizationEmail && <span className="error-message">{errors.organizationEmail}</span>}
      </div>
      {/* --- New Business Type Dropdown --- */}
      <div className="form-group">
        <label>Business Type <span className="required-asterisk">*</span></label>
        <select
          value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          required
        >
         <option value="">Select Business Type</option>
        <option value="karigar">Karigar</option>
        <option value="super_stockist">Super Stockist</option>
        <option value="c_and_f">C&F</option>
        <option value="Manufacturer">Manfacturer</option>
        <option value="wholesaler">WholeSeller</option>
        <option value="broker">Broker</option>
        <option value="corporate_b2b">Coporate B2B</option>
        <option value="corporate_D2b">Coporate D2B</option>
       </select>
        {errors.businessType && <span className="error-message">{errors.businessType}</span>}
      </div>
      {/* --- End of New Business Type Dropdown ---*/}

      {/* --- New Team Size Input --- */}
      <div className="form-group">
        <label>Team Size <span className="required-asterisk">*</span></label>
        <input
          type="number"
          placeholder="Enter team size"
          value={teamSize}
          onChange={(e) => setTeamSize(e.target.value)}
          min="0" // Optional: Set minimum value
          required
        />
        {errors.teamSize && <span className="error-message">{errors.teamSize}</span>}
      </div>
      {/* --- End of New Team Size Input ---*/}

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
  );
};

export default React.memo(BusinessStep);