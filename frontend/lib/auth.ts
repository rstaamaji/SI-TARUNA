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

/**
 * Completely clears all authentication tokens, cached user data, and resets session,
 * then forces browser navigation back to the login page.
 */
export function logoutUser(redirectTo: string = '/'): void {
  if (typeof window === 'undefined') return;

  try {
    // Thoroughly remove all known token and user cache keys
    localStorage.removeItem('token');
    localStorage.removeItem('si_taruna_token');
    localStorage.removeItem('user');
    localStorage.removeItem('si_taruna_user');
    localStorage.removeItem('si_taruna_role');
    sessionStorage.clear();

    // Expire cookies if any exist
    document.cookie.split(';').forEach((cookieStr) => {
      const eqPos = cookieStr.indexOf('=');
      const name = eqPos > -1 ? cookieStr.substring(0, eqPos).trim() : cookieStr.trim();
      if (name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }
    });
  } catch (err) {
    console.error('Failed to clear credentials during logout:', err);
  }

  // Hard reload/redirect to ensure all in-memory React state is cleanly destroyed
  window.location.href = redirectTo;
}

