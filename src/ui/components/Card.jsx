// src/ui/components/Card.jsx
import React from 'react';

/**
 * Simple Card wrapper using existing CSS classes.
 * If you have a card container class in your CSS (e.g., 'card', 'panel'), map it here.
 */
export default function Card({ children, className = '', style = {} }) {
  const classes = ['card', className].filter(Boolean).join(' ');
  return (
    <div className={classes} style={style}>
      {children}
    </div>
  );
}
