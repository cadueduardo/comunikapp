import { admin_role } from '@prisma/client';

export interface AdminJwtPayload {
  sub: string;
  sid: string;
  email: string;
  role: admin_role;
  typ: 'admin';
}

export interface AuthenticatedAdmin {
  id: string;
  sessionId: string;
  nome: string;
  email: string;
  role: admin_role;
}

