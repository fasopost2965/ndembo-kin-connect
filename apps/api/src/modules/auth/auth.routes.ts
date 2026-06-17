import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { can, Role } from '../../lib/rbac';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function authRoutes(server: FastifyInstance) {
  // POST /auth/login — rate-limited to 10 req/min (handoff checklist)
  server.post('/login', {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
  }, async (req, reply) => {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return reply.status(401).send({ message: 'Identifiants invalides' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return reply.status(401).send({ message: 'Identifiants invalides' });
    }

    const payload = { userId: user.id, role: user.role, agenceId: 'nkc' };
    const accessToken = server.jwt.sign(payload, { expiresIn: '15m' });
    const refreshToken = server.jwt.sign(payload, { expiresIn: '7d' });

    reply.setCookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/auth/refresh',
      maxAge: 7 * 24 * 60 * 60,
    });

    return { accessToken, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  });

  // POST /auth/register — Admin only (Utilisateurs = write in the RBAC matrix)
  server.post('/register', { preHandler: [can('utilisateurs', 'write')] }, async (req, reply) => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(2),
      role: z.enum(['ADMIN', 'MANAGER', 'COMMERCIAL', 'COACH', 'COMPTABLE']).optional(),
    });
    const data = schema.parse(req.body);
    const hashed = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: { ...data, password: hashed },
      select: { id: true, email: true, name: true, role: true },
    });
    return reply.status(201).send(user);
  });

  // GET /auth/me
  server.get('/me', { preHandler: [server.authenticate] }, async (req) => {
    const { userId } = req.user as { userId: string };
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });
    return user;
  });

  // POST /auth/refresh
  server.post('/refresh', async (req, reply) => {
    const token = req.cookies['refresh_token'];
    if (!token) return reply.status(401).send({ message: 'No refresh token' });
    try {
      const payload = server.jwt.verify<{ userId: string; role: Role; agenceId: string }>(token);
      const accessToken = server.jwt.sign(
        { userId: payload.userId, role: payload.role, agenceId: payload.agenceId },
        { expiresIn: '15m' }
      );
      return { accessToken };
    } catch {
      return reply.status(401).send({ message: 'Invalid refresh token' });
    }
  });
}
