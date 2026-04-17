import React from "react";

export default function Spinner({ className = "", label = "Loading" }) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-800 dark:border-gray-700 dark:border-t-gray-100"
        aria-hidden="true"
      />
      <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
    </div>
  );
}

