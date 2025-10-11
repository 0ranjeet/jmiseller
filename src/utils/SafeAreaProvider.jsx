// EnhancedSafeAreaProvider.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { StatusBar } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { NavigationBarManager } from './NavigationBarManager';

const SafeAreaContext = createContext({
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  isNavigationBarHidden: false
});

export const useSafeArea = () => useContext(SafeAreaContext);

export const SafeAreaProvider = ({ children }) => {
  const [state, setState] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    isNavigationBarHidden: false
  });

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      setupSafeArea();
    }
  }, []);

  const setupSafeArea = async () => {
    try {
      // Disable navigation bar first
      await NavigationBarManager.disableNavigationBar();
      
      const info = await StatusBar.getInfo();
      const platform = Capacitor.getPlatform();
      
      let topInset = info.visible ? (platform === 'android' ? 24 : 44) : 0;
      let bottomInset = platform === 'android' ? 56 : 34;
      
      // Update CSS custom properties
      document.documentElement.style.setProperty('--safe-area-top', `${topInset}px`);
      document.documentElement.style.setProperty('--safe-area-bottom', `${bottomInset}px`);
      
      setState({
        top: topInset,
        bottom: bottomInset,
        left: 0,
        right: 0,
        isNavigationBarHidden: true
      });
      
    } catch (error) {
      console.log('Safe area setup failed:', error);
    }
  };

  return (
    <SafeAreaContext.Provider value={state}>
      {children}
    </SafeAreaContext.Provider>
  );
};