import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';

import { authRoutes } from './modules/auth/auth.routes';
import { athleteRoutes } from './modules/athletes/athletes.routes';
import { clientRoutes } from './modules/clients/clients.routes';
import { devisRoutes } from './modules/devis/devis.routes';
import { factureRoutes } from './modules/factures/factures.routes';
import { projetRoutes } from './modules/projets/projets.routes';
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

  // Routes
  await server.register(authRoutes, { prefix: '/auth' });
  await server.register(athleteRoutes, { prefix: '/athletes' });
  await server.register(clientRoutes, { prefix: '/clients' });
  await server.register(devisRoutes, { prefix: '/devis' });
  await server.register(factureRoutes, { prefix: '/factures' });
  await server.register(projetRoutes, { prefix: '/projets' });
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
