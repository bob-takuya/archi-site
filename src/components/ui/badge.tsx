import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  className?: string;
  onClick?: () => void;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default', 
  className = '',
  onClick
}) => {
  const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors';
  
  const variantClasses = {
    default: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    destructive: 'bg-red-100 text-red-800 hover:bg-red-200'
  };

  const cursorClass = onClick ? 'cursor-pointer' : '';

  return (
    <span 
      className={`${baseClasses} ${variantClasses[variant]} ${cursorClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </span>
  );
};