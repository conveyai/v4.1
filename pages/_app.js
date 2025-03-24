// pages/_app.js
import "@/styles/globals.css";
import { SessionProvider } from "next-auth/react";
import { useEffect, useState } from "react";
import { setupMobileViewport } from "@/utils/mobileViewport";

// Only import in non-production as validation only runs on the server
const validateEnv = process.env.NODE_ENV !== 'production' 
  ? require('@/utils/validateEnv').validateEnv 
  : () => {};

// Validate environment variables on startup (server-side only)
if (typeof window === 'undefined') {
  validateEnv();
}

// Simple mobile-aware wrapper component
const AppWrapper = ({ children }) => {
  const [isMobileViewportSet, setIsMobileViewportSet] = useState(false);

  useEffect(() => {
    // Set up mobile viewport optimizations
    if (!isMobileViewportSet) {
      setupMobileViewport();
      setIsMobileViewportSet(true);
    }
  }, [isMobileViewportSet]);

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