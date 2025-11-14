// contexts/SellerContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { saveData, loadData, removeData } from '../utils/storage';

const SellerContext = createContext();

export const useSeller = () => {
  return useContext(SellerContext);
};

const SELLER_STORAGE_KEY = 'sellerData';

export const SellerProvider = ({ children }) => {
  const [seller, setSeller] = useState({
    sellerId: null,
    mobile: null,
    segment:null,
    registrationStatus: null,
  });
  const [loading, setLoading] = useState(true);

  // 🔁 Rehydrate seller on app start
  useEffect(() => {
    const initializeSeller = async () => {
      try {
        // Optional: migrate from localStorage (if used before)
        const legacy = localStorage.getItem(SELLER_STORAGE_KEY);
        console.log("legacy", legacy);
        if (legacy) {
          await saveData(SELLER_STORAGE_KEY, JSON.parse(legacy));
          
          localStorage.removeItem(SELLER_STORAGE_KEY);
        }

        const saved = await loadData(SELLER_STORAGE_KEY);
        if (saved) {
          setSeller(saved);
        }
      } catch (err) {
        console.error('[SellerContext] Init error:', err);
      } finally {
        setLoading(false); // ✅ critical
      }
    };

    initializeSeller();
  }, []);

  // 💾 Auto-save when seller changes
  useEffect(() => {
    if (seller?.sellerId) {
      saveData(SELLER_STORAGE_KEY, { ...seller, lastUpdated: Date.now() });
    } else {
      removeData(SELLER_STORAGE_KEY);
    }
  }, [seller]);

  const updateSeller = (sellerData) => {
    setSeller(prev => ({ ...prev, ...sellerData }));
  };

  const clearSeller = async () => {
    setSeller({
      sellerId: null,
      mobile: null,
      segment:null,
      registrationStatus: null,
    });
    await removeData(SELLER_STORAGE_KEY);
  };

  return (
    <SellerContext.Provider value={{ seller, updateSeller, clearSeller, loading }}>
      {children}
    </SellerContext.Provider>
  );
};