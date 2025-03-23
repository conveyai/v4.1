import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";
import { Home, FileText, Users, Settings, Menu, X, LogOut, Home as HomeIcon, Archive, CheckSquare } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui";
import { cn } from "@/utils/cn";


const Sidebar = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/auth/signin");
  };

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
        <SidebarLink 
          href="/" 
          icon={<Home size={20} />} 
          label="Dashboard" 
          isOpen={isOpen} 
          isActive={router.pathname === "/"}
        />
        <SidebarLink 
          href="/matters" 
          icon={<FileText size={20} />} 
          label="Matters" 
          isOpen={isOpen} 
          isActive={router.pathname === "/matters"}
        />
        <SidebarLink 
          href="/properties" 
          icon={<HomeIcon size={20} />} 
          label="Properties" 
          isOpen={isOpen} 
          isActive={router.pathname === "/properties"}
        />
        <SidebarLink 
          href="/clients" 
          icon={<Users size={20} />} 
          label="Clients" 
          isOpen={isOpen} 
          isActive={router.pathname === "/clients"}
        />
        <SidebarLink 
          href="/archived-matters" 
          icon={<Archive size={20} />} 
          label="Archived Matters" 
          isOpen={isOpen} 
          isActive={router.pathname === "/archived-matters"}
        />
        <SidebarLink 
          href="/settings" 
          icon={<Settings size={20} />} 
          label="Settings" 
          isOpen={isOpen}
          isActive={router.pathname === "/settings"}
        />
        <SidebarLink 
  href="/todos" 
  icon={<CheckSquare size={20} />} 
  label="Todos" 
  isOpen={isOpen} 
  isActive={router.pathname === "/todos"}
/>
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
};

/**
 * Sidebar Link Component
 * Renders an individual navigation item.
 */
const SidebarLink = ({ href, icon, label, isOpen, isActive }) => {
  return (
    <Link 
      href={href} 
      className={cn(
        "flex items-center space-x-3 p-2 rounded-md transition",
        isActive 
          ? "bg-gray-800 text-white" 
          : "text-gray-300 hover:text-white hover:bg-gray-800",
        !isOpen && "justify-center"
      )}
    >
      {icon}
      {isOpen && <span>{label}</span>}
    </Link>
  );
};

export default Sidebar;