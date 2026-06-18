import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { can } from '../../lib/rbac';
import { prisma } from '../../lib/prisma';

const STATUTS = ['planifie', 'en_cours', 'termine', 'retard'] as const;

const jalonSchema = z.object({
  projetId: z.string(),
  nom: z.string().min(1),
  datePrevis: z.string(),
  dateReelle: z.string().optional(),
  statut: z.enum(STATUTS).default('planifie'),
});

export async function jalonRoutes(server: FastifyInstance) {
  // GET /jalons — list milestones (optionally filtered by project), with project + client
  server.get('/', { preHandler: [can('projetsTaches', 'read')] }, async (req) => {
    const { projetId } = req.query as { projetId?: string };
    return prisma.jalon.findMany({
      where: { ...(projetId && { projetId }) },
      orderBy: [{ projetId: 'asc' }, { datePrevis: 'asc' }],
      include: {
        projet: { select: { id: true, objet: true, numero: true, client: { select: { nom: true } } } },
      },
    });
  });

  // POST /jalons
  server.post('/', { preHandler: [can('projetsTaches', 'write')] }, async (req, reply) => {
    const body = jalonSchema.parse(req.body);
    const jalon = await prisma.jalon.create({
      data: {
        projetId: body.projetId,
        nom: body.nom,
        datePrevis: new Date(body.datePrevis),
        statut: body.statut,
        ...(body.dateReelle && { dateReelle: new Date(body.dateReelle) }),
      },
    });
    return reply.status(201).send(jalon);
  });

  // PATCH /jalons/:id — edit / mark reached
  server.patch('/:id', { preHandler: [can('projetsTaches', 'write')] }, async (req) => {
    const { id } = req.params as { id: string };
    const body = z.object({
      nom: z.string().min(1).optional(),
      datePrevis: z.string().optional(),
      dateReelle: z.string().nullable().optional(),
      statut: z.enum(STATUTS).optional(),
    }).parse(req.body);
    return prisma.jalon.update({
      where: { id },
      data: {
        ...(body.nom !== undefined && { nom: body.nom }),
        ...(body.datePrevis && { datePrevis: new Date(body.datePrevis) }),
        ...(body.dateReelle !== undefined && { dateReelle: body.dateReelle ? new Date(body.dateReelle) : null }),
        ...(body.statut && { statut: body.statut }),
      },
    });
  });

  // DELETE /jalons/:id
  server.delete('/:id', { preHandler: [can('projetsTaches', 'write')] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    await prisma.jalon.delete({ where: { id } });
    return reply.status(204).send();
  });
}
