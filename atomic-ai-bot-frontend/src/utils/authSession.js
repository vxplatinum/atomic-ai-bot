const SESSION_NOTICE_KEY = 'auth_session_notice';

export function setSessionNotice(message) {
  if (!message) return;
  try {
    sessionStorage.setItem(SESSION_NOTICE_KEY, message);
  } catch {}
}

export function consumeSessionNotice() {
  try {
    const message = sessionStorage.getItem(SESSION_NOTICE_KEY);
    if (message) sessionStorage.removeItem(SESSION_NOTICE_KEY);
    return message;
  } catch {
    return null;
  }
}
