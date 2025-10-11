// src/ui/components/FormField.jsx
import React from 'react';

/**
 * Generic form field wrapper using existing CSS.
 * Renders label, children, and error/helper areas.
 */
export default function FormField({
  label,
  required = false,
  error,
  helperText,
  className = '',
  children,
}) {
  return (
    <div className={["form-group", className].filter(Boolean).join(' ')}>
      {label && (
        <label>
          {label} {required && <span className="required-asterisk">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <span className="error-message">{error}</span>
      ) : helperText ? (
        <small className="helper-text">{helperText}</small>
      ) : null}
    </div>
  );
}
