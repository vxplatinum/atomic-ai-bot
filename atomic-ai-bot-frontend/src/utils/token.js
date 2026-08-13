const listeners = new Set();

export function subscribeToAuthChanges(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifyAuthListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {}
  });
}

// storage fires in other tabs only — keeps login/logout in sync.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'access_token' || e.key === 'refresh_token') {
      notifyAuthListeners();
    }
  });
}

export function setTokens({ access_token, refresh_token }) {
  localStorage.setItem('access_token', access_token);
  localStorage.setItem('refresh_token', refresh_token);
  notifyAuthListeners();
}

export function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  notifyAuthListeners();
}

export function getAccessToken() {
  return localStorage.getItem('access_token');
}

export function getRefreshToken() {
  return localStorage.getItem('refresh_token');
}
