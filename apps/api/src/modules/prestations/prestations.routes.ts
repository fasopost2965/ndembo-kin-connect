import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { can, requireAuth } from '../../lib/rbac';
import { prisma } from '../../lib/prisma';

const prestationSchema = z.object({
  nom: z.string().min(2),
  type: z.enum(['Conseil', 'Gestion_carriere', 'Camp', 'Stage']),
  prixBase: z.number().min(0),
  dureeEstimee: z.string().optional(),
  description: z.string().optional(),
});

export async function prestationRoutes(server: FastifyInstance) {
  // GET /prestations — catalogue (any authenticated user; feeds the devis editor)
  server.get('/', { preHandler: [requireAuth] }, async (req) => {
    const { actives } = req.query as { actives?: string };
    return prisma.prestation.findMany({
      where: { ...(actives === 'true' && { isActive: true }) },
      orderBy: { nom: 'asc' },
    });
  });

  // POST /prestations — Devis/Factures write scope manages the catalogue
  server.post('/', { preHandler: [can('devisFactures', 'write')] }, async (req, reply) => {
    const data = prestationSchema.parse(req.body);
    const prestation = await prisma.prestation.create({ data });
    return reply.status(201).send(prestation);
  });

  // PATCH /prestations/:id — edit / activate-deactivate
  server.patch('/:id', { preHandler: [can('devisFactures', 'write')] }, async (req) => {
    const { id } = req.params as { id: string };
    const data = prestationSchema.partial().extend({ isActive: z.boolean().optional() }).parse(req.body);
    return prisma.prestation.update({ where: { id }, data });
  });

  // DELETE /prestations/:id — remove
  server.delete('/:id', { preHandler: [can('devisFactures', 'write')] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    await prisma.prestation.delete({ where: { id } });
    return reply.status(204).send();
  });
}
