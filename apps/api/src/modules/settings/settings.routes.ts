import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { can } from '../../lib/rbac';
import { prisma } from '../../lib/prisma';

const DEFAULT_SETTINGS = {
  agence_nom: 'Ndembo Kin Connect',
  agence_email: 'contact@ndembokin.cd',
  agence_telephone: '+243 XXX XXX XXX',
  agence_adresse: 'Kinshasa, RDC',
  agence_rccm: '',
  agence_nif: '',
  devise: 'USD',
  tva_taux: '16',
  devis_prefixe: 'DEV',
  facture_prefixe: 'FACT',
  projet_prefixe: 'PROJ',
  contrat_prefixe: 'CONT',
  flexpay_merchant: '',
};

export async function settingsRoutes(server: FastifyInstance) {
  // GET /settings — returns all settings as key-value object
  server.get('/', { preHandler: [can('parametres', 'read')] }, async () => {
    const rows = await prisma.setting.findMany();
    const out: Record<string, string> = { ...DEFAULT_SETTINGS };
    for (const r of rows) out[r.key] = r.value;
    return out;
  });

  // PUT /settings — bulk upsert
  server.put('/', { preHandler: [can('parametres', 'write')] }, async (req) => {
    const body = z.record(z.string()).parse(req.body);
    await prisma.$transaction(
      Object.entries(body).map(([key, value]) =>
        prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } })
      )
    );
    return { success: true };
  });

  // GET /settings/users — list users (RBAC admin)
  server.get('/users', { preHandler: [can('parametres', 'read')] }, async () => {
    return prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  });

  // PATCH /settings/users/:id — update role or active status
  server.patch('/users/:id', { preHandler: [can('parametres', 'write')] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = z.object({
      role: z.enum(['ADMIN', 'MANAGER', 'COMMERCIAL', 'COACH', 'COMPTABLE']).optional(),
      isActive: z.boolean().optional(),
    }).parse(req.body);
    const user = await prisma.user.update({
      where: { id },
      data: body,
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });
    return user;
  });
}

