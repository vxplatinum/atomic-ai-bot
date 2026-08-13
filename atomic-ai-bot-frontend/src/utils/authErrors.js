export function getApiErrorMessage(err, fallback = 'Something went wrong') {
  if (!err) return fallback;
  const d = err.detail;
  if (typeof d === 'string') return d;
  if (Array.isArray(d) && d[0]?.msg) return d.map((x) => x.msg).join('; ');
  if (d && typeof d === 'object') return JSON.stringify(d);
  return fallback;
}

export function isAccountBlockedMessage(message) {
  return typeof message === 'string' && message.toLowerCase().includes('blocked');
}

export function isEmailUnverifiedMessage(message) {
  return typeof message === 'string' && message.toLowerCase().includes('not been verified');
}

export function isTokenRevokedMessage(message) {
  return typeof message === 'string' && message.toLowerCase().includes('revoked');
}

export function getLoginErrorMessage(err) {
  const message = getApiErrorMessage(err, 'Sign-in failed.');
  if (err?.status === 401) {
    return 'Invalid email, username, or password.';
  }
  if (err?.status === 403) {
    if (isEmailUnverifiedMessage(message)) {
      return 'Your email address has not been verified.';
    }
    if (isAccountBlockedMessage(message)) {
      return 'Your account is blocked.';
    }
    return message;
  }
  return message;
}

export function getSessionEndedMessage(err) {
  const message = getApiErrorMessage(err, '');
  if (isAccountBlockedMessage(message)) {
    return 'Your account is blocked. Please contact support.';
  }
  if (isTokenRevokedMessage(message)) {
    return 'Your session has ended. Please sign in again.';
  }
  if (err?.status === 401) {
    return 'Your session has expired. Please sign in again.';
  }
  return message || 'Your session has ended. Please sign in again.';
}
