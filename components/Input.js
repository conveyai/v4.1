import { forwardRef } from "react";
import { cn } from "@/utils/cn";
import { useIsMobile } from "@/utils/useResponsive";

const Input = forwardRef(({ 
  className, 
  type = "text", 
  error, 
  label,
  ...props 
}, ref) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={props.id} 
          className={cn(
            "block text-sm font-medium text-gray-700 mb-1",
            isMobile ? "text-base" : "text-sm"
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
          isMobile ? "text-base" : "text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
      {error && (
        <p className={cn(
          "mt-1 text-red-600",
          isMobile ? "text-sm" : "text-xs"
        )}>
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export { Input };