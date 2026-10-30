import React from 'react';

const Input = ({ label, id, type = 'text', placeholder, value, onChange, required = false, className = '', icon: Icon, error, ...props }) => {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block mb-2.5 text-sm font-medium text-heading">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <input
          type={type}
          id={id}
          value={value}
          onChange={onChange}
          className={`bg-neutral-secondary-medium border ${error ? 'border-red-500' : 'border-purple-500'} text-heading text-sm rounded-sm focus:ring-purple-500 focus:border-purple-500 block w-full ${Icon ? 'pl-10' : 'px-3'} py-2.5 shadow-xs placeholder:text-body ${className}`}
          placeholder={placeholder}
          required={required}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Input;
