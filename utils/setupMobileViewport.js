/**
 * Helper to set up mobile-specific viewport settings
 * Only applies actual mobile-specific settings on mobile devices
 */
export const setupMobileViewport = () => {
  // Only run in browser environment
  if (typeof window === 'undefined') return;
  
  // Get the current viewport meta tag
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  
  // Check if we're on a mobile device (screen width less than 768px)
  const isMobile = window.innerWidth < 768;
  
  if (isMobile) {
    // Apply mobile-specific settings
    if (viewportMeta) {
      viewportMeta.content = 'width=device-width, initial-scale=1, maximum-scale=1';
    }
    
    // Add a mobile-specific class to the document for styling
    document.documentElement.classList.add('mobile-device');
  } else {
    // On desktop, use standard viewport settings
    if (viewportMeta) {
      viewportMeta.content = 'width=device-width, initial-scale=1';
    }
    
    // Remove mobile class if present
    document.documentElement.classList.remove('mobile-device');
  }
  
  // Return current device type for convenience
  return isMobile ? 'mobile' : 'desktop';
};

/**
 * Get current device type based on screen width
 * @returns {string} 'mobile' or 'desktop'
 */
export const getDeviceType = () => {
  if (typeof window === 'undefined') return 'desktop'; // Default to desktop on server
  
  return window.innerWidth < 768 ? 'mobile' : 'desktop';
};