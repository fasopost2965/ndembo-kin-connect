import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { can } from '../../lib/rbac';
import { prisma } from '../../lib/prisma';

const COLONNES = ['TODO', 'EN_COURS', 'EN_ATTENTE', 'TERMINE'] as const;
const PRIORITES = ['BASSE', 'NORMALE', 'HAUTE', 'URGENTE'] as const;

export async function tacheRoutes(server: FastifyInstance) {
  // POST /taches — create a task in a project column
  server.post('/', { preHandler: [can('projetsTaches', 'write')] }, async (req, reply) => {
    const body = z.object({
      projetId: z.string(),
      titre: z.string().min(1),
      description: z.string().optional(),
      colonne: z.enum(COLONNES).default('TODO'),
      assigneeId: z.string().optional(),
      priorite: z.enum(PRIORITES).default('NORMALE'),
      dateEcheance: z.string().optional(),
    }).parse(req.body);

    // Append at the end of the target column.
    const count = await prisma.tache.count({ where: { projetId: body.projetId, colonne: body.colonne } });
    const tache = await prisma.tache.create({
      data: {
        projetId: body.projetId,
        titre: body.titre,
        description: body.description,
        colonne: body.colonne,
        position: count,
        assigneeId: body.assigneeId,
        priorite: body.priorite,
        ...(body.dateEcheance && { dateEcheance: new Date(body.dateEcheance) }),
      },
      include: { assignee: { select: { id: true, name: true } } },
    });
    return reply.status(201).send(tache);
  });

  // PATCH /taches/:id/move — drag & drop persistence
  server.patch('/:id/move', { preHandler: [can('projetsTaches', 'write')] }, async (req) => {
    const { id } = req.params as { id: string };
    const { colonne, position } = z.object({
      colonne: z.enum(COLONNES),
      position: z.number().int().min(0),
    }).parse(req.body);
    return prisma.tache.update({
      where: { id },
      data: { colonne, position },
      include: { assignee: { select: { id: true, name: true } } },
    });
  });

  // PATCH /taches/:id — edit task fields
  server.patch('/:id', { preHandler: [can('projetsTaches', 'write')] }, async (req) => {
    const { id } = req.params as { id: string };
    const data = z.object({
      titre: z.string().min(1).optional(),
      description: z.string().optional(),
      assigneeId: z.string().nullable().optional(),
      priorite: z.enum(PRIORITES).optional(),
      pourcentageAvancement: z.number().int().min(0).max(100).optional(),
      dateEcheance: z.string().optional(),
    }).parse(req.body);
    return prisma.tache.update({ where: { id }, data });
  });

  // DELETE /taches/:id
  server.delete('/:id', { preHandler: [can('projetsTaches', 'write')] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    await prisma.tache.delete({ where: { id } });
    return reply.status(204).send();
  });
}
