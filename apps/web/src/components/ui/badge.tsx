import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Status + level badges from the Design System "Badges" card.
const badgeVariants = cva(
  'inline-flex items-center rounded-lg px-3 py-[5px] text-xs font-bold leading-none',
  {
    variants: {
      variant: {
        // Statuts
        paid: 'bg-[#ECFDF5] text-[#0D9668]',
        pending: 'bg-[#FEF9EE] text-[#C9960C]',
        unpaid: 'bg-[#FEF2F2] text-[#DC2626]',
        progress: 'bg-[#EBF6FB] text-[#3A6B84]',
        draft: 'bg-[#F1F5F9] text-[#64748B]',
        // Niveau athlète
        pro: 'bg-[#F5F3FF] text-[#6D28D9]',
        semipro: 'bg-[#EFF6FF] text-[#2563EB]',
        amateur: 'bg-[#F1F5F9] text-[#64748B]',
      },
    },
    defaultVariants: { variant: 'draft' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/** Map athlete niveau enum → badge variant + label. */
export function niveauBadge(niveau: string): { variant: BadgeProps['variant']; label: string } {
  switch (niveau) {
    case 'PRO':
      return { variant: 'pro', label: 'Pro' };
    case 'SEMI_PRO':
      return { variant: 'semipro', label: 'Semi-pro' };
    case 'AMATEUR':
    default:
      return { variant: 'amateur', label: 'Amateur' };
  }
}

/** Map devis statut → badge variant + label. */
export function devisStatutBadge(statut: string): { variant: BadgeProps['variant']; label: string } {
  switch (statut) {
    case 'VALIDE':
      return { variant: 'progress', label: 'Validé' };
    case 'CONVERTI':
      return { variant: 'paid', label: 'Converti' };
    case 'REFUSE':
      return { variant: 'unpaid', label: 'Refusé' };
    case 'EN_ATTENTE':
    default:
      return { variant: 'pending', label: 'En attente' };
  }
}

/** Map facture statutPaiement → badge variant + label. */
export function factureStatutBadge(statut: string): { variant: BadgeProps['variant']; label: string } {
  switch (statut) {
    case 'PAYEE':
      return { variant: 'paid', label: 'Payée' };
    case 'PARTIELLE':
      return { variant: 'progress', label: 'Partielle' };
    case 'ACOMPTE_PERCU':
      return { variant: 'pending', label: 'Acompte perçu' };
    case 'IMPAYEE':
    default:
      return { variant: 'unpaid', label: 'Impayée' };
  }
}
