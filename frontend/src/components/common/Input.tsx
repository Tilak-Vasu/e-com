// src/components/common/Input.tsx

import React from 'react';
import './Input.css';

// Define the props for the Input component
interface InputProps {
  type?: string; // e.g., 'text', 'password', 'email', 'number'
  placeholder?: string;
  value: string | number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string; // The name attribute, useful for forms
  required?: boolean;
}

const Input: React.FC<InputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  name,
  required = false
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      name={name}
      required={required}
      className="common-input"
    />
  );
};

export default Input;