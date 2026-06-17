import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { can } from '../../lib/rbac';
import { prisma } from '../../lib/prisma';
import { nextNumero } from '../../lib/sequences';

export async function projetRoutes(server: FastifyInstance) {
  // GET /projets
  server.get('/', { preHandler: [can('projetsTaches', 'read')] }, async (req) => {
    const query = req.query as { clientId?: string; statut?: string; page?: string };
    const page = Number(query.page) || 1;
    const [data, total] = await Promise.all([
      prisma.projet.findMany({
        where: {
          ...(query.clientId && { clientId: query.clientId }),
          ...(query.statut && { statut: query.statut as never }),
        },
        include: { client: { select: { nom: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * 20, take: 20,
      }),
      prisma.projet.count(),
    ]);
    return { data, total, page, limit: 20 };
  });

  // POST /projets
  server.post('/', { preHandler: [can('projetsTaches', 'write')] }, async (req, reply) => {
    const body = z.object({
      clientId: z.string(),
      factureId: z.string().optional(),
      objet: z.string(),
      typeProjet: z.enum(['gestion_carriere', 'camp', 'stage']),
      dateDebut: z.string(),
      dateFin: z.string().optional(),
      budgetTotal: z.number(),
      notes: z.string().optional(),
    }).parse(req.body);
    const numero = await nextNumero('PROJET');
    const projet = await prisma.projet.create({ data: { ...body, dateDebut: new Date(body.dateDebut), dateFin: body.dateFin ? new Date(body.dateFin) : undefined, numero } });
    return reply.status(201).send(projet);
  });

  // GET /projets/:id
  server.get('/:id', { preHandler: [can('projetsTaches', 'read')] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const projet = await prisma.projet.findUnique({
      where: { id },
      include: { client: true, taches: { include: { assignee: { select: { name: true } } } }, jalons: true },
    });
    if (!projet) return reply.status(404).send({ message: 'Projet non trouvé' });
    return projet;
  });

  // GET /projets/:id/kanban
  server.get('/:id/kanban', { preHandler: [can('projetsTaches', 'read')] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const taches = await prisma.tache.findMany({
      where: { projetId: id },
      include: { assignee: { select: { name: true, id: true } } },
      orderBy: { position: 'asc' },
    });
    const kanban = {
      TODO: taches.filter(t => t.colonne === 'TODO'),
      EN_COURS: taches.filter(t => t.colonne === 'EN_COURS'),
      EN_ATTENTE: taches.filter(t => t.colonne === 'EN_ATTENTE'),
      TERMINE: taches.filter(t => t.colonne === 'TERMINE'),
    };
    return kanban;
  });
}

