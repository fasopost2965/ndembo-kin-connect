import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { can } from '../../lib/rbac';
import { prisma } from '../../lib/prisma';
import { nextNumero } from '../../lib/sequences';

export async function contratRoutes(server: FastifyInstance) {
  // POST /contrats/generate
  server.post('/generate', { preHandler: [can('contrats', 'write')] }, async (req, reply) => {
    const body = z.object({
      clientId: z.string(),
      projetId: z.string().optional(),
      athleteId: z.string().optional(),
      typeContrat: z.string(),
    }).parse(req.body);

    const numero = await nextNumero('CONTRAT');
    const contenu = {
      article1: 'Objet du contrat',
      article2: 'Durée et prise d\'effet',
      article3: 'Obligations de Ndembo Kin Connect',
      article4: 'Obligations du Client/Athlète',
      article5: 'Rémunération et modalités de paiement',
      article6: 'Exclusivité et non-concurrence',
      article7: 'Droits à l\'image et communication',
      article8: 'Confidentialité',
      article9: 'Propriété intellectuelle',
      article10: 'Résiliation',
      article11: 'Force majeure',
      article12: 'Litiges et juridiction applicable',
      article13: 'Dispositions finales',
    };

    const contrat = await prisma.contrat.create({
      data: { ...body, numero, contenu },
      include: { client: true },
    });
    return reply.status(201).send(contrat);
  });

  // GET /contrats
  server.get('/', { preHandler: [can('contrats', 'read')] }, async (req) => {
    const query = req.query as { clientId?: string; statut?: string; page?: string };
    const page = Number(query.page) || 1;
    const [data, total] = await Promise.all([
      prisma.contrat.findMany({
        where: {
          ...(query.clientId && { clientId: query.clientId }),
          ...(query.statut && { statut: query.statut as never }),
        },
        include: { client: { select: { nom: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * 20, take: 20,
      }),
      prisma.contrat.count(),
    ]);
    return { data, total, page, limit: 20 };
  });

  // GET /contrats/:id
  server.get('/:id', { preHandler: [can('contrats', 'read')] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const contrat = await prisma.contrat.findUnique({
      where: { id },
      include: { client: true, projet: true, athlete: true },
    });
    if (!contrat) return reply.status(404).send({ message: 'Contrat non trouvé' });
    return contrat;
  });

  // POST /contrats/:id/sign
  server.post('/:id/sign', { preHandler: [can('contrats', 'write')] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { partie } = z.object({ partie: z.enum(['CLIENT', 'PRESTATAIRE']) }).parse(req.body);

    const contrat = await prisma.contrat.findUniqueOrThrow({ where: { id } });
    const signeParClient = partie === 'CLIENT' ? true : contrat.signeParClient;
    const signeParPrestataire = partie === 'PRESTATAIRE' ? true : contrat.signeParPrestataire;
    const bothSigned = signeParClient && signeParPrestataire;

    const updated = await prisma.contrat.update({
      where: { id },
      data: {
        signeParClient,
        signeParPrestataire,
        ...(bothSigned && { statut: 'SIGNE', dateSignature: new Date() }),
      },
    });
    return updated;
  });

  // GET /contrats/:id/pdf
  server.get('/:id/pdf', { preHandler: [can('contrats', 'read')] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const contrat = await prisma.contrat.findUnique({ where: { id } });
    if (!contrat) return reply.status(404).send({ message: 'Contrat non trouvé' });
    return { pdfUrl: contrat.pdfUrl || null, message: 'PDF à implémenter (Étape 05)' };
  });
}

