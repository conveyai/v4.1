import { forwardRef } from "react";
import { cn } from "@/utils/cn";
import { useIsMobile } from "@/utils/useResponsive";

// ResponsiveInput component with improved mobile detection
export const ResponsiveInput = forwardRef(({ 
  className, 
  type = "text", 
  error, 
  label,
  fullWidth = true,
  helperText,
  ...props 
}, ref) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={cn(
      "mb-4", 
      fullWidth ? "w-full" : "",
      isMobile ? "flex flex-col" : ""
    )}>
      {label && (
        <label 
          htmlFor={props.id} 
          className={cn(
            "block text-sm font-medium text-gray-700",
            isMobile ? "mb-1" : "mb-1 md:mb-2"
          )}
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        className={cn(
          "px-3 py-2 w-full border rounded-md shadow-sm focus:outline-none focus:ring-2",
          error
            ? "border-red-300 focus:border-red-300 focus:ring-red-200 text-red-900 placeholder-red-300"
            : "border-gray-300 focus:border-blue-300 focus:ring-blue-200",
          isMobile ? "text-base" : "text-sm md:text-base",
          className
        )}
        ref={ref}
        {...props}
      />
      {error && (
        <p className={cn(
          "mt-1 text-red-600",
          isMobile ? "text-sm" : "text-xs md:text-sm"
        )}>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className={cn(
          "mt-1 text-gray-500",
          isMobile ? "text-sm" : "text-xs md:text-sm"
        )}>
          {helperText}
        </p>
      )}
    </div>
  );
});

ResponsiveInput.displayName = "ResponsiveInput";

// ResponsiveSelect component with improved mobile detection
export const ResponsiveSelect = forwardRef(({ 
  className, 
  error, 
  label,
  options = [],
  fullWidth = true,
  helperText,
  ...props 
}, ref) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={cn(
      "mb-4", 
      fullWidth ? "w-full" : "",
      isMobile ? "flex flex-col" : ""
    )}>
      {label && (
        <label 
          htmlFor={props.id} 
          className={cn(
            "block text-sm font-medium text-gray-700",
            isMobile ? "mb-1" : "mb-1 md:mb-2"
          )}
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        className={cn(
          "px-3 py-2 w-full border rounded-md shadow-sm focus:outline-none focus:ring-2 bg-white",
          error
            ? "border-red-300 focus:border-red-300 focus:ring-red-200 text-red-900"
            : "border-gray-300 focus:border-blue-300 focus:ring-blue-200",
          isMobile ? "text-base" : "text-sm md:text-base",
          className
        )}
        ref={ref}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className={cn(
          "mt-1 text-red-600",
          isMobile ? "text-sm" : "text-xs md:text-sm"
        )}>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className={cn(
          "mt-1 text-gray-500",
          isMobile ? "text-sm" : "text-xs md:text-sm"
        )}>
          {helperText}
        </p>
      )}
    </div>
  );
});

ResponsiveSelect.displayName = "ResponsiveSelect";

// ResponsiveTextarea component with improved mobile detection
export const ResponsiveTextarea = forwardRef(({ 
  className, 
  error, 
  label,
  fullWidth = true,
  rows = 4,
  helperText,
  ...props 
}, ref) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={cn(
      "mb-4", 
      fullWidth ? "w-full" : "",
      isMobile ? "flex flex-col" : ""
    )}>
      {label && (
        <label 
          htmlFor={props.id} 
          className={cn(
            "block text-sm font-medium text-gray-700",
            isMobile ? "mb-1" : "mb-1 md:mb-2"
          )}
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        className={cn(
          "px-3 py-2 w-full border rounded-md shadow-sm focus:outline-none focus:ring-2",
          error
            ? "border-red-300 focus:border-red-300 focus:ring-red-200 text-red-900 placeholder-red-300"
            : "border-gray-300 focus:border-blue-300 focus:ring-blue-200",
          isMobile ? "text-base" : "text-sm md:text-base",
          className
        )}
        ref={ref}
        {...props}
      />
      {error && (
        <p className={cn(
          "mt-1 text-red-600",
          isMobile ? "text-sm" : "text-xs md:text-sm"
        )}>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className={cn(
          "mt-1 text-gray-500",
          isMobile ? "text-sm" : "text-xs md:text-sm"
        )}>
          {helperText}
        </p>
      )}
    </div>
  );
});

ResponsiveTextarea.displayName = "ResponsiveTextarea";

// FormGroup component with improved mobile detection
export const FormGroup = ({ children, className, direction = "row" }) => {
  const isMobile = useIsMobile();
  
  return (
    <div 
      className={cn(
        "mb-4 gap-4",
        isMobile 
          ? "flex flex-col" 
          : direction === "row" 
            ? "flex flex-col sm:flex-row" 
            : "flex flex-col",
        className
      )}
    >
      {children}
    </div>
  );
};

// ResponsiveCheckbox component with improved mobile detection
export const ResponsiveCheckbox = forwardRef(({ 
  className, 
  error, 
  label,
  helperText,
  ...props 
}, ref) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="mb-4">
      <div className="flex items-center">
        <input
          type="checkbox"
          className={cn(
            "h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500",
            className
          )}
          ref={ref}
          {...props}
        />
        {label && (
          <label 
            htmlFor={props.id} 
            className={cn(
              "ml-2 block text-gray-700",
              isMobile ? "text-base" : "text-sm"
            )}
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
      </div>
      {error && (
        <p className={cn(
          "mt-1 text-red-600",
          isMobile ? "text-sm" : "text-xs"
        )}>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className={cn(
          "mt-1 text-gray-500",
          isMobile ? "text-sm" : "text-xs"
        )}>
          {helperText}
        </p>
      )}
    </div>
  );
});

ResponsiveCheckbox.displayName = "ResponsiveCheckbox";