import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../lib/rbac';
import { prisma } from '../../lib/prisma';

const MOIS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

export async function dashboardRoutes(server: FastifyInstance) {
  // GET /dashboard/kpis
  server.get('/kpis', { preHandler: [requireAuth] }, async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [facturesCeMois, facturesMoisDernier, athletesActifs, devisTotal, devisConverti] =
      await Promise.all([
        prisma.facture.aggregate({
          where: { createdAt: { gte: startOfMonth }, statutPaiement: 'PAYEE' },
          _sum: { montantTTC: true },
        }),
        prisma.facture.aggregate({
          where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }, statutPaiement: 'PAYEE' },
          _sum: { montantTTC: true },
        }),
        prisma.athlete.count({ where: { statut: 'Actif' } }),
        prisma.devis.count({ where: { statut: { not: 'REFUSE' } } }),
        prisma.devis.count({ where: { statut: 'CONVERTI' } }),
      ]);

    const ca = facturesCeMois._sum.montantTTC || 0;
    const caPrev = facturesMoisDernier._sum.montantTTC || 0;
    const caVariation = caPrev > 0 ? Math.round(((ca - caPrev) / caPrev) * 100) : 0;

    const pipeline = await prisma.devis.aggregate({
      where: { statut: 'EN_ATTENTE' },
      _sum: { montantTTC: true },
    });

    return {
      chiffreAffaires: ca,
      chiffreAffairesVariation: caVariation,
      pipeline: pipeline._sum.montantTTC || 0,
      pipelineVariation: 0,
      athletesActifs,
      athletesVariation: 0,
      tauxConversion: devisTotal > 0 ? Math.round((devisConverti / devisTotal) * 100) : 0,
      tauxConversionVariation: 0,
    };
  });

  // GET /dashboard/ca — CA par mois (12 derniers mois)
  server.get('/ca', { preHandler: [requireAuth] }, async () => {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const factures = await prisma.facture.findMany({
      where: {
        createdAt: { gte: twelveMonthsAgo },
        statutPaiement: 'PAYEE',
      },
      select: { createdAt: true, montantTTC: true },
    });

    // Group by month in JS
    const byMonth = new Map<string, number>();
    for (const f of factures) {
      const key = MOIS_FR[new Date(f.createdAt).getMonth()];
      byMonth.set(key, (byMonth.get(key) ?? 0) + f.montantTTC);
    }

    // Return last 12 months in order
    const result = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mois = MOIS_FR[d.getMonth()];
      result.push({ mois, total: Math.round(byMonth.get(mois) ?? 0) });
    }
    return result;
  });

  // GET /dashboard/pipeline — projets en cours
  server.get('/pipeline', { preHandler: [requireAuth] }, async () => {
    return prisma.projet.findMany({
      where: { statut: { in: ['TODO', 'EN_COURS', 'EN_ATTENTE'] } },
      include: { client: { select: { nom: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  });

  // GET /dashboard/activites — dernières activités
  server.get('/activites', { preHandler: [requireAuth] }, async () => {
    return prisma.activite.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        client: { select: { nom: true } },
        user: { select: { name: true } },
      },
    });
  });
}
