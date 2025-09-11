// src/components/common/Button.tsx
import React, { type ReactNode } from 'react';
import './Button.css';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  style?: React.CSSProperties; 
  title?: string;   // ✅ Add this
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  style,
  title,   // ✅ Destructure it
}) => {
  return (
    <button
      type={type}
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
      title={title}   // ✅ Pass it to the native <button>
    >
      {children}
    </button>
  );
};

export default Button;
