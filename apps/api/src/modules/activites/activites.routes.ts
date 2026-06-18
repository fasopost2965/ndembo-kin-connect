import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { can, requireAuth } from '../../lib/rbac';
import { prisma } from '../../lib/prisma';

const TYPES = ['APPEL', 'RENCONTRE', 'EMAIL'] as const;
const STATUTS = ['PLANIFIE', 'REALISE', 'ANNULE'] as const;

const activiteSchema = z.object({
  clientId: z.string(),
  projetId: z.string().optional(),
  type: z.enum(TYPES),
  dateActivite: z.string(),
  statut: z.enum(STATUTS).default('REALISE'),
  resultat: z.string().optional(),
  nextAction: z.string().optional(),
  dateNextAction: z.string().optional(),
});

export async function activiteRoutes(server: FastifyInstance) {
  // GET /activites — CRM interaction journal (any authenticated user can read)
  server.get('/', { preHandler: [requireAuth] }, async (req) => {
    const { clientId, projetId } = req.query as { clientId?: string; projetId?: string };
    return prisma.activite.findMany({
      where: { ...(clientId && { clientId }), ...(projetId && { projetId }) },
      orderBy: { dateActivite: 'desc' },
      take: 100,
      include: {
        client: { select: { id: true, nom: true } },
        projet: { select: { id: true, objet: true } },
        user: { select: { id: true, name: true } },
      },
    });
  });

  // POST /activites — log a client interaction (Clients write scope)
  server.post('/', { preHandler: [can('clients', 'write')] }, async (req, reply) => {
    const body = activiteSchema.parse(req.body);
    const { userId } = req.user as { userId: string };
    const activite = await prisma.activite.create({
      data: {
        clientId: body.clientId,
        userId,
        type: body.type,
        dateActivite: new Date(body.dateActivite),
        statut: body.statut,
        ...(body.projetId && { projetId: body.projetId }),
        ...(body.resultat && { resultat: body.resultat }),
        ...(body.nextAction && { nextAction: body.nextAction }),
        ...(body.dateNextAction && { dateNextAction: new Date(body.dateNextAction) }),
      },
      include: {
        client: { select: { id: true, nom: true } },
        user: { select: { id: true, name: true } },
      },
    });
    return reply.status(201).send(activite);
  });

  // DELETE /activites/:id
  server.delete('/:id', { preHandler: [can('clients', 'write')] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    await prisma.activite.delete({ where: { id } });
    return reply.status(204).send();
  });
}
