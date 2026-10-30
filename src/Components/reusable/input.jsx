import React from 'react';

const Input = ({ label, id, type = 'text', placeholder, value, onChange, required = false, className = '', ...props }) => {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block mb-2.5 text-sm font-medium text-heading">
          {label}
        </label>
      )}
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        className={`bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body ${className}`}
        placeholder={placeholder}
        required={required}
        {...props}
      />
    </div>
  );
};

export default Input;
