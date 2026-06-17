import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth, checkRole } from '../../lib/rbac';
import { prisma } from '../../lib/prisma';

const clientSchema = z.object({
  nom: z.string().min(2),
  type: z.enum(['Club', 'Academie', 'Sponsor', 'Partenaire']),
  rccm: z.string().optional(),
  nif: z.string().optional(),
  email: z.string().email(),
  telephone: z.string(),
  adresse: z.string().optional(),
  ville: z.string(),
  secteurActivite: z.string().optional(),
  montantSponsorisation: z.number().optional(),
  contactNom: z.string().optional(),
  contactPoste: z.string().optional(),
});

export async function clientRoutes(server: FastifyInstance) {
  // GET /clients
  server.get('/', { preHandler: [requireAuth()] }, async (req) => {
    const query = req.query as { search?: string; type?: string; page?: string; limit?: string };
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const where = {
      ...(query.search && { nom: { contains: query.search, mode: 'insensitive' as const } }),
      ...(query.type && { type: query.type }),
    };
    const [data, total] = await Promise.all([
      prisma.client.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.client.count({ where }),
    ]);
    return { data, total, page, limit };
  });

  // POST /clients
  server.post('/', { preHandler: [checkRole('ADMIN', 'MANAGER', 'COMMERCIAL')] }, async (req, reply) => {
    const data = clientSchema.parse(req.body);
    const client = await prisma.client.create({ data });
    return reply.status(201).send(client);
  });

  // GET /clients/:id
  server.get('/:id', { preHandler: [requireAuth()] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        devis: { orderBy: { createdAt: 'desc' }, take: 5 },
        factures: { orderBy: { createdAt: 'desc' }, take: 5 },
        projets: { orderBy: { createdAt: 'desc' }, take: 5 },
        activites: { orderBy: { createdAt: 'desc' }, take: 10, include: { user: { select: { name: true } } } },
      },
    });
    if (!client) return reply.status(404).send({ message: 'Client non trouvé' });
    return client;
  });

  // GET /clients/:id/timeline
  server.get('/:id/timeline', { preHandler: [requireAuth()] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const [devis, factures, activites] = await Promise.all([
      prisma.devis.findMany({ where: { clientId: id }, orderBy: { createdAt: 'desc' } }),
      prisma.facture.findMany({ where: { clientId: id }, orderBy: { createdAt: 'desc' } }),
      prisma.activite.findMany({ where: { clientId: id }, orderBy: { dateActivite: 'desc' }, include: { user: { select: { name: true } } } }),
    ]);
    return { devis, factures, activites };
  });

  // PUT /clients/:id
  server.put('/:id', { preHandler: [checkRole('ADMIN', 'MANAGER', 'COMMERCIAL')] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const data = clientSchema.partial().parse(req.body);
    const client = await prisma.client.update({ where: { id }, data });
    return client;
  });
}

