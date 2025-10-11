// src/utils/navigationBarManager.js
import { StatusBar } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export class NavigationBarManager {
  static async initialize() {
    if (!Capacitor.isNativePlatform()) {
      console.log('Not a native platform, skipping navigation bar management');
      return;
    }

    try {
      // Check if StatusBar is available
      if (!StatusBar) {
        console.log('StatusBar plugin not available');
        return;
      }

      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.setStyle({ style: 'DARK' });
      await StatusBar.setBackgroundColor({ color: '#B8860B' });
      
      console.log('Navigation bar initialized successfully');
    } catch (error) {
      console.error('Error initializing navigation bar:', error);
    }
  }

  static async enableFullScreen() {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
     await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.setStyle({ style: 'DARK' });
      await StatusBar.setBackgroundColor({ color: '#B8860B' });

      console.log('Full screen enabled');
    } catch (error) {
      console.error('Failed to enable full screen:', error);
    }
  }

  static async showStatusBar() {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.show();
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.setStyle({ style: 'DARK' });
      await StatusBar.setBackgroundColor({ color: '#B8860B' });
      console.log('Status bar shown');
    } catch (error) {
      console.error('Failed to show status bar:', error);
    }
  }

  static async setBackgroundColor(color) {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      await StatusBar.setBackgroundColor({ color });
      console.log('Status bar color set to:', color);
    } catch (error) {
      console.error('Failed to set status bar color:', error);
    }
  }
}