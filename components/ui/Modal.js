// components/ui/Modal.js
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className, 
  size = "md",
  showCloseButton = true
}) {
  const modalRef = useRef(null);
  
  // Define explicit width classes for each size
  const sizeClasses = {
    sm: "w-full max-w-sm",
    md: "w-full max-w-md",
    lg: "w-full max-w-lg",
    xl: "w-full max-w-xl",
    "2xl": "w-full max-w-2xl",
    "3xl": "w-full max-w-3xl",
    "4xl": "w-full max-w-4xl",
    "5xl": "w-full max-w-5xl",
    full: "w-full max-w-full mx-4",
  };

  // Close modal on escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (isOpen && e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    
    // Prevent scrolling on body when modal is open
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "visible";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handle click on the overlay to close the modal
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black bg-opacity-50 p-4"
      onClick={handleOverlayClick}
    >
      <div 
        ref={modalRef}
        className={cn(
          "bg-white rounded-lg shadow-xl overflow-hidden",
          sizeClasses[size] || sizeClasses.md,
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            {showCloseButton && (
              <button 
                onClick={onClose} 
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}
        
        <div className="px-6 py-4 max-h-[70vh] overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}