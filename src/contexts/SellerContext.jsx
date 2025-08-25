// contexts/SellerContext.js
import React, { createContext, useContext, useState } from 'react';

const SellerContext = createContext();

export const useSeller = () => {
  return useContext(SellerContext);
};

export const SellerProvider = ({ children }) => {
  const [seller, setSeller] = useState({
    sellerId: null,
    mobile: null,
  });

  const updateSeller = (sellerData) => {
    setSeller(prev => ({ ...prev, ...sellerData }));
  };

  const clearSeller = () => {
    setSeller({
      sellerId: null,
      mobile: null,
      registrationStatus: null
    });
  };

  const value = {
    seller,
    updateSeller,
    clearSeller
  };

  return (
    <SellerContext.Provider value={value}>
      {children}
    </SellerContext.Provider>
  );
};