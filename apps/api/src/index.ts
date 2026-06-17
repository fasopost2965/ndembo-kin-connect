import './types/augmentations';
import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';

import { authRoutes } from './modules/auth/auth.routes';
import { athleteRoutes } from './modules/athletes/athletes.routes';
import { clientRoutes } from './modules/clients/clients.routes';
import { devisRoutes } from './modules/devis/devis.routes';
import { factureRoutes } from './modules/factures/factures.routes';
import { reglementRoutes } from './modules/reglements/reglements.routes';
import { prestationRoutes } from './modules/prestations/prestations.routes';
import { projetRoutes } from './modules/projets/projets.routes';
import { tacheRoutes } from './modules/taches/taches.routes';
import { webhookRoutes } from './modules/webhooks/webhooks.routes';
import { contratRoutes } from './modules/contrats/contrats.routes';
import { settingsRoutes } from './modules/settings/settings.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';

const server = Fastify({ logger: true });

async function main() {
  await server.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  await server.register(jwt, {
    secret: process.env.JWT_SECRET || 'change-me-in-production',
    cookie: { cookieName: 'refresh_token', signed: false },
  });

  await server.register(cookie);

  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // `authenticate` decorator — verifies the JWT, used as a preHandler by routes
  // that only need authentication (RBAC checks use `can()` from lib/rbac).
  server.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
    } catch {
      reply.status(401).send({ message: 'Non authentifié' });
    }
  });

  // Global error handler — maps validation & known errors to clean responses
  server.setErrorHandler((error, req, reply) => {
    // Zod validation errors
    if (error instanceof ZodError) {
      return reply.status(400).send({
        message: 'Données invalides',
        errors: error.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
      });
    }
    // Prisma "record not found" (P2025) → 404
    if ((error as { code?: string }).code === 'P2025') {
      return reply.status(404).send({ message: 'Ressource non trouvée' });
    }
    // Prisma unique constraint (P2002) → 409
    if ((error as { code?: string }).code === 'P2002') {
      return reply.status(409).send({ message: 'Conflit — valeur déjà existante' });
    }
    // Rate-limit (statusCode already set by plugin) and other tagged errors
    if (error.statusCode && error.statusCode < 500) {
      return reply.status(error.statusCode).send({ message: error.message });
    }
    req.log.error(error);
    return reply.status(500).send({ message: 'Erreur interne du serveur' });
  });

  // Routes
  await server.register(authRoutes, { prefix: '/auth' });
  await server.register(athleteRoutes, { prefix: '/athletes' });
  await server.register(clientRoutes, { prefix: '/clients' });
  await server.register(devisRoutes, { prefix: '/devis' });
  await server.register(factureRoutes, { prefix: '/factures' });
  await server.register(reglementRoutes, { prefix: '/reglements' });
  await server.register(prestationRoutes, { prefix: '/prestations' });
  await server.register(projetRoutes, { prefix: '/projets' });
  await server.register(tacheRoutes, { prefix: '/taches' });
  await server.register(webhookRoutes, { prefix: '/webhooks' });
  await server.register(contratRoutes, { prefix: '/contrats' });
  await server.register(settingsRoutes, { prefix: '/settings' });
  await server.register(dashboardRoutes, { prefix: '/dashboard' });

  server.get('/health', async () => ({ status: 'ok' }));

  const port = Number(process.env.PORT) || 3001;
  await server.listen({ port, host: '0.0.0.0' });
  console.log(`API running on http://localhost:${port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
