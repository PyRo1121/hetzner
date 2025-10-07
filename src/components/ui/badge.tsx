'use client';

import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-albion-gray-800 text-albion-gray-300',
        primary: 'bg-neon-blue/20 text-neon-blue',
        success: 'bg-neon-green/20 text-neon-green',
        warning: 'bg-neon-gold/20 text-neon-gold',
        danger: 'bg-red-500/20 text-red-500',
        info: 'bg-blue-500/20 text-blue-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={badgeVariants({ variant, className })} {...props} />;
}
