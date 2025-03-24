// utils/useResponsive.js
import { useState, useEffect } from "react";

// Define standard breakpoints
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

export function useResponsive() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1024, // Default to desktop during SSR
    height: typeof window !== "undefined" ? window.innerHeight : 768,
  });

  useEffect(() => {
    // Skip if window is not defined (during SSR)
    if (typeof window === 'undefined') return;
    
    // Handler to call on window resize
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    // Add event listener
    window.addEventListener("resize", handleResize);
    
    // Call handler right away so state gets updated with initial window size
    handleResize();
    
    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount and unmount

  return {
    width: windowSize.width,
    height: windowSize.height,
    isMobile: windowSize.width < breakpoints.md,
    isTablet: windowSize.width >= breakpoints.md && windowSize.width < breakpoints.lg,
    isDesktop: windowSize.width >= breakpoints.lg,
    isSmall: windowSize.width < breakpoints.sm,
    isMedium: windowSize.width >= breakpoints.md && windowSize.width < breakpoints.lg,
    isLarge: windowSize.width >= breakpoints.lg && windowSize.width < breakpoints.xl,
    isXLarge: windowSize.width >= breakpoints.xl,
  };
}

// Simple hook for the most common check
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Function to check if viewport width is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoints.md);
    };

    // Call it once immediately
    checkMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

// Additional hooks for more specific checks
export function useIsTablet() {
  const { isTablet } = useResponsive();
  return isTablet;
}

export function useIsDesktop() {
  const { isDesktop } = useResponsive();
  return isDesktop;
}