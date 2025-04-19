'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const iosButtonVariants = cva(
  'inline-flex items-center justify-center rounded-apple font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white hover:bg-primary/90 active:bg-primary/80',
        secondary: 'bg-secondary text-white hover:bg-secondary/90 active:bg-secondary/80',
        outline: 'border border-gray-300 bg-transparent hover:bg-gray-50 active:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-900 dark:active:bg-gray-800',
        ghost: 'bg-transparent hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-800 dark:active:bg-gray-700',
        link: 'text-primary underline-offset-4 hover:underline',
        danger: 'bg-error text-white hover:bg-error/90 active:bg-error/80',
        success: 'bg-success text-white hover:bg-success/90 active:bg-success/80',
        glass: 'backdrop-blur-apple-md bg-white/70 hover:bg-white/80 active:bg-white/90 dark:bg-black/70 dark:hover:bg-black/80 dark:active:bg-black/90',
      },
      size: {
        xs: 'h-7 rounded-apple-sm px-2 text-xs',
        sm: 'h-9 rounded-apple-md px-3 text-sm',
        default: 'h-10 rounded-apple-md px-4 py-2 text-sm',
        lg: 'h-11 rounded-apple-lg px-5 py-2 text-base',
        xl: 'h-12 rounded-apple-lg px-6 py-3 text-base',
        icon: 'h-10 w-10 rounded-apple-full',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      fullWidth: false,
    },
  }
);

export interface IOSButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iosButtonVariants> {
  asChild?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const IOSButton = React.forwardRef<HTMLButtonElement, IOSButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    fullWidth,
    asChild = false,
    loading = false,
    icon,
    iconPosition = 'left',
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? React.Fragment : 'button';
    const isDisabled = disabled || loading;
    
    return (
      <Comp
        className={cn(iosButtonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <svg 
            className="mr-2 h-4 w-4 animate-spin" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            ></circle>
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        
        {!loading && icon && iconPosition === 'left' && (
          <span className="mr-2">{icon}</span>
        )}
        
        {children}
        
        {!loading && icon && iconPosition === 'right' && (
          <span className="ml-2">{icon}</span>
        )}
      </Comp>
    );
  }
);
IOSButton.displayName = 'IOSButton';

export { IOSButton, iosButtonVariants };
