import React from 'react';

export type OptimizedImageProps = {
  alt: string;
  src: string;
  srcSet?: string;
  sizes?: string;
  className?: string;
  loading?: 'eager' | 'lazy';
  decoding?: 'async' | 'sync' | 'auto';
  fetchPriority?: 'high' | 'low' | 'auto';
  referrerPolicy?: React.ImgHTMLAttributes<HTMLImageElement>['referrerPolicy'];
  onError?: React.ReactEventHandler<HTMLImageElement>;
};

/**
 * Minimal, framework-agnostic image optimization:
 * - lazy loading by default
 * - async decoding by default
 * - optional srcSet/sizes for responsive loading
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  alt,
  src,
  srcSet,
  sizes,
  className,
  loading = 'lazy',
  decoding = 'async',
  fetchPriority = 'auto',
  referrerPolicy = 'no-referrer',
  onError,
}) => {
  return (
    <img
      alt={alt}
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      className={className}
      loading={loading}
      decoding={decoding}
      // fetchPriority is not in React types for older TS versions; cast safely.
      {...({ fetchPriority } as any)}
      referrerPolicy={referrerPolicy}
      onError={onError}
    />
  );
};
