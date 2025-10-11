// src/utils/androidNavigationBar.ts
import { Capacitor } from '@capacitor/core';

export class AndroidNavigationBar {
  static async hide() {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
      return;
    }

    try {
      // Method 1: Use immersive mode plugin if available
      if (window.ImmersiveMode) {
        await window.ImmersiveMode.enterImmersiveMode();
        return true;
      }

      // Method 2: Use Capacitor bridge to call native code
      if (Capacitor.isPluginAvailable('ImmersiveMode')) {
        const { ImmersiveMode } = await import('capacitor-immersive-mode');
        await ImmersiveMode.enterImmersiveMode();
        return true;
      }

      // Method 3: Fallback to JavaScript/CSS approach
      this.fallbackHide();
      return false;

    } catch (error) {
      console.error('Failed to hide navigation bar:', error);
      this.fallbackHide();
      return false;
    }
  }

  static async show() {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
      return;
    }

    try {
      if (window.ImmersiveMode) {
        await window.ImmersiveMode.exitImmersiveMode();
      } else if (Capacitor.isPluginAvailable('ImmersiveMode')) {
        const { ImmersiveMode } = await import('capacitor-immersive-mode');
        await ImmersiveMode.exitImmersiveMode();
      } else {
        this.fallbackShow();
      }
    } catch (error) {
      console.error('Failed to show navigation bar:', error);
      this.fallbackShow();
    }
  }

  static fallbackHide() {
    // CSS/JavaScript fallback for hiding navigation bar
    const style = document.createElement('style');
    style.id = 'android-navbar-hide';
    style.textContent = `
      html, body, #root {
        height: 100vh !important;
        height: calc(100vh + 1px) !important;
        overflow: hidden !important;
      }
      
      body {
        padding-bottom: env(safe-area-inset-bottom) !important;
        margin: 0 !important;
      }
      
      /* Force full viewport */
      .full-viewport {
        height: 100vh !important;
        min-height: 100vh !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
      }
    `;
    
    document.head.appendChild(style);
    document.documentElement.classList.add('full-viewport');
    
    // Scroll trick to hide navigation bar
    window.scrollTo(0, 1);
    setTimeout(() => window.scrollTo(0, 0), 100);
  }

    static fallbackShow() {
    // Remove the hiding styles
    const style = document.getElementById('android-navbar-hide');
    if (style) {
      style.remove();
    }
    document.documentElement.classList.remove('full-viewport');
  }

  static async setNavigationBarColor(color, darkButtons = false) {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
      return;
    }

    try {
      // Try to use the StatusBar plugin for navigation bar color (some versions support it)
      const { StatusBar } = await import('@capacitor/status-bar');
      await StatusBar.setBackgroundColor({ color });
    } catch (error) {
      console.log('Navigation bar color setting not available');
    }
  }
}