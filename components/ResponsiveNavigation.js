import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";
import { 
  Home, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  Archive, 
  CheckSquare, 
  Menu, 
  X, 
  ChevronUp 
} from "lucide-react";
import { cn } from "@/utils/cn";

const ResponsiveNavigation = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check if we're on a mobile device
    const checkMobile = () => {
      const mobileCheck = window.innerWidth < 768;
      setIsMobile(mobileCheck);
      
      // Always collapse sidebar on mobile
      if (mobileCheck) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };

    // Initial check
    checkMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/auth/signin");
  };

  // Navigation items
  const navItems = [
    { href: "/", label: "Dashboard", icon: <Home size={isMobile ? 20 : 24} /> },
    { href: "/matters", label: "Matters", icon: <FileText size={isMobile ? 20 : 24} /> },
    { href: "/properties", label: "Properties", icon: <Home size={isMobile ? 20 : 24} /> },
    { href: "/clients", label: "Clients", icon: <Users size={isMobile ? 20 : 24} /> },
    { href: "/todos", label: "Todos", icon: <CheckSquare size={isMobile ? 20 : 24} /> },
    { href: "/archived-matters", label: "Archived", icon: <Archive size={isMobile ? 20 : 24} /> }
  ];

  // Desktop sidebar
  if (!isMobile) {
    return (
      <aside 
        className={cn(
          "bg-gray-900 text-white h-screen flex flex-col transition-all duration-300",
          isOpen ? "w-64" : "w-20"
        )}
      >
        {/* Header with Toggle Button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          {isOpen && <h1 className="text-xl font-bold">ConveyAI</h1>}
          <button 
            onClick={toggleSidebar}
            className="text-gray-300 hover:text-white transition p-1 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-600"
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* User Info */}
        {session && (
          <div className={cn(
            "border-b border-gray-800 p-4",
            !isOpen && "flex justify-center"
          )}>
            {isOpen ? (
              <div>
                <p className="font-medium truncate">{session.user.name}</p>
                <p className="text-sm text-gray-400 truncate">{session.user.email}</p>
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center uppercase">
                {session.user.name?.charAt(0) || "U"}
              </div>
            )}
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex flex-col p-2 space-y-1 flex-grow">
          {navItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href} 
              className={cn(
                "flex items-center space-x-3 p-2 rounded-md transition",
                router.pathname === item.href 
                  ? "bg-gray-800 text-white" 
                  : "text-gray-300 hover:text-white hover:bg-gray-800",
                !isOpen && "justify-center"
              )}
            >
              {item.icon}
              {isOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Sign Out Button */}
        <div className="p-2 mt-auto border-t border-gray-800">
          <button
            onClick={handleSignOut}
            className={cn(
              "flex items-center space-x-3 w-full p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 transition",
              !isOpen && "justify-center"
            )}
          >
            <LogOut size={20} />
            {isOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    );
  }

  // Mobile navigation
  return (
    <>
      {/* Bottom Navigation Bar for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white border-t border-gray-800 z-50 pt-safe">
        <div className="flex justify-around items-center">
          {navItems.slice(0, 4).map((item) => (
            <Link 
              key={item.href}
              href={item.href} 
              className={cn(
                "flex flex-col items-center py-2 px-1 transition",
                router.pathname === item.href 
                  ? "text-blue-400" 
                  : "text-gray-300 hover:text-white"
              )}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}
          <button
            onClick={toggleMobileMenu}
            className="flex flex-col items-center py-2 px-1 text-gray-300 hover:text-white"
          >
            <Menu size={20} />
            <span className="text-xs mt-1">More</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="absolute bottom-16 left-0 right-0 bg-gray-900 text-white rounded-t-lg p-4 animate-slide-up">
            <button
              onClick={toggleMobileMenu}
              className="absolute top-2 right-2 text-gray-300 hover:text-white p-2"
            >
              <X size={20} />
            </button>
            
            <div className="flex justify-center mb-4">
              <ChevronUp size={24} className="text-gray-500" />
            </div>
            
            {session && (
              <div className="border-b border-gray-700 pb-4 mb-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center uppercase mr-3">
                    {session.user.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <p className="font-medium">{session.user.name}</p>
                    <p className="text-sm text-gray-400">{session.user.email}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              {navItems.slice(4).map((item) => (
                <Link 
                  key={item.href}
                  href={item.href} 
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-md transition",
                    router.pathname === item.href 
                      ? "bg-gray-800 text-white" 
                      : "text-gray-300 hover:text-white hover:bg-gray-800"
                  )}
                  onClick={toggleMobileMenu}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
              
              <Link 
                href="/settings" 
                className="flex items-center space-x-3 p-3 rounded-md transition text-gray-300 hover:text-white hover:bg-gray-800"
                onClick={toggleMobileMenu}
              >
                <Settings size={24} />
                <span>Settings</span>
              </Link>
              
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-3 w-full p-3 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 transition"
              >
                <LogOut size={24} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ResponsiveNavigation;