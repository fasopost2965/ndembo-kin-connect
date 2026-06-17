import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth, checkRole } from '../../lib/rbac';
import { prisma } from '../../lib/prisma';
import { nextNumero } from '../../lib/sequences';

const ligneSchema = z.object({
  prestationId: z.string().optional(),
  designation: z.string(),
  quantite: z.number().min(1),
  prixUnit: z.number().min(0),
  total: z.number(),
});

const devisCreateSchema = z.object({
  clientId: z.string(),
  lignes: z.array(ligneSchema).min(1),
  tva: z.number().default(16),
  notes: z.string().optional(),
  validiteJours: z.number().default(30),
});

export async function devisRoutes(server: FastifyInstance) {
  // GET /devis
  server.get('/', { preHandler: [requireAuth()] }, async (req) => {
    const query = req.query as { clientId?: string; statut?: string; page?: string };
    const page = Number(query.page) || 1;
    const [data, total] = await Promise.all([
      prisma.devis.findMany({
        where: { ...(query.clientId && { clientId: query.clientId }), ...(query.statut && { statut: query.statut as never }) },
        include: { client: { select: { nom: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * 20, take: 20,
      }),
      prisma.devis.count({ where: { ...(query.clientId && { clientId: query.clientId }) } }),
    ]);
    return { data, total, page, limit: 20 };
  });

  // POST /devis
  server.post('/', { preHandler: [checkRole('ADMIN', 'MANAGER', 'COMMERCIAL')] }, async (req, reply) => {
    const body = devisCreateSchema.parse(req.body);
    const montantHT = body.lignes.reduce((s, l) => s + l.total, 0);
    const montantTTC = montantHT * (1 + body.tva / 100);
    const numero = await nextNumero('DEVIS');
    const devis = await prisma.devis.create({
      data: { ...body, lignes: body.lignes as never, montantHT, montantTTC, numero },
    });
    return reply.status(201).send(devis);
  });

  // GET /devis/:id
  server.get('/:id', { preHandler: [requireAuth()] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const devis = await prisma.devis.findUnique({ where: { id }, include: { client: true } });
    if (!devis) return reply.status(404).send({ message: 'Devis non trouvé' });
    return devis;
  });

  // GET /devis/:id/pdf  — returns PDF URL or triggers generation
  server.get('/:id/pdf', { preHandler: [requireAuth()] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const devis = await prisma.devis.findUnique({ where: { id }, include: { client: true } });
    if (!devis) return reply.status(404).send({ message: 'Devis non trouvé' });
    // TODO: integrate React-PDF / Puppeteer for generation
    return { pdfUrl: devis.pdfUrl || null, message: 'PDF generation à implémenter (Étape 05)' };
  });

  // POST /devis/:id/convert — convert to facture
  server.post('/:id/convert', { preHandler: [checkRole('ADMIN', 'MANAGER', 'COMMERCIAL')] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const devis = await prisma.devis.findUnique({ where: { id } });
    if (!devis) return reply.status(404).send({ message: 'Devis non trouvé' });
    if (devis.statut !== 'VALIDE') return reply.status(400).send({ message: 'Le devis doit être validé avant conversion' });

    const numero = await nextNumero('FACTURE');
    const facture = await prisma.$transaction(async (tx) => {
      await tx.devis.update({ where: { id }, data: { statut: 'CONVERTI' } });
      return tx.facture.create({
        data: {
          numero,
          clientId: devis.clientId,
          devisId: devis.id,
          lignes: devis.lignes as never,
          montantHT: devis.montantHT,
          tva: devis.tva,
          montantTTC: devis.montantTTC,
        },
      });
    });
    return reply.status(201).send(facture);
  });

  // PATCH /devis/:id/statut
  server.patch('/:id/statut', { preHandler: [checkRole('ADMIN', 'MANAGER', 'COMMERCIAL')] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { statut } = z.object({ statut: z.enum(['EN_ATTENTE', 'VALIDE', 'REFUSE']) }).parse(req.body);
    const devis = await prisma.devis.update({ where: { id }, data: { statut } });
    return devis;
  });
}

