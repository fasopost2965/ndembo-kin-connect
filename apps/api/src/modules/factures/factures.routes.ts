import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { can } from '../../lib/rbac';
import { prisma } from '../../lib/prisma';
import { getSettingsMap } from '../../lib/settings';
import { renderDocumentPdf, type PdfLigne } from '../../lib/pdf/documentPdf';

export async function factureRoutes(server: FastifyInstance) {
  // GET /factures
  server.get('/', { preHandler: [can('devisFactures', 'read')] }, async (req) => {
    const query = req.query as { clientId?: string; statut?: string; page?: string };
    const page = Number(query.page) || 1;
    const [data, total] = await Promise.all([
      prisma.facture.findMany({
        where: {
          ...(query.clientId && { clientId: query.clientId }),
          ...(query.statut && { statutPaiement: query.statut as never }),
        },
        include: { client: { select: { nom: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * 20, take: 20,
      }),
      prisma.facture.count(),
    ]);
    return { data, total, page, limit: 20 };
  });

  // GET /factures/:id
  server.get('/:id', { preHandler: [can('devisFactures', 'read')] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const facture = await prisma.facture.findUnique({
      where: { id },
      include: { client: true, devis: true, reglements: true },
    });
    if (!facture) return reply.status(404).send({ message: 'Facture non trouvée' });
    return facture;
  });

  // PATCH /factures/:id/paiement — enregistrer un règlement
  server.patch('/:id/paiement', { preHandler: [can('reglements', 'write')] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = z.object({
      montant: z.number().positive(),
      moyenPaiement: z.enum(['BANK', 'CARTE', 'MTN_MONEY', 'AIRTEL_MONEY', 'ORANGE_MONEY']),
      reference: z.string().optional(),
    }).parse(req.body);

    const facture = await prisma.facture.findUniqueOrThrow({ where: { id } });
    const totalRegle = facture.acomptePercu + body.montant;
    const nouveauStatut = totalRegle >= facture.montantTTC
      ? 'PAYEE'
      : totalRegle > 0
      ? 'PARTIELLE'
      : 'ACOMPTE_PERCU';

    const [reglement] = await prisma.$transaction([
      prisma.reglement.create({ data: { factureId: id, ...body } }),
      prisma.facture.update({ where: { id }, data: { acomptePercu: totalRegle, statutPaiement: nouveauStatut } }),
    ]);

    return reply.status(201).send(reglement);
  });

  // GET /factures/:id/pdf — generate the facture PDF on the fly
  server.get('/:id/pdf', { preHandler: [can('devisFactures', 'read')] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const facture = await prisma.facture.findUnique({ where: { id }, include: { client: true } });
    if (!facture) return reply.status(404).send({ message: 'Facture non trouvée' });

    const settings = await getSettingsMap();
    const pdf = await renderDocumentPdf(
      {
        kind: 'facture',
        numero: facture.numero,
        createdAt: facture.createdAt,
        client: facture.client,
        lignes: facture.lignes as unknown as PdfLigne[],
        montantHT: facture.montantHT,
        tva: facture.tva,
        montantTTC: facture.montantTTC,
        acomptePercu: facture.acomptePercu,
      },
      settings
    );

    return reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `inline; filename="${facture.numero}.pdf"`)
      .send(pdf);
  });
}

