import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';

// Initialize safe area settings
export const initializeSafeArea = async () => {
  // Set status bar style (light or dark)
  await StatusBar.setStyle({ style: Style.Dark });
  
  // Set background color (optional)
  await StatusBar.setBackgroundColor({ color: '#ffffff' });
  
  // Enable overlay for better content handling
  await StatusBar.setOverlaysWebView({ overlay: false });
  
  // Handle keyboard events
  Keyboard.setResizeMode({ mode: 'native' });
  
  // Add keyboard will show/hide event listeners if needed
  Keyboard.addListener('keyboardWillShow', (info) => {
    console.log('Keyboard will show with height:', info.keyboardHeight);
  });
  
  Keyboard.addListener('keyboardWillHide', () => {
    console.log('Keyboard will hide');
  });
};

// Get safe area insets
export const getSafeAreaInsets = () => {
  // These values should be adjusted based on your app's design
  return {
    top: 'env(safe-area-inset-top, 20px)',
    right: 'env(safe-area-inset-right, 0px)',
    bottom: 'env(safe-area-inset-bottom, 0px)',
    left: 'env(safe-area-inset-left, 0px)'
  };
};

// Safe area CSS variables
export const safeAreaStyles = {
  '--safe-area-top': 'env(safe-area-inset-top, 20px)',
  '--safe-area-right': 'env(safe-area-inset-right, 0px)',
  '--safe-area-bottom': 'env(safe-area-inset-bottom, 0px)',
  '--safe-area-left': 'env(safe-area-inset-left, 0px)'
};

// Apply safe area to a specific element
export const applySafeArea = (element) => {
  if (!element) return;
  
  const insets = getSafeAreaInsets();
  Object.entries(insets).forEach(([key, value]) => {
    element.style.setProperty(`--safe-area-${key}`, value);
  });
};
