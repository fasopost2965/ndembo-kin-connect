import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { can } from '../../lib/rbac';
import { prisma } from '../../lib/prisma';

const reglementSchema = z.object({
  factureId: z.string(),
  montant: z.number().positive(),
  moyenPaiement: z.enum(['BANK', 'CARTE', 'MTN_MONEY', 'AIRTEL_MONEY', 'ORANGE_MONEY']),
  reference: z.string().optional(),
  dateReglement: z.string().optional(),
});

/** Recompute a facture's payment status from the sum of its règlements. */
function statutFor(totalRegle: number, montantTTC: number) {
  if (totalRegle >= montantTTC) return 'PAYEE' as const;
  if (totalRegle > 0) return 'PARTIELLE' as const;
  return 'IMPAYEE' as const;
}

export async function reglementRoutes(server: FastifyInstance) {
  // GET /reglements — optionally filtered by facture
  server.get('/', { preHandler: [can('reglements', 'read')] }, async (req) => {
    const { factureId } = req.query as { factureId?: string };
    return prisma.reglement.findMany({
      where: { ...(factureId && { factureId }) },
      orderBy: { dateReglement: 'desc' },
    });
  });

  // POST /reglements — record a payment and update the linked facture status
  server.post('/', { preHandler: [can('reglements', 'write')] }, async (req, reply) => {
    const body = reglementSchema.parse(req.body);

    const facture = await prisma.facture.findUnique({ where: { id: body.factureId } });
    if (!facture) return reply.status(404).send({ message: 'Facture non trouvée' });
    if (facture.statutPaiement === 'PAYEE') {
      return reply.status(400).send({ message: 'Cette facture est déjà soldée' });
    }

    const totalRegle = facture.acomptePercu + body.montant;
    if (totalRegle > facture.montantTTC + 0.01) {
      return reply.status(400).send({
        message: `Le montant dépasse le solde restant (${facture.montantTTC - facture.acomptePercu})`,
      });
    }

    const [reglement] = await prisma.$transaction([
      prisma.reglement.create({
        data: {
          factureId: body.factureId,
          montant: body.montant,
          moyenPaiement: body.moyenPaiement,
          reference: body.reference,
          ...(body.dateReglement && { dateReglement: new Date(body.dateReglement) }),
        },
      }),
      prisma.facture.update({
        where: { id: body.factureId },
        data: { acomptePercu: totalRegle, statutPaiement: statutFor(totalRegle, facture.montantTTC) },
      }),
    ]);

    return reply.status(201).send(reglement);
  });
}
