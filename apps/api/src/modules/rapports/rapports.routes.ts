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
      caYear,
      devisEmis,
      devisValides,
      devisConvertis,
      facturesPayeesCount,
      athletesActifs,
      athletesTotal,
      topAthletes,
      facturesEncaissees,
      caParMoisRaw,
      delaiRaw,
    ] = await Promise.all([
      // CA réalisé = total encaissé (acompte perçu) sur l'année
      prisma.facture.aggregate({
        where: { createdAt: { gte: startOfYear } },
        _sum: { acomptePercu: true },
      }),
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
      // Factures avec encaissement > 0 et type de client (répartition du CA)
      prisma.facture.findMany({
        where: { acomptePercu: { gt: 0 } },
        select: { acomptePercu: true, client: { select: { type: true } } },
      }),
      // CA mensuel = encaissements attribués au mois d'émission de la facture
      prisma.$queryRaw<{ m: number; total: number }[]>`
        SELECT EXTRACT(MONTH FROM "createdAt")::int as m,
               COALESCE(SUM("acomptePercu"), 0)::float as total
        FROM factures
        WHERE EXTRACT(YEAR FROM "createdAt") = ${year}
        GROUP BY EXTRACT(MONTH FROM "createdAt")
      `,
      // Délai moyen de paiement : jours entre émission facture et règlement confirmé
      prisma.$queryRaw<{ avg_days: number | null }[]>`
        SELECT AVG(EXTRACT(EPOCH FROM (r."dateReglement" - f."createdAt")) / 86400)::float as avg_days
        FROM reglements r
        JOIN factures f ON f.id = r."factureId"
        WHERE r.statut = 'CONFIRME'
      `,
    ]);

    // CA mensuel sur 12 mois (rempli à 0 pour les mois sans encaissement)
    const caParMois = MOIS_FR.map((mois, i) => {
      const row = caParMoisRaw.find((r) => r.m === i + 1);
      return { mois, val: row ? Math.round(row.total) : 0 };
    });

    // Répartition du CA encaissé par type de client
    const repMap = new Map<string, number>();
    for (const f of facturesEncaissees) {
      const t = f.client?.type ?? 'Autre';
      repMap.set(t, (repMap.get(t) ?? 0) + f.acomptePercu);
    }
    const repartition = [...repMap.entries()]
      .map(([label, val]) => ({ label, val: Math.round(val) }))
      .sort((a, b) => b.val - a.val);

    const ca = Math.round(caYear._sum.acomptePercu || 0);
    const delaiMoyen = delaiRaw[0]?.avg_days != null ? Math.round(delaiRaw[0].avg_days) : null;

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
