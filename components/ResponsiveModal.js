import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";

const ResponsiveModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = "md",
  showCloseButton = true,
  fullscreenOnMobile = true,
  preventBackdropClose = false,
  footer,
  className
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
    
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

  useEffect(() => {
    // Prevent scrolling on body when modal is open
    if (isOpen) {
      document.body.style.overflow = "hidden";

      // Add escape key listener
      const handleEscape = (e) => {
        if (isOpen && e.key === "Escape" && !preventBackdropClose) {
          onClose();
        }
      };
      document.addEventListener("keydown", handleEscape);
      
      return () => {
        document.body.style.overflow = "visible";
        document.removeEventListener("keydown", handleEscape);
      };
    }
    return () => {
      document.body.style.overflow = "visible";
    };
  }, [isOpen, onClose, preventBackdropClose]);

  // Use animation to handle the entrance and exit of the modal
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (preventBackdropClose) return;
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      handleClose();
    }
  };

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    full: "max-w-full",
  };

  if (!isMounted || !isOpen) return null;

  const modal = (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center overflow-y-auto",
        "bg-black bg-opacity-25 backdrop-blur-sm transition-opacity duration-300",
        isAnimating ? "opacity-100" : "opacity-0"
      )}
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className={cn(
          "bg-white relative rounded-lg shadow-xl overflow-hidden transition-all duration-300 transform",
          isMobile && fullscreenOnMobile ? "w-full h-full rounded-none" : `w-full mx-4 ${sizeClasses[size]}`,
          isAnimating ? "scale-100 translate-y-0" : "scale-95 translate-y-4",
          className
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex justify-between items-center px-4 py-3 sm:px-6 border-b">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            {showCloseButton && (
              <button
                type="button"
                className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={handleClose}
              >
                <span className="sr-only">Close</span>
                <X size={20} />
              </button>
            )}
          </div>
        )}
        
        {/* Body */}
        <div 
          className={cn(
            "overflow-y-auto",
            isMobile && fullscreenOnMobile ? "px-4 py-4 sm:p-6 max-h-[calc(100vh-8rem)]" : "p-4 sm:p-6 max-h-[calc(80vh-10rem)]"
          )}
        >
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="px-4 py-3 sm:px-6 bg-gray-50 border-t">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default ResponsiveModal;