import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Sidebar from '@/components/Sidebar';
import { Menu } from 'lucide-react';

const ResponsiveLayout = ({ children, title = 'Conveyancing Management App' }) => {
  const { status } = useSession();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Redirect to sign-in page if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Prevent scrolling on body when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMobileMenuOpen]);

  if (status === 'loading') {
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
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar 
          isMobileMenuOpen={isMobileMenuOpen} 
          toggleMobileMenu={toggleMobileMenu} 
        />
        
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-x-hidden">
          {/* Top bar (mobile) */}
          <div className="md:hidden flex items-center justify-between py-3 px-4 border-b bg-white">
            <div className="font-semibold text-lg">ConveyApp</div>
            <button 
              onClick={toggleMobileMenu}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <Menu size={24} />
            </button>
          </div>
          
          {/* Main content area */}
          <main className="flex-1 px-4 py-6 md:px-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </>
  );
};

export default ResponsiveLayout;