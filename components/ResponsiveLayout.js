import { useState, useEffect } from "react";
import Head from "next/head";
import { useSession } from "next-auth/react";
import ResponsiveNavigation from "./ResponsiveNavigation";
import { cn } from "@/utils/cn";

const ResponsiveLayout = ({ children, title = "Conveyancing Management App" }) => {
  const { data: session, status } = useSession();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if we're on a mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // If still checking auth status, show loading state
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="h-16 w-16 mx-auto border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      
      <ResponsiveNavigation />
      
      <main className={cn(
        "flex-1 p-4 md:p-6 overflow-auto",
        isMobile && "pb-20" // Add bottom padding on mobile to account for navigation bar
      )}>
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default ResponsiveLayout;