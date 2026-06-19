import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../lib/rbac';
import { prisma } from '../../lib/prisma';

const MOIS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

export async function rapportRoutes(server: FastifyInstance) {
  // GET /rapports/synthese — agrégats calculés (KPIs, CA mensuel, funnel, tops)
  server.get('/synthese', { preHandler: [requireAuth] }, async () => {
    const now = new Date();
    const year = now.getFullYear();
    const startOfYear = new Date(year, 0, 1);

    const [
      devisEmis,
      devisValides,
      devisConvertis,
      facturesPayeesCount,
      athletesActifs,
      athletesTotal,
      topAthletes,
      facturesEncaissees,
      facturesAnneePourCA,
      reglements,
    ] = await Promise.all([
      prisma.devis.count({ where: { statut: { not: 'REFUSE' } } }),
      prisma.devis.count({ where: { statut: { in: ['VALIDE', 'CONVERTI'] } } }),
      prisma.devis.count({ where: { statut: 'CONVERTI' } }),
      prisma.facture.count({ where: { statutPaiement: 'PAYEE' } }),
      prisma.athlete.count({ where: { statut: 'Actif' } }),
      prisma.athlete.count(),
      prisma.athlete.findMany({
        where: { valeurMarchande: { not: null, gt: 0 } },
        orderBy: { valeurMarchande: 'desc' },
        take: 5,
        select: { id: true, nom: true, prenom: true, valeurMarchande: true },
      }),
      prisma.facture.findMany({
        where: { acomptePercu: { gt: 0 } },
        select: { acomptePercu: true, client: { select: { type: true } } },
      }),
      prisma.facture.findMany({
        where: { createdAt: { gte: startOfYear } },
        select: { createdAt: true, acomptePercu: true },
      }),
      prisma.reglement.findMany({
        where: { statut: 'CONFIRME' },
        select: { dateReglement: true, facture: { select: { createdAt: true } } },
      }),
    ]);

    // CA total année
    const ca = Math.round(facturesAnneePourCA.reduce((s, f) => s + f.acomptePercu, 0));

    // CA par mois (12 mois de l'année)
    const byMonth = new Map<number, number>();
    for (const f of facturesAnneePourCA) {
      const m = new Date(f.createdAt).getMonth();
      byMonth.set(m, (byMonth.get(m) ?? 0) + f.acomptePercu);
    }
    const caParMois = MOIS_FR.map((mois, i) => ({
      mois,
      val: Math.round(byMonth.get(i) ?? 0),
    }));

    // Répartition du CA par type de client
    const repMap = new Map<string, number>();
    for (const f of facturesEncaissees) {
      const t = f.client?.type ?? 'Autre';
      repMap.set(t, (repMap.get(t) ?? 0) + f.acomptePercu);
    }
    const repartition = [...repMap.entries()]
      .map(([label, val]) => ({ label, val: Math.round(val) }))
      .sort((a, b) => b.val - a.val);

    // Délai moyen de paiement (jours) calculé en JS
    let delaiMoyen: number | null = null;
    if (reglements.length > 0) {
      const delais = reglements
        .filter((r) => r.facture?.createdAt)
        .map((r) => {
          const ms = new Date(r.dateReglement).getTime() - new Date(r.facture!.createdAt).getTime();
          return ms / (1000 * 60 * 60 * 24);
        });
      if (delais.length > 0) {
        delaiMoyen = Math.round(delais.reduce((s, d) => s + d, 0) / delais.length);
      }
    }

    return {
      annee: year,
      kpis: {
        caRealise: ca,
        devisEmis,
        athletesActifs,
        athletesTotal,
        delaiPaiementMoyen: delaiMoyen,
      },
      caParMois,
      funnel: {
        devisEmis,
        devisValides,
        facturesPayees: facturesPayeesCount,
        tauxConversion: devisEmis > 0 ? Math.round((devisConvertis / devisEmis) * 100) : 0,
      },
      topAthletes: topAthletes.map((a) => ({
        nom: `${a.prenom} ${a.nom}`,
        val: a.valeurMarchande || 0,
      })),
      repartition,
    };
  });
}
