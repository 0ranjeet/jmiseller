// src/ui/components/Button.jsx
import React from 'react';

/**
 * Button component that maps to existing CSS classes.
 *
 * Props:
 * - variant: 'primary' | 'secondary' | 'danger' | 'link'
 * - size: 'sm' | 'md' | 'lg'
 * - block: boolean -> adds 'btn-block'
 * - disabled: boolean
 * - className: string
 * - children, onClick, type, ...rest
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  disabled = false,
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  const classes = [
    'btn',
    variant && `btn-${variant}`,
    size && size !== 'md' ? `btn-${size}` : '',
    block ? 'btn-block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}
