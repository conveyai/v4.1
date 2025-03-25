import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import {
  FileText,
  Users,
  Home,
  Package,
  CheckSquare,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Archive
} from 'lucide-react';

const Sidebar = ({ isMobileMenuOpen, toggleMobileMenu }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [companyLogo, setCompanyLogo] = useState(null);
  
  // Get the current page to highlight the active link
  const currentPath = router.pathname;

  // Fetch company logo
  useEffect(() => {
    const fetchLogo = async () => {
      if (session) {
        try {
          const response = await fetch('/api/settings/logo');
          if (response.ok) {
            const data = await response.json();
            if (data.logoUrl) {
              setCompanyLogo(data.logoUrl);
            }
          }
        } catch (err) {
          console.error("Error fetching logo:", err);
        }
      }
    };

    fetchLogo();
  }, [session]);

  // Navigation items
  const navItems = [
    { href: '/', label: 'Dashboard', icon: <Home size={20} /> },
    { href: '/matters', label: 'Matters', icon: <FileText size={20} /> },
    { href: '/clients', label: 'Clients', icon: <Users size={20} /> },
    { href: '/properties', label: 'Properties', icon: <Package size={20} /> },
    { href: '/todos', label: 'Todos', icon: <CheckSquare size={20} /> },
    { href: '/archived-matters', label: 'Archived', icon: <Archive size={20} /> },
    { href: '/settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  const handleLogout = () => {
    signOut({ callbackUrl: '/auth/signin' });
  };

  // Determine if mobile or desktop sidebar
  const sidebarClasses = isMobileMenuOpen
    ? 'fixed inset-y-0 left-0 transform translate-x-0 w-64 transition-transform duration-300 ease-in-out z-30'
    : 'hidden md:block md:w-64 md:min-h-screen';

  return (
    <>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={toggleMobileMenu}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`${sidebarClasses} bg-white border-r flex flex-col h-full`}>
        {/* Logo and close button for mobile */}
        <div className="px-4 py-5 flex items-center justify-between border-b">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-xl">ConveyApp</span>
          </div>
          {isMobileMenuOpen && (
            <button 
              onClick={toggleMobileMenu}
              className="md:hidden rounded-md p-2 hover:bg-gray-200"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Logo and user info */}
        <div className="px-6 py-4 border-b">
          {/* Company Logo */}
          <div className="flex justify-center mb-4">
            {companyLogo ? (
              <div className="relative w-32 h-32">
                <Image
                  src={companyLogo}
                  alt="Company Logo"
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="w-32 h-32 flex items-center justify-center bg-gray-100 rounded-md">
                <span className="text-lg font-medium text-gray-400">No Logo</span>
              </div>
            )}
          </div>

          {/* User info */}
          {session && (
            <div className="text-center">
              <p className="font-medium text-gray-800">{session.user.name}</p>
              <p className="text-sm text-gray-500 truncate">{session.user.email}</p>
              <p className="text-xs text-gray-400 mt-1">{session.user.tenantName}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="px-2 space-y-1">
            {navItems.map((item) => {
              const isActive = currentPath === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-4 py-2.5 rounded-md
                      ${isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    onClick={isMobileMenuOpen ? toggleMobileMenu : undefined}
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout button */}
        <div className="px-4 py-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <LogOut size={20} className="mr-3" />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;