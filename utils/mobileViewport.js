// utils/mobileViewport.js

/**
 * Sets up optimizations for mobile viewports
 * @returns {string} The detected device type: 'mobile' or 'desktop'
 */
export function setupMobileViewport() {
  if (typeof window === 'undefined') {
    return 'desktop'; // Default for SSR
  }

  // Check if viewport meta tag already exists
  let metaViewport = document.querySelector('meta[name="viewport"]');
  
  // Add viewport meta tag if it doesn't exist
  if (!metaViewport) {
    metaViewport = document.createElement('meta');
    metaViewport.name = 'viewport';
    document.head.appendChild(metaViewport);
  }
  
  // Set appropriate viewport content
  // Include maximum-scale and user-scalable to prevent zooming on form fields on iOS
  metaViewport.content = 'width=device-width, initial-scale=1, maximum-scale=1';
  
  // Detect if mobile
  const isMobile = window.innerWidth < 768;
  
  // Add touch event handling for mobile devices
  if (isMobile) {
    // Prevent double-tap to zoom on mobile
    document.addEventListener('touchend', function(event) {
      // Prevent zoom on double-tap for buttons and links
      if (event.target.tagName === 'BUTTON' || event.target.tagName === 'A') {
        event.preventDefault();
        // Manual click trigger if needed
        if (typeof event.target.click === 'function') {
          event.target.click();
        }
      }
    }, { passive: false });
    
    // Add iOS-specific fixes
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      // Fix for iOS input zooming issue
      const styleEl = document.createElement('style');
      styleEl.innerHTML = `
        input[type="text"],
        input[type="email"],
        input[type="tel"],
        input[type="number"],
        input[type="password"],
        select, textarea {
          font-size: 16px !important;
        }
      `;
      document.head.appendChild(styleEl);
    }
    
    // Remove focus outline on mobile for better appearance
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      @media (max-width: 767px) {
        button:focus, input:focus, select:focus, textarea:focus {
          outline: none !important;
        }
      }
    `;
    document.head.appendChild(styleEl);
    
    return 'mobile';
  }
  
  return 'desktop';
}

/**
 * Debounce function for performance optimization
 */
export function debounce(func, wait = 100) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

/**
 * Check if viewport is mobile
 */
export function isMobileViewport() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

/**
 * Add event listener for viewport changes
 */
export function onViewportChange(callback) {
  if (typeof window === 'undefined') return () => {};
  
  const debouncedCallback = debounce(callback, 250);
  window.addEventListener('resize', debouncedCallback);
  
  // Return cleanup function
  return () => window.removeEventListener('resize', debouncedCallback);
}