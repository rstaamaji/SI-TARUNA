export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'MEMBER';

export interface StoredUser {
  id: string;
  name: string;
  username?: string;
  email?: string;
  role: UserRole;
  member?: {
    id?: string;
    name?: string;
    memberNumber?: string;
  };
}

/**
 * Normalizes any role string into 'SUPERADMIN' | 'ADMIN' | 'MEMBER'
 */
export function normalizeRole(rawRole?: string | null): UserRole {
  if (!rawRole) return 'MEMBER';
  const upper = String(rawRole).trim().toUpperCase();
  if (upper === 'SUPERADMIN') return 'SUPERADMIN';
  if (upper === 'ADMIN') return 'ADMIN';
  return 'MEMBER';
}

/**
 * Returns true if the role is allowed admin privileges (ADMIN or SUPERADMIN)
 */
export function isUserAdmin(role?: string | null): boolean {
  if (!role) return false;
  const upper = String(role).trim().toUpperCase();
  return upper === 'ADMIN' || upper === 'SUPERADMIN';
}

/**
 * Returns true if the role is SUPERADMIN
 */
export function isUserSuperAdmin(role?: string | null): boolean {
  if (!role) return false;
  return String(role).trim().toUpperCase() === 'SUPERADMIN';
}

/**
 * Safely reads the currently logged-in user session from localStorage
 */
export function getStoredUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('si_taruna_user') || localStorage.getItem('user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const role = normalizeRole(parsed.role);
    const name = parsed.name || parsed.member?.name || parsed.username || 'Pengguna';

    return {
      id: parsed.id || 'user-id',
      name,
      username: parsed.username,
      email: parsed.email,
      role,
      member: parsed.member,
    };
  } catch {
    return null;
  }
}
