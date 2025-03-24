import Head from "next/head";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { setupMobileViewport } from "@/utils/mobileViewport";

export default function RegistrationSuccess() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Set up mobile viewport optimizations
    setupMobileViewport();
    
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Head>
        <title>Registration Successful | Conveyancing Management App</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-green-100 p-3 rounded-full">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Registration Successful!</h1>
        
        <p className="text-gray-600 mb-6">
          Your account has been created successfully. You can now sign in to access your conveyancing dashboard.
        </p>
        
        <Link href="/auth/signin" passHref>
          <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors">
            Sign In to Your Account
          </button>
        </Link>
        
        <div className="mt-8 border-t pt-6 text-sm text-gray-500">
          <p>If you have any questions or need assistance, please contact our support team.</p>
        </div>
      </div>
    </div>
  );
}