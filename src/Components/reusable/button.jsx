import React from 'react';

const Button = ({ children, type = 'button', onClick, variant = 'success', className = '', disabled = false, ...props }) => {
  const variantClasses = {
    success: 'text-success bg-neutral-primary border border-success hover:bg-success hover:text-white focus:ring-4 focus:ring-neutral-tertiary',
    primary: 'text-white bg-purple-600 border border-transparent hover:bg-purple-700 focus:ring-4 focus:ring-purple-300',
    danger: 'text-white bg-red-600 border border-transparent hover:bg-red-700 focus:ring-4 focus:ring-red-300',
    neutral: 'text-heading bg-neutral-secondary border border-default hover:bg-neutral-tertiary focus:ring-4 focus:ring-neutral-tertiary',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${variantClasses[variant] || variantClasses.primary} shadow-xs font-medium leading-5 rounded-md text-sm px-4 py-2.5 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
