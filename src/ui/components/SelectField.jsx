// src/ui/components/SelectField.jsx
import React from 'react';

/**
 * SelectField using existing CSS classes.
 * Wraps label + select + helper/error.
 */
export default function SelectField({
  label,
  required = false,
  error,
  helperText,
  value,
  onChange,
  name,
  children,
  disabled = false,
  className = '',
  selectClassName = '',
  ...rest
}) {
  return (
    <div className={["form-group", className].filter(Boolean).join(' ')}>
      {label && (
        <label>
          {label} {required && <span className="required-asterisk">*</span>}
        </label>
      )}
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={selectClassName}
        {...rest}
      >
        {children}
      </select>
      {error ? (
        <span className="error-message">{error}</span>
      ) : helperText ? (
        <small className="helper-text">{helperText}</small>
      ) : null}
    </div>
  );
}
