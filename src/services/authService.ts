import api from './api';
import type { CurrentUserFromToken } from '../types/user';

/** GET /auth/me - current user's DB-sourced role/profile. */
export async function getCurrentUser(): Promise<CurrentUserFromToken | null> {
  const payload: any = await api.get('/auth/me');
  return payload?.data ?? null;
}
