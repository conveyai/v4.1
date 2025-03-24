// mobileViewport.js
// Place this in your utils directory or include in _app.js

/**
 * This script handles common mobile viewport issues:
 * 1. Fixes the 100vh issue on mobile browsers
 * 2. Handles keyboard appearance on iOS
 * 3. Sets up safe area insets for notched devices
 */

export function setupMobileViewport() {
  if (typeof window === 'undefined') return;

  // Fix for 100vh on mobile
  const setVhVariable = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  // Handle resize and orientation changes
  const handleResize = () => {
    setVhVariable();
    
    // Add meta viewport tag if missing
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      document.head.appendChild(viewportMeta);
    }
    
    // Set viewport with settings that work well on mobile
    viewportMeta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover';
  };

  // Handle iOS keyboard
  const handleIOSKeyboard = () => {
    // Add event listeners to handle iOS keyboard appearance
    const allInputs = document.querySelectorAll('input, textarea');
    
    allInputs.forEach(input => {
      // On focus, scroll element into view to prevent keyboard from covering it
      input.addEventListener('focus', () => {
        // Small timeout to let the keyboard appear first
        setTimeout(() => {
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      });
    });
  };

  // Detect and handle iOS
  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  };

  // Setup touch actions
  const setupTouchActions = () => {
    // Prevent double-tap zoom on buttons and interactive elements
    const touchElements = document.querySelectorAll('button, a, .touch-button');
    touchElements.forEach(element => {
      element.style.touchAction = 'manipulation';
    });
  };

  // Initialize
  const init = () => {
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    if (isIOS()) {
      handleIOSKeyboard();
    }
    
    // Wait for document to be fully loaded
    if (document.readyState === 'complete') {
      setupTouchActions();
    } else {
      window.addEventListener('load', setupTouchActions);
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.removeEventListener('load', setupTouchActions);
    };
  };

  return init();
}

// For use with React useEffect
export function useMobileViewport() {
  if (typeof window === 'undefined') return;
  
  React.useEffect(() => {
    return setupMobileViewport();
  }, []);
}