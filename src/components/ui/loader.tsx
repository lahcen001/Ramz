import React from 'react';
import { cn } from '@/lib/utils';
import { Target, Loader2 } from 'lucide-react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'brand';
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl'
};

export function Loader({ 
  size = 'md', 
  variant = 'spinner', 
  text, 
  className, 
  fullScreen = false 
}: LoaderProps) {
  const LoaderContent = () => {
    switch (variant) {
      case 'spinner':
        return (
          <Loader2 className={cn(sizeClasses[size], 'animate-spin text-blue-600', className)} />
        );
      
      case 'dots':
        return (
          <div className="flex space-x-1">
            <div className={cn('rounded-full bg-blue-600 animate-bounce', 
              size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-5 h-5'
            )} style={{ animationDelay: '0ms' }}></div>
            <div className={cn('rounded-full bg-blue-600 animate-bounce', 
              size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-5 h-5'
            )} style={{ animationDelay: '150ms' }}></div>
            <div className={cn('rounded-full bg-blue-600 animate-bounce', 
              size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-5 h-5'
            )} style={{ animationDelay: '300ms' }}></div>
          </div>
        );
      
      case 'pulse':
        return (
          <div className={cn(
            'rounded-full bg-blue-600 animate-pulse',
            sizeClasses[size],
            className
          )}></div>
        );
      
      case 'brand':
        return (
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25 animate-pulse"></div>
            <div className="relative bg-white rounded-lg p-2 shadow-lg">
              <Target className={cn(sizeClasses[size], 'text-blue-600 animate-spin')} />
            </div>
          </div>
        );
      
      default:
        return (
          <Loader2 className={cn(sizeClasses[size], 'animate-spin text-blue-600', className)} />
        );
    }
  };

  const content = (
    <div className={cn(
      'flex flex-col items-center justify-center gap-3',
      fullScreen ? 'min-h-screen' : 'p-6'
    )}>
      <LoaderContent />
      {text && (
        <p className={cn(
          'text-gray-600 text-center animate-pulse',
          textSizeClasses[size]
        )}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
}

// Specialized loading screens
export function PageLoader({ text }: { text?: string }) {
  return (
    <div className="h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-8 text-center max-w-sm w-full">
        <Loader variant="brand" size="lg" text={text} />
      </div>
    </div>
  );
}

export function CardLoader({ text }: { text?: string }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
      <Loader variant="spinner" size="md" text={text} />
    </div>
  );
}

export function ButtonLoader({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  return (
    <Loader2 className={cn(
      'animate-spin',
      size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
    )} />
  );
}

// Default export for better compatibility
export default Loader; 