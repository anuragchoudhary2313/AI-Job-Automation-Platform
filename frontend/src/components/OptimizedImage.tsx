import React, { useState, useCallback, useMemo, memo } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  lazy?: boolean;
}

/**
 * Optimized image component with lazy loading and responsive sizes
 */
export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  lazy = true
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  // Generate srcset for responsive images
  const srcSet = useMemo(() => {
    if (!width) return undefined;

    const sizes = [1, 1.5, 2]; // 1x, 1.5x, 2x
    return sizes
      .map((size) => {
        const scaledWidth = Math.round(width * size);
        // In production, use image CDN with query params
        return `${src}?w=${scaledWidth} ${size}x`;
      })
      .join(', ');
  }, [src, width]);

  if (hasError) {
    return (
      <div
        className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-400 text-sm">Failed to load</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {/* Placeholder while loading */}
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse"
          style={{ width, height }}
        />
      )}

      {/* Actual image */}
      <img
        src={src}
        srcSet={srcSet}
        alt={alt}
        width={width}
        height={height}
        loading={lazy ? 'lazy' : 'eager'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={`${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 ${className}`}
      />
    </div>
  );
});

export default OptimizedImage;
