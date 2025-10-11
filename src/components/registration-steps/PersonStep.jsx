import React from 'react';
const PersonStep = React.memo(({
  dealingPersons, setDealingPersons,
  addDealingPerson, updateDealingPerson, removeDealingPerson,
  // --- Validation ---
  errors,
  setErrors
  // --- End of Validation Props ---
}) => (
  <div className="step-content">
    <h2>Person Details</h2>
    
    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
      You can add more than one contact person .
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
          <label>Full Name <span className="required-asterisk">*</span></label>
          <input
            type="text"
            placeholder="Enter full name"
            value={person.fullName}
            onChange={(e) => updateDealingPerson(index, 'fullName', e.target.value)}
            autoComplete="name"
            required
          />
           {errors[`dealingPerson_${index}_fullName`] && <span className="error-message">{errors[`dealingPerson_${index}_fullName`]}</span>}
        </div>
        <div className="form-group">
          <label>Contact Number <span className="required-asterisk">*</span></label>
          <input
            type="tel"
            placeholder="10-digit mobile number"
            value={person.contactNumber}
            onChange={(e) => updateDealingPerson(index, 'contactNumber', e.target.value)}
            autoComplete="tel"
            maxLength={10}
            required
          />
           {errors[`dealingPerson_${index}_contactNumber`] && <span className="error-message">{errors[`dealingPerson_${index}_contactNumber`]}</span>}
        </div>
        <div className="form-group">
          <label>Email Address <span className="required-asterisk">*</span></label>
          <input
            type="email"
            placeholder="person@example.com"
            value={person.email}
            onChange={(e) => updateDealingPerson(index, 'email', e.target.value)}
            autoComplete="email"
            required
          />
           {errors[`dealingPerson_${index}_email`] && <span className="error-message">{errors[`dealingPerson_${index}_email`]}</span>}
        </div>
        <div className="form-group">
          <label>Department <span className="required-asterisk">*</span></label>
          <select name="department" id="" value={person.department} onChange={(e) => updateDealingPerson(index, 'department', e.target.value)}>
            <option value="">Select department</option>
            <option value="Adminstrative">Adminstrative</option>
            <option value="Finance">Finance</option>
            <option value="Hr">Hr</option>
            <option value="R&D">R&D</option>
            <option value="Sales&Marketing">Sales & Marketing</option>
            <option value="Legal">Legal</option>
            <option value="Accounting">Accounting</option>
          </select>
         
           {errors[`dealingPerson_${index}_department`] && <span className="error-message">{errors[`dealingPerson_${index}_department`]}</span>}
        </div>
        <div className="form-group">
          <label>Designation/Role <span className="required-asterisk">*</span></label>
          <select
            value={person.role}
            onChange={(e) => updateDealingPerson(index, 'role', e.target.value)}
            required
          >
            <option value="">Select role</option>
            <option value="MangeningDirector">Mangening Director</option>
            <option value="Director">Director</option>
            <option value="Manager">Manager</option>
            <option value="CEO">CEO</option>
            <option value="CFO">CFO</option>
            <option value="COO">COO</option>
            <option value="CheifSalesExceutive">Cheif Sales Exceutive</option>
            <option value="sales-executive">Sales Executive</option>
            <option value="accountant">Accountant</option>
            <option value="Employee">Employee</option>
          </select>
           {errors[`dealingPerson_${index}_role`] && <span className="error-message">{errors[`dealingPerson_${index}_role`]}</span>}
        </div>
        <div className="form-group">
          <label>Person Photos <span className="required-asterisk">*</span></label>
          <div className="upload-area">
            <div className="upload-icon">📷</div>
            <p>Upload JPG or PNG files</p>
            <input
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={(e) => updateDealingPerson(index, 'photo', e.target.files[0])}
              style={{ display: 'none' }}
              id={`person-photo-${index}`}
              required={!person.photo} // Required if no photo uploaded for this person
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
           {errors[`dealingPerson_${index}_photo`] && <span className="error-message">{errors[`dealingPerson_${index}_photo`]}</span>}
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

export default React.memo(PersonStep);