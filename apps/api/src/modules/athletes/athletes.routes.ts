import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth, checkRole } from '../../lib/rbac';
import { prisma } from '../../lib/prisma';

const athleteSchema = z.object({
  nom: z.string().min(2),
  prenom: z.string().min(2),
  sport: z.string(),
  poste: z.string(),
  niveau: z.enum(['AMATEUR', 'SEMI_PRO', 'PRO']),
  clubActuel: z.string().optional(),
  valeurMarchande: z.number().optional(),
  nationalite: z.string().default('RDC'),
  telephone: z.string().optional(),
  email: z.string().email().optional(),
  priorityScouting: z.enum(['HAUTE', 'NORMALE', 'BASSE']).optional(),
});

export async function athleteRoutes(server: FastifyInstance) {
  // GET /athletes
  server.get('/', { preHandler: [requireAuth()] }, async (req) => {
    const query = req.query as { search?: string; sport?: string; niveau?: string; page?: string; limit?: string };
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where = {
      ...(query.search && {
        OR: [
          { nom: { contains: query.search, mode: 'insensitive' as const } },
          { prenom: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
      ...(query.sport && { sport: query.sport }),
      ...(query.niveau && { niveau: query.niveau as 'AMATEUR' | 'SEMI_PRO' | 'PRO' }),
    };

    const [data, total] = await Promise.all([
      prisma.athlete.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.athlete.count({ where }),
    ]);

    return { data, total, page, limit };
  });

  // POST /athletes
  server.post('/', { preHandler: [checkRole('ADMIN', 'MANAGER', 'COACH')] }, async (req, reply) => {
    const data = athleteSchema.parse(req.body);
    const athlete = await prisma.athlete.create({ data });
    return reply.status(201).send(athlete);
  });

  // GET /athletes/:id
  server.get('/:id', { preHandler: [requireAuth()] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const athlete = await prisma.athlete.findUnique({
      where: { id },
      include: { contrats: { include: { client: true } } },
    });
    if (!athlete) return reply.status(404).send({ message: 'Athlète non trouvé' });
    return athlete;
  });

  // PUT /athletes/:id
  server.put('/:id', { preHandler: [checkRole('ADMIN', 'MANAGER', 'COACH')] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const data = athleteSchema.partial().parse(req.body);
    const athlete = await prisma.athlete.update({ where: { id }, data });
    return athlete;
  });

  // DELETE /athletes/:id
  server.delete('/:id', { preHandler: [checkRole('ADMIN')] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    await prisma.athlete.delete({ where: { id } });
    return reply.status(204).send();
  });
}

