import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma';
import { mapStatus } from '../../lib/flexpay';
import { confirmReglement, failReglement } from '../../lib/reglements';

/**
 * Public webhook endpoints (no JWT — called server-to-server by providers).
 * FlexPay POSTs the transaction result to FLEXPAY_CALLBACK_URL once the
 * customer validates (or rejects) the Mobile Money push.
 */
export async function webhookRoutes(server: FastifyInstance) {
  // POST /webhooks/flexpay
  server.post('/flexpay', async (req, reply) => {
    const body = (req.body ?? {}) as {
      orderNumber?: string;
      code?: string;
      transaction?: { status?: string; orderNumber?: string };
    };
    const orderNumber = body.orderNumber || body.transaction?.orderNumber;
    if (!orderNumber) return reply.status(400).send({ message: 'orderNumber manquant' });

    const reglement = await prisma.reglement.findFirst({ where: { orderNumber } });
    // Always ack 200 so FlexPay stops retrying, even for unknown orders.
    if (!reglement) return reply.status(200).send({ received: true, matched: false });

    const status = mapStatus(body.code, body.transaction?.status);
    if (status === 'SUCCESS') await confirmReglement(reglement.id);
    else if (status === 'FAILED') await failReglement(reglement.id);

    req.log.info({ orderNumber, status }, 'FlexPay webhook reconciled');
    return reply.status(200).send({ received: true, matched: true, status });
  });
}
