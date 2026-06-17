import { FastifyRequest, FastifyReply } from 'fastify';

export type Role = 'ADMIN' | 'MANAGER' | 'COMMERCIAL' | 'COACH' | 'COMPTABLE';

/**
 * Permission levels — derived from the handoff RBAC matrix.
 *   'write' (✅) → full access (read + create + update + delete)
 *   'read'  (👁) → read-only
 *   'none'  (❌) → no access
 */
export type Permission = 'write' | 'read' | 'none';

export type Action = 'read' | 'write';

/**
 * Protected resources. Some handoff rows group modules that share the same
 * permissions ("Devis / Factures", "Projets / Tâches").
 */
export type Resource =
  | 'utilisateurs'
  | 'athletes'
  | 'clients'
  | 'devisFactures'
  | 'projetsTaches'
  | 'contrats'
  | 'reglements'
  | 'parametres';

/**
 * RBAC matrix — exact transcription of the handoff table.
 *
 * Module             Admin  Manager  Commercial  Coach  Comptable
 * Utilisateurs        ✅     👁       ❌          ❌     ❌
 * Athlètes            ✅     ✅       👁          ✅     👁
 * Clients             ✅     ✅       ✅          👁     👁
 * Devis / Factures    ✅     ✅       ✅          ❌     ✅
 * Projets / Tâches    ✅     ✅       👁          ✅     👁
 * Contrats            ✅     ✅       ❌          ❌     👁
 * Règlements          ✅     ✅       ❌          ❌     ✅
 * Paramètres          ✅     ❌       ❌          ❌     ❌
 */
const MATRIX: Record<Resource, Record<Role, Permission>> = {
  utilisateurs:  { ADMIN: 'write', MANAGER: 'read',  COMMERCIAL: 'none',  COACH: 'none',  COMPTABLE: 'none'  },
  athletes:      { ADMIN: 'write', MANAGER: 'write', COMMERCIAL: 'read',  COACH: 'write', COMPTABLE: 'read'  },
  clients:       { ADMIN: 'write', MANAGER: 'write', COMMERCIAL: 'write', COACH: 'read',  COMPTABLE: 'read'  },
  devisFactures: { ADMIN: 'write', MANAGER: 'write', COMMERCIAL: 'write', COACH: 'none',  COMPTABLE: 'write' },
  projetsTaches: { ADMIN: 'write', MANAGER: 'write', COMMERCIAL: 'read',  COACH: 'write', COMPTABLE: 'read'  },
  contrats:      { ADMIN: 'write', MANAGER: 'write', COMMERCIAL: 'none',  COACH: 'none',  COMPTABLE: 'read'  },
  reglements:    { ADMIN: 'write', MANAGER: 'write', COMMERCIAL: 'none',  COACH: 'none',  COMPTABLE: 'write' },
  parametres:    { ADMIN: 'write', MANAGER: 'none',  COMMERCIAL: 'none',  COACH: 'none',  COMPTABLE: 'none'  },
};

/** Does `role` satisfy `action` on `resource`? */
export function hasPermission(role: Role, resource: Resource, action: Action): boolean {
  const level = MATRIX[resource][role];
  if (level === 'none') return false;
  if (action === 'read') return level === 'read' || level === 'write';
  return level === 'write'; // action === 'write'
}

/**
 * preHandler guard — verifies the JWT, then checks the RBAC matrix.
 * Returns 401 if unauthenticated, 403 if the role lacks the permission.
 *
 *   server.get('/', { preHandler: [can('athletes', 'read')] }, handler)
 *   server.post('/', { preHandler: [can('athletes', 'write')] }, handler)
 */
export function can(resource: Resource, action: Action) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
    } catch {
      return reply.status(401).send({ message: 'Non authentifié' });
    }
    const { role } = req.user as { role: Role };
    if (!hasPermission(role, resource, action)) {
      return reply
        .status(403)
        .send({ message: `Accès refusé — le rôle ${role} ne peut pas ${action} ${resource}` });
    }
  };
}

/** preHandler that only checks authentication (any valid role). */
export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();
  } catch {
    return reply.status(401).send({ message: 'Non authentifié' });
  }
}

/**
 * Legacy explicit-role guard — kept for routes that gate on a specific role
 * list rather than a resource/action pair (e.g. self-service endpoints).
 */
export function checkRole(...roles: Role[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
    } catch {
      return reply.status(401).send({ message: 'Non authentifié' });
    }
    const { role } = req.user as { role: Role };
    if (!roles.includes(role)) {
      return reply.status(403).send({ message: 'Accès refusé — rôle insuffisant' });
    }
  };
}
