import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rectangular' }) => {
  const baseClasses = 'animate-pulse bg-gray-200';
  
  const variantClasses = {
    text: 'h-4 w-full rounded',
    rectangular: 'w-full h-full',
    circular: 'rounded-full',
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} aria-hidden="true" />
  );
};

export const ImageSkeleton: React.FC<{ aspectRatio?: string; className?: string }> = ({ 
  aspectRatio = 'aspect-[3/4]', 
  className = '' 
}) => {
  return (
    <div className={`${aspectRatio} ${className} relative overflow-hidden bg-gray-200 animate-pulse`} aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" 
           style={{ animationDuration: '2s', animationIterationCount: 'infinite' }} />
    </div>
  );
};
