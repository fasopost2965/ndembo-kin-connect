'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Variants mirror the Design System "Boutons" card:
//   Primaire  → #132730 bg / white
//   Accent    → #7CC8E8 bg / #0B2530
//   Secondaire→ #F1F5F9 bg / #334155
//   Contour   → 1.5px #E2E8F0 border
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7CC8E8] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // CTA principal : fond #07101A, texte or — utilisé sur tous les écrans
        primary: 'bg-[#07101A] text-[#FCD116] font-bold hover:bg-[#132730]',
        // Variante texte blanc (Design System "Primaire")
        dark: 'bg-[#132730] text-white hover:bg-[#07101A]',
        accent: 'bg-[#7CC8E8] text-[#0B2530] font-bold hover:bg-[#63b9dd]',
        gold: 'bg-gradient-to-br from-[#DAA520] to-[#F4C430] text-[#07101A] font-bold hover:opacity-90',
        secondary: 'bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] hover:bg-[#E2E8F0]',
        outline: 'border-[1.5px] border-[#E2E8F0] text-[#334155] hover:bg-[#F8FAFC]',
        ghost: 'text-[#334155] hover:bg-[#F1F5F9]',
        destructive: 'bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3] hover:bg-[#FDE4E4]',
      },
      size: {
        // 44px min touch target on mobile, slightly tighter on ≥sm screens.
        default: 'h-11 sm:h-10 px-5 py-2.5',
        sm: 'h-9 sm:h-8 px-3 text-xs',
        lg: 'h-11 px-6',
        icon: 'h-11 w-11 sm:h-9 sm:w-9',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />;
  }
);
Button.displayName = 'Button';

export { buttonVariants };
