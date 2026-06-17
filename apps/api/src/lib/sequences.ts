import { prisma } from './prisma';

const PREFIXES = {
  DEVIS: 'DEV',
  FACTURE: 'FACT',
  PROJET: 'PROJ',
  CONTRAT: 'CONT',
};

export async function nextNumero(type: keyof typeof PREFIXES): Promise<string> {
  const annee = new Date().getFullYear();
  const seq = await prisma.sequence.upsert({
    where: { type },
    create: { type, prefixe: PREFIXES[type], annee, valeur: 1 },
    update: {
      valeur: { increment: 1 },
      annee,
    },
  });
  const num = String(seq.valeur).padStart(3, '0');
  return `${PREFIXES[type]}-${annee}-${num}`;
}
