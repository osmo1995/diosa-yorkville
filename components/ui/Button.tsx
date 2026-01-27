
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-sans font-semibold transition-all duration-300 disabled:opacity-50 tracking-wider uppercase';
  
  const variants = {
    primary: 'bg-divine-gold text-deep-charcoal hover:bg-bronze-glow hover:text-white',
    secondary: 'bg-deep-charcoal text-white hover:bg-black',
    outline: 'border-2 border-divine-gold text-divine-gold hover:bg-divine-gold hover:text-white',
    ghost: 'text-deep-charcoal hover:bg-soft-champagne'
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs min-h-[40px]',
    md: 'px-8 py-3 text-sm min-h-[44px]',
    lg: 'px-12 py-4 text-base min-h-[48px]'
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
