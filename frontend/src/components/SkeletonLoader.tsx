import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  count?: number;
  height?: string;
  width?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className = '',
  count = 1,
  height = 'h-4',
  width = 'w-full',
  variant = 'rectangular',
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'text':
        return 'rounded';
      case 'rectangular':
      default:
        return 'rounded-md';
    }
  };

  const skeletonElement = (
    <div
      className={`skeleton ${height} ${width} ${getVariantClasses()} ${className}`}
      role='status'
      aria-label='Loading content'
    />
  );

  if (count === 1) {
    return skeletonElement;
  }

  return (
    <div className='space-y-2'>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{skeletonElement}</div>
      ))}
    </div>
  );
};

// Pre-built skeleton components for common use cases
export const SkeletonCard: React.FC<{ className?: string }> = ({
  className = '',
}) => (
  <div className={`card ${className}`}>
    <div className='card-body'>
      <div className='flex items-center space-x-4 mb-4'>
        <SkeletonLoader variant='circular' height='h-12' width='w-12' />
        <div className='flex-1'>
          <SkeletonLoader height='h-4' width='w-3/4' className='mb-2' />
          <SkeletonLoader height='h-3' width='w-1/2' />
        </div>
      </div>
      <SkeletonLoader count={3} height='h-3' className='mb-2' />
      <SkeletonLoader height='h-3' width='w-2/3' />
    </div>
  </div>
);

export const SkeletonMetric: React.FC<{ className?: string }> = ({
  className = '',
}) => (
  <div className={`metric-card ${className}`}>
    <div className='flex items-center justify-between mb-4'>
      <SkeletonLoader variant='circular' height='h-12' width='w-12' />
      <SkeletonLoader height='h-6' width='w-16' />
    </div>
    <SkeletonLoader height='h-8' width='w-20' className='mb-2' />
    <SkeletonLoader height='h-4' width='w-24' />
  </div>
);

export const SkeletonTable: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className = '' }) => (
  <div className={`card ${className}`}>
    <div className='card-body'>
      {/* Table Header */}
      <div className='grid grid-cols-4 gap-4 mb-4 pb-4 border-b border-gray-200'>
        {Array.from({ length: columns }).map((_, index) => (
          <SkeletonLoader key={index} height='h-4' width='w-3/4' />
        ))}
      </div>

      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className='grid grid-cols-4 gap-4 mb-3'>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <SkeletonLoader key={colIndex} height='h-4' />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonProfile: React.FC<{ className?: string }> = ({
  className = '',
}) => (
  <div className={`card ${className}`}>
    <div className='card-body'>
      <div className='flex items-center space-x-4 mb-6'>
        <SkeletonLoader variant='circular' height='h-16' width='w-16' />
        <div className='flex-1'>
          <SkeletonLoader height='h-5' width='w-32' className='mb-2' />
          <SkeletonLoader height='h-4' width='w-48' />
        </div>
      </div>

      <div className='space-y-4'>
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className='flex items-center justify-between py-3 border-b border-gray-100'
          >
            <SkeletonLoader height='h-4' width='w-24' />
            <SkeletonLoader height='h-4' width='w-32' />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const SkeletonDashboard: React.FC = () => (
  <div className='min-h-screen bg-gray-50'>
    {/* Header Skeleton */}
    <div className='dashboard-header'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center py-4'>
          <div className='flex items-center space-x-3'>
            <SkeletonLoader variant='circular' height='h-10' width='w-10' />
            <div>
              <SkeletonLoader height='h-6' width='w-32' className='mb-1' />
              <SkeletonLoader height='h-4' width='w-48' />
            </div>
          </div>
          <div className='flex items-center space-x-4'>
            <SkeletonLoader variant='circular' height='h-8' width='w-8' />
            <SkeletonLoader height='h-8' width='w-20' />
          </div>
        </div>
      </div>
    </div>

    {/* Main Content Skeleton */}
    <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      {/* Welcome Section */}
      <SkeletonCard className='mb-8' />

      {/* Metrics Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonMetric key={index} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className='mb-8'>
        <SkeletonLoader height='h-6' width='w-32' className='mb-6' />
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>

      {/* Profile and Activity */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        <SkeletonProfile />
        <SkeletonCard />
      </div>
    </main>
  </div>
);

export default SkeletonLoader;
