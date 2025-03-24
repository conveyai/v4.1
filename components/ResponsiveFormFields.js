import { forwardRef } from "react";
import { cn } from "@/utils/cn";

export const ResponsiveInput = forwardRef(({ 
  className, 
  type = "text", 
  error, 
  label,
  fullWidth = true,
  helperText,
  ...props 
}, ref) => {
  return (
    <div className={cn("mb-4", fullWidth ? "w-full" : "")}>
      {label && (
        <label 
          htmlFor={props.id} 
          className="block text-sm font-medium text-gray-700 mb-1"
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
          className
        )}
        ref={ref}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

ResponsiveInput.displayName = "ResponsiveInput";

export const ResponsiveSelect = forwardRef(({ 
  className, 
  error, 
  label,
  options = [],
  fullWidth = true,
  helperText,
  ...props 
}, ref) => {
  return (
    <div className={cn("mb-4", fullWidth ? "w-full" : "")}>
      {label && (
        <label 
          htmlFor={props.id} 
          className="block text-sm font-medium text-gray-700 mb-1"
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
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

ResponsiveSelect.displayName = "ResponsiveSelect";

export const ResponsiveTextarea = forwardRef(({ 
  className, 
  error, 
  label,
  fullWidth = true,
  rows = 4,
  helperText,
  ...props 
}, ref) => {
  return (
    <div className={cn("mb-4", fullWidth ? "w-full" : "")}>
      {label && (
        <label 
          htmlFor={props.id} 
          className="block text-sm font-medium text-gray-700 mb-1"
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
          className
        )}
        ref={ref}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

ResponsiveTextarea.displayName = "ResponsiveTextarea";

export const FormGroup = ({ children, className, direction = "row" }) => {
  return (
    <div 
      className={cn(
        "mb-4 gap-4",
        direction === "row" ? "flex flex-col sm:flex-row" : "flex flex-col",
        className
      )}
    >
      {children}
    </div>
  );
};

export const ResponsiveCheckbox = forwardRef(({ 
  className, 
  error, 
  label,
  helperText,
  ...props 
}, ref) => {
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
            className="ml-2 block text-sm text-gray-700"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

ResponsiveCheckbox.displayName = "ResponsiveCheckbox";