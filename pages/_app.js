// pages/_app.js
import "@/styles/globals.css";
import { SessionProvider } from "next-auth/react";
import { useEffect, useState } from "react";

// Only import in non-production as validation only runs on the server
const validateEnv = process.env.NODE_ENV !== 'production' 
  ? require('@/utils/validateEnv').validateEnv 
  : () => {};

// Validate environment variables on startup (server-side only)
if (typeof window === 'undefined') {
  validateEnv();
}

// Responsive wrapper component
const AppWrapper = ({ children }) => {
  const [isMobileViewportSet, setIsMobileViewportSet] = useState(false);
  const [deviceType, setDeviceType] = useState('desktop'); // Default to desktop

  useEffect(() => {
    // Set up mobile viewport optimizations
    if (!isMobileViewportSet) {
      const detectedType = setupMobileViewport();
      setDeviceType(detectedType || 'desktop');
      setIsMobileViewportSet(true);
    }

    // Add resize handler to update device type
    const handleResize = () => {
      const type = window.innerWidth < 768 ? 'mobile' : 'desktop';
      if (type !== deviceType) {
        setDeviceType(type);
        setupMobileViewport(); // Reconfigure viewport on device type change
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileViewportSet, deviceType]);

  // Add a data attribute to the body for CSS targeting
  useEffect(() => {
    if (document && document.body) {
      document.body.dataset.deviceType = deviceType;
    }
  }, [deviceType]);

  return <>{children}</>;
};

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  // Log app startup in dev mode
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Conveyancing Management App running in development mode');
    }
  }, []);

  return (
    <SessionProvider session={session}>
      <AppWrapper>
        <Component {...pageProps} />
      </AppWrapper>
    </SessionProvider>
  );
}

export default MyApp;