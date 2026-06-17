import { prisma } from './prisma';

const DEFAULT_PREFIXES: Record<string, string> = {
  DEVIS: 'DEV',
  FACTURE: 'FACT',
  PROJET: 'PROJ',
  CONTRAT: 'CONT',
};

export type SequenceType = keyof typeof DEFAULT_PREFIXES;

/**
 * Generates the next document number atomically: `PREFIXE-ANNEE-NNN`
 * (e.g. DEV-2026-001). The prefix + counter live in the `Sequence` table
 * (seeded from Settings). The counter resets to 1 when the year rolls over.
 */
export async function nextNumero(type: SequenceType): Promise<string> {
  const annee = new Date().getFullYear();

  const seq = await prisma.$transaction(async (tx) => {
    const existing = await tx.sequence.findUnique({ where: { type } });

    // New sequence, or a new year → start the counter at 1.
    if (!existing || existing.annee !== annee) {
      return tx.sequence.upsert({
        where: { type },
        create: { type, prefixe: DEFAULT_PREFIXES[type], annee, valeur: 1 },
        update: { annee, valeur: 1 },
      });
    }

    return tx.sequence.update({
      where: { type },
      data: { valeur: { increment: 1 } },
    });
  });

  const num = String(seq.valeur).padStart(3, '0');
  return `${seq.prefixe}-${seq.annee}-${num}`;
}
