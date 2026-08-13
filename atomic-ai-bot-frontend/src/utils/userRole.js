function normalizeRole(raw) {
  if (raw == null) return null;
  if (Array.isArray(raw)) {
    if (raw.some((role) => normalizeRole(role) === 'admin')) return 'admin';
    return null;
  }
  if (typeof raw !== 'string') return null;
  const role = raw.trim().toLowerCase();
  if (role === 'admin') return 'admin';
  if (role === 'user') return 'user';
  return null;
}

export function getEffectiveRole(profile) {
  if (!profile || typeof profile !== 'object') return null;
  if (profile.is_admin === true || profile.user?.is_admin === true) {
    return 'admin';
  }
  return normalizeRole(
    profile.role ??
      profile.roles ??
      profile.user?.roles ??
      profile.user?.role ??
      profile.claims?.role ??
      profile.claims?.roles ??
      profile.permissions?.role
  );
}

function decodeBase64Url(value) {
  if (typeof atob !== 'function') return null;
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  return atob(padded);
}

export function getEffectiveRoleFromToken(token) {
  if (!token || typeof token !== 'string') return null;
  const [, payload] = token.split('.');
  if (!payload) return null;

  try {
    const decodedPayload = decodeBase64Url(payload);
    if (!decodedPayload) return null;
    const claims = JSON.parse(decodedPayload);
    return getEffectiveRole(claims);
  } catch {
    return null;
  }
}

export function canAccessAdminPanel(role) {
  return role === 'admin';
}
