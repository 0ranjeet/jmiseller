import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useGeoLocation } from '../../hooks/useGeoLocation';
import Button from '../../ui/components/Button';
import FormField from '../../ui/components/FormField';
import SectionHeading from '../../ui/components/SectionHeading';
import StatenDistrict from './StatenDistrict';

const toKebabCase = (str) =>
  str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9-]/g, '');

const normalizeDistrict = (str) => str.trim();

const ContactStep = ({
  transactionalMobile, setTransactionalMobile,
  transactionalEmail, setTransactionalEmail,
  shopNumber, setShopNumber,
  buildingName, setBuildingName,
  streetAddress, setStreetAddress,
  contactCity, setContactCity,
  contactDistrict, setContactDistrict, // This is the correct prop
  contactState, setContactState,
  contactPinCode, setContactPinCode,
  shippingLatitude, shippingLongitude,
  setShippingLatitude, setShippingLongitude,
  errors, setErrors
}) => {
  const [districtSuggestions, setDistrictSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [geoStatus, setGeoStatus] = useState('Geo Locate');
  const [geoError, setGeoError] = useState('');
  const { getCurrentPosition } = useGeoLocation();

  const stateOptions = useMemo(() => {
    return StatenDistrict.states.map((item) => ({
      label: item.state,
      value: toKebabCase(item.state),
      districts: item.districts.map(normalizeDistrict),
    }));
  }, []);

  const flatDistricts = useMemo(() => {
    return StatenDistrict.states.flatMap((item) =>
      item.districts.map((d) => ({
        district: normalizeDistrict(d),
        state: item.state,
        stateValue: toKebabCase(item.state),
      }))
    );
  }, []);

  // Find selected state's district list
  const selectedStateData = useMemo(() => {
    return stateOptions.find((s) => s.value === contactState);
  }, [contactState, stateOptions]);

  // Auto-clear district if it's not in the new state's list
  useEffect(() => {
    if (selectedStateData && contactDistrict) {
      const isValidDistrict = selectedStateData.districts.includes(contactDistrict);
      if (!isValidDistrict) {
        setContactDistrict(''); // Reset district if invalid
      }
    }
  }, [contactState, selectedStateData, contactDistrict, setContactDistrict]);

  const handleDistrictChange = (e) => {
    const value = e.target.value;
    setContactDistrict(value); // This should update contactDistrict

    if (value.length > 0) {
      const filtered = flatDistricts.filter((d) =>
        d.district.toLowerCase().includes(value.toLowerCase())
      );
      setDistrictSuggestions(filtered.slice(0, 3));
      setShowSuggestions(true);
    } else {
      setDistrictSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleDistrictSelect = (district, state) => {
    setContactDistrict(district);
    setContactState(toKebabCase(state));
    setDistrictSuggestions([]);
    setShowSuggestions(false);
  };

  const handleDistrictBlur = () => {
    // Delay hiding suggestions to allow click event to fire
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleDistrictFocus = () => {
    if (contactDistrict.length > 0 && districtSuggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleGeoLocate = useCallback(async () => {
    setGeoStatus('Getting Location...');
    setGeoError('');

    const result = await getCurrentPosition();

    if (result.error) {
      setGeoStatus('Error');
      setGeoError(result.error);
      setShippingLatitude(null);
      setShippingLongitude(null);
      setErrors(prev => ({ ...prev, shippingCoordinates: result.error }));
    } else {
      setShippingLatitude(result.latitude);
      setShippingLongitude(result.longitude);
      setGeoStatus('Location Found');
    }
  }, [setShippingLatitude, setShippingLongitude, setErrors, getCurrentPosition]);

  const displayCoordinates =
    shippingLatitude !== null && shippingLongitude !== null
      ? `Lat: ${shippingLatitude.toFixed(6)}, Lng: ${shippingLongitude.toFixed(6)}`
      : 'Location not found';

  return (
    <div className="step-content">
      <SectionHeading>Transactional Contact</SectionHeading>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="Mobile">Mobile <span className="required-asterisk">*</span></label>
          <input
            id="Mobile"
            required
            type="tel"
            pattern="[0-9]{10}"
            maxLength={10}
            placeholder="10-digit mobile number"
            value={transactionalMobile}
            onChange={(e) => setTransactionalMobile(e.target.value)}
            error={errors.transactionalMobile}
          />
        </div>
        <div className="form-group">
          <label htmlFor="Email">Email <span className="required-asterisk">*</span></label>
          <input
            id="Email"
            required
            type="email"
            placeholder="business@example.com"
            value={transactionalEmail}
            onChange={(e) => setTransactionalEmail(e.target.value)}
            autoComplete="email"
            error={errors.transactionalEmail}
          />
        </div>
      </div>
      <SectionHeading style={{ marginTop: '40px' }}>Shipping Address</SectionHeading>

      <FormField label="Get Location" error={errors.shippingCoordinates}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="text"
            value={
              geoStatus === 'Getting Location...'
                ? 'Getting Location...'
                : geoStatus === 'Error'
                  ? `Error: ${geoError}`
                  : displayCoordinates
            }
            readOnly
            disabled
            required
            style={{ flex: 1, backgroundColor: '#f5f5f5' }}
          />
          <Button
            variant="secondary"
            onClick={handleGeoLocate}
            disabled={geoStatus === 'Getting Location...'}
          >
            {geoStatus === 'Getting Location...' ? '...' : 'Geo Locate'}
          </Button>
        </div>
      </FormField>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="shopNumber">Shop Number / Flat Number</label>
          <input
            id="shopNumber"
            required
            value={shopNumber}
            onChange={(e) => setShopNumber(e.target.value)}
            error={errors.shopNumber}
          />
        </div>
        <div className="form-group">
          <label htmlFor="buildingName">Building / Complex Name</label>
          <input
            id="buildingName"
            required
            value={buildingName}
            onChange={(e) => setBuildingName(e.target.value)}
            error={errors.buildingName}
          />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="streetAddress">Street Address</label>
          <input
            id="streetAddress"
            required
            value={streetAddress}
            onChange={(e) => setStreetAddress(e.target.value)}
            error={errors.streetAddress}
          />
        </div>
        <div className="form-group">
          <label htmlFor="contactCity">City / Village</label>
          <input
            id="contactCity"
            required
            value={contactCity}
            onChange={(e) => setContactCity(e.target.value)}
            error={errors.contactCity}
          />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group" style={{ position: 'relative' }}>
          <label htmlFor="contactDistrict">District <span className="required-asterisk">*</span></label>
          <input
            id="contactDistrict"
            type="text"
            placeholder="Type district name"
            value={contactDistrict}
            onChange={handleDistrictChange}
            onFocus={handleDistrictFocus}
            onBlur={handleDistrictBlur}
            autoComplete="off"
            required
          />
          {showSuggestions && districtSuggestions.length > 0 && (
            <ul
              className="suggestions-dropdown"
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                listStyle: 'none',
                padding: 0,
                margin: '4px 0 0',
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: 'white',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                maxHeight: '150px',
                overflowY: 'auto',
                zIndex: 10,
              }}
            >
              {districtSuggestions.map((sug, index) => (
                <li
                  key={`${sug.district}-${sug.stateValue}`}
                  onClick={() => handleDistrictSelect(sug.district, sug.state)}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderBottom: index < districtSuggestions.length - 1 ? '1px solid #eee' : 'none',
                  }}
                  onMouseOver={(e) => (e.target.style.backgroundColor = '#f5f5f5')}
                  onMouseOut={(e) => (e.target.style.backgroundColor = 'white')}
                >
                  {sug.district} <small style={{ color: '#666' }}>({sug.state})</small>
                </li>
              ))}
            </ul>
          )}
          {errors.district && <span className="error-message">{errors.district}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="contactState">State <span className="required-asterisk">*</span></label>
          <select
            id="contactState"
            value={contactState}
            onChange={(e) => setContactState(e.target.value)}
            required
          >
            <option value="">Select State</option>
            {stateOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          {errors.state && <span className="error-message">{errors.state}</span>}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="contactPinCode">Pincode <span className="required-asterisk">*</span></label>
        <input
          id="contactPinCode"
          required
          maxLength={6}
          value={contactPinCode}
          onChange={(e) => setContactPinCode(e.target.value)}
          error={errors.contactPinCode}
        />
      </div>
    </div>
  );
};

export default React.memo(ContactStep);