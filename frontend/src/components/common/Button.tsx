// src/components/common/Button.tsx

import React, { type ReactNode } from 'react';
import './Button.css';

// Define the types for the component's props
interface ButtonProps {
  children: ReactNode; // The content inside the button (e.g., text, an icon)
  onClick?: () => void; // An optional click handler function
  type?: 'button' | 'submit' | 'reset'; // The button's type attribute
  variant?: 'primary' | 'secondary' | 'danger'; // Different visual styles
  disabled?: boolean; // Optional disabled state
  style?: React.CSSProperties; 

}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  style,
}) => {
  // The component returns a standard button element.
  // The CSS class is dynamically constructed based on the variant prop.
  return (
    <button
      type={type}
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  );
};

export default Button;