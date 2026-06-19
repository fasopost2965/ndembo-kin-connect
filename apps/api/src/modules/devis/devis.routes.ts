import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { can } from '../../lib/rbac';
import { prisma } from '../../lib/prisma';
import { nextNumero } from '../../lib/sequences';
import { getSettingsMap } from '../../lib/settings';
import { renderDocumentPdf, type PdfLigne } from '../../lib/pdf/documentPdf';

// Input line: only prestationId + quantite are required; prixUnit is optional
// and defaults to the prestation's catalogue price (prixBase).
const ligneInputSchema = z.object({
  prestationId: z.string(),
  quantite: z.number().min(1),
  prixUnit: z.number().min(0).optional(),
});

const devisCreateSchema = z.object({
  clientId: z.string(),
  lignes: z.array(ligneInputSchema).min(1),
  tva: z.number().default(16),
  notes: z.string().optional(),
  validiteJours: z.number().default(30),
});

// Stored line shape: designation + prixUnit + computed total are resolved
// server-side so the catalogue stays the source of truth.
interface LigneStored {
  prestationId: string;
  designation: string;
  quantite: number;
  prixUnit: number;
  total: number;
}

/** Resolve input lines against the Prestation catalogue and compute totals. */
async function resolveLignes(
  lignes: z.infer<typeof ligneInputSchema>[]
): Promise<{ lignes: LigneStored[]; montantHT: number }> {
  const ids = [...new Set(lignes.map((l) => l.prestationId))];
  const prestations = await prisma.prestation.findMany({ where: { id: { in: ids } } });
  const byId = new Map(prestations.map((p) => [p.id, p]));

  const resolved = lignes.map((l) => {
    const prestation = byId.get(l.prestationId);
    if (!prestation) throw new Error(`Prestation introuvable: ${l.prestationId}`);
    const prixUnit = l.prixUnit ?? prestation.prixBase;
    return {
      prestationId: l.prestationId,
      designation: prestation.nom,
      quantite: l.quantite,
      prixUnit,
      total: Math.round(prixUnit * l.quantite * 100) / 100,
    };
  });

  const montantHT = resolved.reduce((s, l) => s + l.total, 0);
  return { lignes: resolved, montantHT };
}

export async function devisRoutes(server: FastifyInstance) {
  // GET /devis
  server.get('/', { preHandler: [can('devisFactures', 'read')] }, async (req) => {
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
  server.post('/', { preHandler: [can('devisFactures', 'write')] }, async (req, reply) => {
    const body = devisCreateSchema.parse(req.body);
    let resolved;
    try {
      resolved = await resolveLignes(body.lignes);
    } catch (e) {
      return reply.status(400).send({ message: (e as Error).message });
    }
    const montantTTC = Math.round(resolved.montantHT * (1 + body.tva / 100) * 100) / 100;
    const numero = await nextNumero('DEVIS');
    const devis = await prisma.devis.create({
      data: {
        clientId: body.clientId,
        tva: body.tva,
        notes: body.notes,
        validiteJours: body.validiteJours,
        lignes: JSON.stringify(resolved.lignes),
        montantHT: resolved.montantHT,
        montantTTC,
        numero,
      },
    });
    return reply.status(201).send(devis);
  });

  // GET /devis/:id
  server.get('/:id', { preHandler: [can('devisFactures', 'read')] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const devis = await prisma.devis.findUnique({ where: { id }, include: { client: true } });
    if (!devis) return reply.status(404).send({ message: 'Devis non trouvé' });
    return devis;
  });

  // GET /devis/:id/pdf — generate the devis PDF on the fly
  server.get('/:id/pdf', { preHandler: [can('devisFactures', 'read')] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const devis = await prisma.devis.findUnique({ where: { id }, include: { client: true } });
    if (!devis) return reply.status(404).send({ message: 'Devis non trouvé' });

    const settings = await getSettingsMap();
    const pdf = await renderDocumentPdf(
      {
        kind: 'devis',
        numero: devis.numero,
        createdAt: devis.createdAt,
        client: devis.client,
        lignes: JSON.parse(devis.lignes as string) as PdfLigne[],
        montantHT: devis.montantHT,
        tva: devis.tva,
        montantTTC: devis.montantTTC,
        validiteJours: devis.validiteJours,
        notes: devis.notes,
      },
      settings
    );

    return reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `inline; filename="${devis.numero}.pdf"`)
      .send(pdf);
  });

  // POST /devis/:id/convert — convert to facture
  server.post('/:id/convert', { preHandler: [can('devisFactures', 'write')] }, async (req, reply) => {
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
          lignes: devis.lignes,
          montantHT: devis.montantHT,
          tva: devis.tva,
          montantTTC: devis.montantTTC,
        },
      });
    });
    return reply.status(201).send(facture);
  });

  // PATCH /devis/:id/statut
  server.patch('/:id/statut', { preHandler: [can('devisFactures', 'write')] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { statut } = z.object({ statut: z.enum(['EN_ATTENTE', 'VALIDE', 'REFUSE']) }).parse(req.body);
    const devis = await prisma.devis.update({ where: { id }, data: { statut } });
    return devis;
  });
}

