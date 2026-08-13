import { apiRequest } from './index';

export function register(data) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function login(data) {
  const formBody = Object.entries(data)
    .map(([key, value]) => encodeURIComponent(key) + '=' + encodeURIComponent(value))
    .join('&');
  return apiRequest('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formBody,
  });
}

export function verifyEmail(token) {
  return apiRequest('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export function forgotPassword(email) {
  return apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function resetPasswordConfirm({ token, new_password }) {
  return apiRequest('/auth/reset-password-confirm', {
    method: 'POST',
    body: JSON.stringify({ token, new_password }),
  });
}

export function getMe() {
  return apiRequest('/auth/me');
}

export function refreshTokens(refresh_token) {
  return apiRequest('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token }),
  });
}

export function logout(refresh_token) {
  return apiRequest('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refresh_token }),
  });
}

export function deleteAccount(password) {
  return apiRequest('/auth/account', {
    method: 'DELETE',
    body: JSON.stringify({ password }),
  });
}
