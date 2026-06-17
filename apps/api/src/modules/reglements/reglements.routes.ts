import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { can } from '../../lib/rbac';
import { prisma } from '../../lib/prisma';
import { statutFor, confirmReglement, failReglement } from '../../lib/reglements';
import { initiatePayment, checkStatus } from '../../lib/flexpay';

const reglementSchema = z.object({
  factureId: z.string(),
  montant: z.number().positive(),
  moyenPaiement: z.enum(['BANK', 'CARTE', 'MTN_MONEY', 'AIRTEL_MONEY', 'ORANGE_MONEY']),
  reference: z.string().optional(),
  dateReglement: z.string().optional(),
});

const initiateSchema = z.object({
  factureId: z.string(),
  montant: z.number().positive(),
  moyenPaiement: z.enum(['MTN_MONEY', 'AIRTEL_MONEY', 'ORANGE_MONEY']),
  phone: z.string().min(9),
});

type Facture = NonNullable<Awaited<ReturnType<typeof prisma.facture.findUnique>>>;
type PayableCheck =
  | { ok: true; facture: Facture }
  | { ok: false; status: 400 | 404; message: string };

/** Guard: amount must not exceed the facture's remaining balance. */
async function assertPayable(factureId: string, montant: number): Promise<PayableCheck> {
  const facture = await prisma.facture.findUnique({ where: { id: factureId } });
  if (!facture) return { ok: false, status: 404, message: 'Facture non trouvée' };
  if (facture.statutPaiement === 'PAYEE') return { ok: false, status: 400, message: 'Cette facture est déjà soldée' };
  if (facture.acomptePercu + montant > facture.montantTTC + 0.01) {
    return { ok: false, status: 400, message: `Le montant dépasse le solde restant (${facture.montantTTC - facture.acomptePercu})` };
  }
  return { ok: true, facture };
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

  // POST /reglements — record a manual (already-settled) payment
  server.post('/', { preHandler: [can('reglements', 'write')] }, async (req, reply) => {
    const body = reglementSchema.parse(req.body);
    const check = await assertPayable(body.factureId, body.montant);
    if (!check.ok) return reply.status(check.status).send({ message: check.message });

    const totalRegle = check.facture.acomptePercu + body.montant;
    const [reglement] = await prisma.$transaction([
      prisma.reglement.create({
        data: {
          factureId: body.factureId,
          montant: body.montant,
          moyenPaiement: body.moyenPaiement,
          reference: body.reference,
          statut: 'CONFIRME',
          ...(body.dateReglement && { dateReglement: new Date(body.dateReglement) }),
        },
      }),
      prisma.facture.update({
        where: { id: body.factureId },
        data: { acomptePercu: totalRegle, statutPaiement: statutFor(totalRegle, check.facture.montantTTC) },
      }),
    ]);
    return reply.status(201).send(reglement);
  });

  // POST /reglements/initiate — push a Mobile Money request via FlexPay
  server.post('/initiate', { preHandler: [can('reglements', 'write')] }, async (req, reply) => {
    const body = initiateSchema.parse(req.body);
    const check = await assertPayable(body.factureId, body.montant);
    if (!check.ok) return reply.status(check.status).send({ message: check.message });

    // Create the règlement as PENDING first so the orderNumber can reference it.
    const pending = await prisma.reglement.create({
      data: {
        factureId: body.factureId,
        montant: body.montant,
        moyenPaiement: body.moyenPaiement,
        statut: 'PENDING',
        reference: body.phone,
      },
    });

    try {
      const result = await initiatePayment({
        phone: body.phone,
        amount: body.montant,
        reference: pending.id,
      });
      const updated = await prisma.reglement.update({
        where: { id: pending.id },
        data: { orderNumber: result.orderNumber },
      });
      return reply.status(201).send({
        reglementId: updated.id,
        orderNumber: result.orderNumber,
        statut: 'PENDING',
        mock: result.mock,
        message: result.message,
      });
    } catch (e) {
      await failReglement(pending.id);
      return reply.status(502).send({ message: (e as Error).message || 'Échec FlexPay' });
    }
  });

  // GET /reglements/status/:orderNumber — poll FlexPay and reconcile
  server.get('/status/:orderNumber', { preHandler: [can('reglements', 'read')] }, async (req, reply) => {
    const { orderNumber } = req.params as { orderNumber: string };
    const reglement = await prisma.reglement.findFirst({ where: { orderNumber } });
    if (!reglement) return reply.status(404).send({ message: 'Transaction inconnue' });

    // Already reconciled → return stored state.
    if (reglement.statut !== 'PENDING') {
      return { orderNumber, statut: reglement.statut, reglementId: reglement.id };
    }

    const flexStatus = await checkStatus(orderNumber);
    if (flexStatus === 'SUCCESS') await confirmReglement(reglement.id);
    else if (flexStatus === 'FAILED') await failReglement(reglement.id);

    const fresh = await prisma.reglement.findUniqueOrThrow({ where: { id: reglement.id } });
    return { orderNumber, statut: fresh.statut, reglementId: fresh.id };
  });
}
