'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const iosTabsListVariants = cva(
  'inline-flex items-center justify-center rounded-apple overflow-hidden transition-all duration-apple-medium',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 p-1 dark:bg-gray-800',
        outline: 'border border-gray-200 p-1 dark:border-gray-800',
        pills: 'space-x-1',
        underline: 'border-b border-gray-200 dark:border-gray-800',
        glass: 'backdrop-blur-apple-md bg-white/70 p-1 dark:bg-gray-900/70',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      fullWidth: false,
    },
  }
);

const iosTabsTriggerVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'rounded-apple data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900',
        outline: 'rounded-apple data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900',
        pills: 'rounded-apple-full bg-transparent hover:bg-gray-100 data-[state=active]:bg-primary data-[state=active]:text-white dark:hover:bg-gray-800',
        underline: 'rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 data-[state=active]:border-primary',
        glass: 'rounded-apple data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900',
      },
      fullWidth: {
        true: 'flex-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      fullWidth: false,
    },
  }
);

const IOSTabs = TabsPrimitive.Root;

const IOSTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & 
    VariantProps<typeof iosTabsListVariants>
>(({ className, variant, fullWidth, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(iosTabsListVariants({ variant, fullWidth, className }))}
    {...props}
  />
));
IOSTabsList.displayName = 'IOSTabsList';

const IOSTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> &
    VariantProps<typeof iosTabsTriggerVariants>
>(({ className, variant, fullWidth, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(iosTabsTriggerVariants({ variant, fullWidth, className }))}
    {...props}
  />
));
IOSTabsTrigger.displayName = 'IOSTabsTrigger';

const IOSTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
));
IOSTabsContent.displayName = 'IOSTabsContent';

export { IOSTabs, IOSTabsList, IOSTabsTrigger, IOSTabsContent };
