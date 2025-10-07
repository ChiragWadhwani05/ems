import * as React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const baseStyles =
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
  const variantStyles = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
    outline: 'text-foreground border border-border',
  };

  return (
    <span
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    />
  );
}

export { Badge };
