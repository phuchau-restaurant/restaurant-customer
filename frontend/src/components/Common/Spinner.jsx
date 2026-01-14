import React from "react";
import { Loader2 } from "lucide-react";

const Spinner = ({ size = "default", className = "" }) => {
  const sizeClasses = {
    small: "w-4 h-4",
    default: "w-8 h-8",
    large: "w-12 h-12",
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 
        className={`${sizeClasses[size]} text-orange-500 animate-spin`} 
      />
    </div>
  );
};

export default Spinner;
