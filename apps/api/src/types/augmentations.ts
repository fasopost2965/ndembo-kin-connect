// Module augmentations for Fastify + @fastify/jwt.
// Imported for its side effects from src/index.ts so the declarations are
// always part of the compilation graph (ts-node loads files on import).
import '@fastify/jwt';
import { FastifyRequest, FastifyReply } from 'fastify';
import { Role } from '../lib/rbac';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    // payload signed in /auth/login
    payload: { userId: string; role: Role; agenceId: string };
    // shape of request.user after jwtVerify()
    user: { userId: string; role: Role; agenceId: string };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export {};
