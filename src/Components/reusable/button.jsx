import React from 'react';

const Button = ({ children, type = 'button', onClick, variant = 'success', className = '', disabled = false, ...props }) => {
  const variantClasses = {
    success: 'text-white bg-green-600 border border-transparent hover:bg-green-700 focus:ring-4 focus:ring-green-300',
    primary: 'text-white bg-purple-600 border border-transparent hover:bg-purple-700 focus:ring-4 focus:ring-purple-300',
    danger: 'text-white bg-red-600 border border-transparent hover:bg-red-700 focus:ring-4 focus:ring-red-300',
    neutral: 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-4 focus:ring-gray-300',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${variantClasses[variant] || variantClasses.primary} shadow-xs font-medium leading-5 rounded-md text-sm px-4 py-2.5 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
