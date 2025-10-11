// src/utils/capacitorUtils.ts
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';
import { AndroidNavigationBar } from './AndroidNavigationBar';

export class CapacitorUtils {
  static async initializeSafeArea() {
    if (!Capacitor.isNativePlatform()) {
      console.log('Not a native platform, skipping safe area initialization');
      this.setupWebFallback();
      return;
    }
    
    try {
      const platform = Capacitor.getPlatform();
      console.log('Initializing for platform:', platform);

      // Initialize Status Bar
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#B8860B' });
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.show();

      // Hide Android Navigation Bar
      if (platform === 'android') {
        await AndroidNavigationBar.hide();
        
        // Optional: Set navigation bar color if keeping it visible
        // await AndroidNavigationBar.setNavigationBarColor('#000000', true);
      }

      // Configure Keyboard
      await Keyboard.setAccessoryBarVisible({ isVisible: false });
      
      console.log('UI initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize UI:', error);
      this.setupWebFallback();
    }
  }

  static async enableFullScreen() {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      // Hide status bar
      await StatusBar.hide();
      await StatusBar.setOverlaysWebView({ overlay: true });
      
      // Hide Android navigation bar
      if (Capacitor.getPlatform() === 'android') {
        await AndroidNavigationBar.hide();
      }
      
    } catch (error) {
      console.error('Failed to enable full screen:', error);
    }
  }

  static async exitFullScreen() {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      // Show status bar
      await StatusBar.show();
      await StatusBar.setOverlaysWebView({ overlay: false });
      
      // Show Android navigation bar
      if (Capacitor.getPlatform() === 'android') {
        await AndroidNavigationBar.show();
      }
      
    } catch (error) {
      console.error('Failed to exit full screen:', error);
    }
  }

  static setupWebFallback() {
    // CSS fallback for web and when native fails
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --safe-area-top: env(safe-area-inset-top, 24px);
        --safe-area-bottom: env(safe-area-inset-bottom, 0px);
        --safe-area-left: env(safe-area-inset-left, 0px);
        --safe-area-right: env(safe-area-inset-right, 0px);
      }
      
      body {
        margin: 0;
        padding: 0;
        height: 100vh;
        height: calc(100vh - var(--safe-area-bottom));
        overflow: hidden;
      }
      
      #root {
        height: 100%;
        width: 100%;
      }
      
      /* Simulate hidden navigation bar */
      .no-navigation-bar {
        padding-bottom: 0 !important;
        margin-bottom: 0 !important;
      }
    `;
    document.head.appendChild(style);
    document.body.classList.add('no-navigation-bar');
  }
}