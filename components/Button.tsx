import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '',
  disabled,
  ...props 
}) => {
  const baseStyle = 'ui-radius-field flex min-h-12 items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors duration-200 active:scale-[0.99] disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-[var(--color-accent)] text-white hover:brightness-95 disabled:bg-gray-300',
    outline: 'border-2 border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] disabled:border-gray-300 disabled:text-gray-400',
    ghost: 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${widthClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
