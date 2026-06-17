'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// Design System "Champs de saisie": 1.5px #E2E8F0 border, radius 10px,
// focus ring cyan #7CC8E8 + soft glow.
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-white px-[14px] py-[11px] text-sm text-[#0F172A] placeholder:text-[#94A3B8]',
        'focus:border-[#7CC8E8] focus:outline-none focus:ring-[3px] focus:ring-[#7CC8E8]/15',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';
