import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { can } from '../../lib/rbac';
import { prisma } from '../../lib/prisma';
import { nextNumero } from '../../lib/sequences';

const TYPE_LABEL: Record<string, string> = {
  MANAGEMENT:     'Contrat de management sportif',
  REPRESENTATION: "Contrat de représentation d'athlète",
  PRESTATION:     'Contrat de prestation de services',
  PARTENARIAT:    'Contrat de partenariat commercial',
};

function buildContenu(opts: {
  typeContrat: string;
  montant?: number;
  dateDebut?: string;
  dateFin?: string;
  prestations?: string[];
  clauses?: string[];
}) {
  const { typeContrat, montant, dateDebut, dateFin, prestations = [], clauses = [] } = opts;
  const typeLabel = TYPE_LABEL[typeContrat] ?? typeContrat;

  const fmtDate = (d?: string) => {
    if (!d) return 'à définir';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const hasClauses = (name: string) => clauses.includes(name);

  const content: Record<string, string> = {
    article1: `Objet du contrat — Le présent acte constitue un ${typeLabel} conclu entre Ndembo Kin Connect SARL (ci-après « NKC ») et le Client/Athlète désigné en préambule.`,
    article2: `Durée et prise d'effet — Le contrat prend effet le ${fmtDate(dateDebut)} et expire le ${fmtDate(dateFin)}, sauf résiliation anticipée dans les conditions prévues à l'article 10.`,
    article3: `Prestations incluses — Dans le cadre du présent contrat, NKC s'engage à fournir les prestations suivantes : ${prestations.length > 0 ? prestations.join(' ; ') : 'à définir selon accord particulier'}.`,
    article4: `Rémunération — En contrepartie des prestations fournies, le Client versera à NKC la somme de ${montant ? `${montant.toLocaleString('fr-FR')} USD` : 'à définir'} selon les modalités convenues. Les paiements seront effectués via les canaux Mobile Money agréés (M-Pesa, Airtel Money, Orange Money) ou virement bancaire Rawbank.`,
    article5: `Obligations de Ndembo Kin Connect — NKC s'engage à : (i) exécuter les prestations convenues avec diligence et professionnalisme ; (ii) informer régulièrement le Client de l'avancement des missions ; (iii) agir dans le respect des règlements sportifs nationaux et internationaux en vigueur ; (iv) préserver la confidentialité des informations transmises par le Client.`,
    article6: `Obligations du Client/Athlète — Le Client s'engage à : (i) fournir à NKC toutes les informations nécessaires à l'exécution du contrat ; (ii) s'acquitter des honoraires dans les délais convenus ; (iii) ne pas contracter directement avec des tiers introduits par NKC pendant la durée du contrat et les 12 mois suivant son expiration.`,
  };

  if (hasClauses('non-concurrence')) {
    content['article7'] = "Exclusivité et non-concurrence — Pendant la durée du contrat et pour une période de douze (12) mois suivant son expiration, le Client/Athlète s'interdit de conclure avec des sociétés concurrentes de NKC des contrats ayant le même objet que le présent accord, dans la zone géographique couverte (République Démocratique du Congo et pays limitrophes).";
  }

  if (hasClauses('image')) {
    content['article8'] = "Droit à l'image — Le Client/Athlète accorde à NKC, pour la durée du contrat, le droit d'utiliser son image, son nom et sa notoriété à des fins de communication institutionnelle et de prospection commerciale, dans le respect de sa dignité et de ses convictions. NKC s'engage à soumettre tout usage publicitaire à validation préalable du Client/Athlète.";
  }

  if (hasClauses('confidentialite')) {
    content['article9'] = "Confidentialité — Les parties s'engagent mutuellement à ne pas divulguer à des tiers les informations confidentielles échangées dans le cadre du présent contrat (données financières, stratégies de négociation, informations personnelles) pendant toute la durée du contrat et cinq (5) ans après son terme.";
  }

  content['article10'] = "Résiliation — Chaque partie peut résilier le présent contrat avec un préavis de trente (30) jours notifié par lettre recommandée ou email avec accusé de réception. En cas de manquement grave, la résiliation peut intervenir sans préavis après mise en demeure restée sans effet pendant quinze (15) jours.";
  content['article11'] = "Force majeure — Aucune des parties ne pourra être tenue responsable de l'inexécution de ses obligations causée par un événement de force majeure (catastrophes naturelles, épidémies, décisions gouvernementales, troubles civils, panne d'infrastructure de télécommunications). La partie affectée devra notifier l'autre partie sans délai.";
  content['article12'] = `Litiges et juridiction — Le présent contrat est régi par le droit congolais. Tout litige relatif à son interprétation ou à son exécution sera soumis, à défaut de règlement amiable dans les trente (30) jours, à la juridiction compétente de Kinshasa, République Démocratique du Congo.`;

  return content;
}

export async function contratRoutes(server: FastifyInstance) {
  // POST /contrats/generate
  server.post('/generate', { preHandler: [can('contrats', 'write')] }, async (req, reply) => {
    const body = z.object({
      clientId:     z.string(),
      projetId:     z.string().optional(),
      athleteId:    z.string().optional(),
      typeContrat:  z.string(),
      montant:      z.number().optional(),
      dateDebut:    z.string().optional(),
      dateFin:      z.string().optional(),
      prestations:  z.array(z.string()).optional(),
      clauses:      z.array(z.string()).optional(),
    }).parse(req.body);

    const numero = await nextNumero('CONTRAT');
    const contenu = buildContenu({
      typeContrat:  body.typeContrat,
      montant:      body.montant,
      dateDebut:    body.dateDebut,
      dateFin:      body.dateFin,
      prestations:  body.prestations,
      clauses:      body.clauses,
    });

    const contrat = await prisma.contrat.create({
      data: {
        clientId:    body.clientId,
        athleteId:   body.athleteId,
        projetId:    body.projetId,
        typeContrat: body.typeContrat,
        numero,
        ...(body.montant   && { montant:  body.montant }),
        ...(body.dateDebut && { dateDebut: new Date(body.dateDebut) }),
        ...(body.dateFin   && { dateFin:   new Date(body.dateFin) }),
        contenu: JSON.stringify(contenu),
      },
      include: { client: true },
    });
    return reply.status(201).send(contrat);
  });

  // GET /contrats
  server.get('/', { preHandler: [can('contrats', 'read')] }, async (req) => {
    const query = req.query as { clientId?: string; statut?: string; page?: string; limit?: string };
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      prisma.contrat.findMany({
        where: {
          ...(query.clientId && { clientId: query.clientId }),
          ...(query.statut && { statut: query.statut as never }),
        },
        include: {
          client:  { select: { nom: true } },
          athlete: { select: { nom: true, prenom: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit, take: limit,
      }),
      prisma.contrat.count(),
    ]);
    return { data, total, page, limit };
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
