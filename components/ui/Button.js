import { cn } from "@/utils/cn";

export default function Button({ 
  children, 
  className, 
  variant = "primary", 
  size = "md",
  ...props 
}) {
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white focus:ring-blue-300",
    secondary: "bg-gray-600 hover:bg-gray-500 text-white focus:ring-gray-300",
    success: "bg-green-600 hover:bg-green-500 text-white focus:ring-green-300",
    danger: "bg-red-600 hover:bg-red-500 text-white focus:ring-red-300",
    outline: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-300",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-300",
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={cn(
        "font-semibold rounded-md transition-colors focus:outline-none focus:ring-2",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}