import React from 'react';

type SkeletonProps = {
  className?: string;
  rounded?: string;
};

/**
 * Production-grade skeleton block with shimmer.
 * Uses `.aa-skeleton` global helper so it works with Tailwind CDN builds.
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '', rounded = 'rounded-lg' }) => {
  return (
    <div
      aria-hidden="true"
      className={`aa-skeleton bg-slate-200/80 dark:bg-slate-700/40 ${rounded} ${className}`}
    />
  );
};


