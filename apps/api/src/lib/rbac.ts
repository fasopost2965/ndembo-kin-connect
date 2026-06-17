import { FastifyRequest, FastifyReply } from 'fastify';

type Role = 'ADMIN' | 'MANAGER' | 'COMMERCIAL' | 'COACH' | 'COMPTABLE';

export function checkRole(...roles: Role[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    await req.jwtVerify();
    const { role } = req.user as { role: Role };
    if (!roles.includes(role)) {
      return reply.status(403).send({ message: 'Accès refusé — rôle insuffisant' });
    }
  };
}

export function requireAuth() {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    await req.jwtVerify();
  };
}
