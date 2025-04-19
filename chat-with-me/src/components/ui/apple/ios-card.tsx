'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const iosCardVariants = cva(
  'rounded-apple overflow-hidden transition-all duration-apple-medium',
  {
    variants: {
      variant: {
        default: 'bg-white dark:bg-gray-900 shadow-apple',
        outline: 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800',
        glass: 'backdrop-blur-apple-md bg-white/70 dark:bg-gray-900/70',
        flat: 'bg-gray-50 dark:bg-gray-800',
      },
      hover: {
        true: 'hover:shadow-apple-md hover:-translate-y-1',
        false: '',
      },
      padding: {
        none: 'p-0',
        sm: 'p-3',
        default: 'p-4',
        lg: 'p-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      hover: false,
      padding: 'default',
    },
  }
);

export interface IOSCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof iosCardVariants> {}

const IOSCard = React.forwardRef<HTMLDivElement, IOSCardProps>(
  ({ className, variant, hover, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(iosCardVariants({ variant, hover, padding, className }))}
      {...props}
    />
  )
);
IOSCard.displayName = 'IOSCard';

const IOSCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-4', className)}
    {...props}
  />
));
IOSCardHeader.displayName = 'IOSCardHeader';

const IOSCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
IOSCardTitle.displayName = 'IOSCardTitle';

const IOSCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-500 dark:text-gray-400', className)}
    {...props}
  />
));
IOSCardDescription.displayName = 'IOSCardDescription';

const IOSCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-4 pt-0', className)} {...props} />
));
IOSCardContent.displayName = 'IOSCardContent';

const IOSCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-4 pt-0', className)}
    {...props}
  />
));
IOSCardFooter.displayName = 'IOSCardFooter';

export {
  IOSCard,
  IOSCardHeader,
  IOSCardTitle,
  IOSCardDescription,
  IOSCardContent,
  IOSCardFooter,
};
