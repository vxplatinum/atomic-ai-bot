import { apiRequest } from './index';

export function getAdminStats() {
  return apiRequest('/admin/stats');
}

export function listAdminUsers({ email, limit = 50, offset = 0 } = {}) {
  const capped = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const off = Math.max(Number(offset) || 0, 0);
  const params = new URLSearchParams();
  params.set('limit', String(capped));
  params.set('offset', String(off));
  if (email && String(email).trim()) params.set('email', String(email).trim());
  return apiRequest(`/admin/users?${params.toString()}`);
}

export function getAdminUser(userId) {
  return apiRequest(`/admin/users/${userId}`);
}

export function patchAdminUser(userId, body) {
  return apiRequest(`/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function getAdminBot(botId) {
  return apiRequest(`/admin/bots/${botId}`);
}

export function patchAdminBot(botId, body) {
  return apiRequest(`/admin/bots/${botId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function deleteAdminBot(botId) {
  return apiRequest(`/admin/bots/${botId}`, {
    method: 'DELETE',
  });
}
