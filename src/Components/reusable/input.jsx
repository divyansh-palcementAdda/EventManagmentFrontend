import React from 'react';

const Input = ({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  className = '',
  icon: Icon,
  error,
  helperText,
  disabled = false,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-700"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          type={type}
          id={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          className={`w-full text-sm rounded-lg transition-colors duration-150 border ${
            error
              ? 'border-red-400 bg-red-50/30 text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-200'
              : 'border-gray-300 bg-white text-gray-900 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 hover:border-gray-400'
          } ${Icon ? 'pl-10' : 'px-3.5'} py-2.5 shadow-sm placeholder:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed ${className}`}
          placeholder={placeholder}
          required={required}
          {...props}
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
          <span>{error}</span>
        </p>
      )}
      {!error && helperText && (
        <p id={`${id}-helper`} className="mt-1 text-[11px] text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;
