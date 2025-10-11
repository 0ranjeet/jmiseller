// src/ui/components/SectionHeading.jsx
import React from 'react';

export default function SectionHeading({ children, className = '', style = {} }) {
  return (
    <h2 className={className} style={style}>
      {children}
    </h2>
  );
}
