'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const iosInputVariants = cva(
  'flex w-full rounded-apple border border-gray-300 bg-white px-3 py-2 text-sm transition-all duration-apple-fast file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-primary',
  {
    variants: {
      variant: {
        default: '',
        filled: 'border-transparent bg-gray-100 dark:bg-gray-800 focus-visible:bg-white dark:focus-visible:bg-gray-900',
        outline: 'bg-transparent',
        glass: 'backdrop-blur-apple-md bg-white/70 dark:bg-gray-900/70',
      },
      size: {
        default: 'h-10',
        sm: 'h-8 px-2 text-xs',
        lg: 'h-12 px-4 text-base',
      },
      rounded: {
        default: 'rounded-apple',
        full: 'rounded-apple-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      rounded: 'default',
    },
  }
);

export interface IOSInputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof iosInputVariants> {
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  error?: boolean;
  errorMessage?: string;
}

const IOSInput = React.forwardRef<HTMLInputElement, IOSInputProps>(
  ({ 
    className, 
    variant, 
    size, 
    rounded,
    icon,
    iconPosition = 'left',
    error = false,
    errorMessage,
    type,
    ...props 
  }, ref) => {
    return (
      <div className="w-full">
        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              {icon}
            </div>
          )}
          
          <input
            type={type}
            className={cn(
              iosInputVariants({ variant, size, rounded }),
              icon && iconPosition === 'left' && 'pl-10',
              icon && iconPosition === 'right' && 'pr-10',
              error && 'border-error focus-visible:ring-error',
              className
            )}
            ref={ref}
            {...props}
          />
          
          {icon && iconPosition === 'right' && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              {icon}
            </div>
          )}
        </div>
        
        {error && errorMessage && (
          <p className="mt-1 text-xs text-error">{errorMessage}</p>
        )}
      </div>
    );
  }
);
IOSInput.displayName = 'IOSInput';

export { IOSInput };
