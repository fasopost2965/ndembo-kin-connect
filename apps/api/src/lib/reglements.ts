import { prisma } from './prisma';

/** Recompute a facture's payment status from a running total. */
export function statutFor(totalRegle: number, montantTTC: number) {
  if (totalRegle >= montantTTC) return 'PAYEE' as const;
  if (totalRegle > 0) return 'PARTIELLE' as const;
  return 'IMPAYEE' as const;
}

/**
 * Confirm a PENDING règlement (e.g. a Mobile Money payment that settled):
 * mark it CONFIRME and roll its amount into the facture's acompte + status.
 * Idempotent — a règlement that isn't PENDING is left untouched.
 */
export async function confirmReglement(reglementId: string): Promise<'applied' | 'noop' | 'notfound'> {
  return prisma.$transaction(async (tx) => {
    const reglement = await tx.reglement.findUnique({ where: { id: reglementId } });
    if (!reglement) return 'notfound';
    if (reglement.statut !== 'PENDING') return 'noop';

    const facture = await tx.facture.findUniqueOrThrow({ where: { id: reglement.factureId } });
    const totalRegle = facture.acomptePercu + reglement.montant;

    await tx.reglement.update({ where: { id: reglementId }, data: { statut: 'CONFIRME' } });
    await tx.facture.update({
      where: { id: facture.id },
      data: { acomptePercu: totalRegle, statutPaiement: statutFor(totalRegle, facture.montantTTC) },
    });
    return 'applied';
  });
}

/** Mark a PENDING règlement as failed (no facture change). */
export async function failReglement(reglementId: string): Promise<void> {
  await prisma.reglement.updateMany({
    where: { id: reglementId, statut: 'PENDING' },
    data: { statut: 'ECHEC' },
  });
}
