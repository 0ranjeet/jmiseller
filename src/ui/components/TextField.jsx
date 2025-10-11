// src/ui/components/TextField.jsx
import React from 'react';

/**
 * TextField using existing CSS classes.
 * Wraps label + input + helper/error.
 */
export default function TextField({
  label,
  required = false,
  error,
  helperText,
  type = 'text',
  value,
  onChange,
  name,
  placeholder,
  disabled = false,
  className = '',
  inputClassName = '',
  ...rest
}) {
  return (
    <div className={["form-group", className].filter(Boolean).join(' ')}>
      {label && (
        <label>
          {label} {required && <span className="required-asterisk">*</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClassName}
        {...rest}
      />
      {error ? (
        <span className="error-message">{error}</span>
      ) : helperText ? (
        <small className="helper-text">{helperText}</small>
      ) : null}
    </div>
  );
}
