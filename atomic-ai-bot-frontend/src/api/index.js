import { getApiBaseUrl } from '../config/env';
import {
  getApiErrorMessage,
  isAccountBlockedMessage,
  isTokenRevokedMessage,
} from '../utils/authErrors';
import { setSessionNotice } from '../utils/authSession';
import { clearTokens, getRefreshToken, setTokens } from '../utils/token';

const API_URL = getApiBaseUrl();

// Do not recurse into refresh on 401 from these routes.
const AUTH_SKIP_REFRESH = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
  '/auth/verify-email',
  '/auth/forgot-password',
  '/auth/reset-password-confirm',
];

// Logout still sends Bearer; the rest of these routes are public.
const AUTH_NO_BEARER = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/verify-email',
  '/auth/forgot-password',
  '/auth/reset-password-confirm',
];

// Concurrent 401s share one refresh so the old refresh token is not rotated twice.
let refreshInFlight = null;

function shouldAttemptRefresh(endpoint, retried) {
  if (retried) return false;
  return !AUTH_SKIP_REFRESH.some((path) => endpoint.startsWith(path));
}

function shouldSendBearer(endpoint) {
  return !AUTH_NO_BEARER.some((path) => endpoint.startsWith(path));
}

function handleAuthFailure(status, detailMessage) {
  if (status === 403 && isAccountBlockedMessage(detailMessage)) {
    setSessionNotice('Your account is blocked. Please contact support.');
    clearTokens();
    return;
  }
  if (status === 401 && (isTokenRevokedMessage(detailMessage) || detailMessage.includes('Invalid access token'))) {
    setSessionNotice('Your session has ended. Please sign in again.');
    clearTokens();
  }
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('Missing refresh token');
  }

  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await parseResponseBody(res);
          const message = getApiErrorMessage({ detail: data?.detail ?? data }, 'Refresh failed');
          handleAuthFailure(res.status, message);
          throw new Error(message);
        }
        const tokens = await parseResponseBody(res);
        setTokens(tokens);
        return tokens.access_token;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
}

async function parseResponseBody(res) {
  if (res.status === 204) {
    return null;
  }

  const text = await res.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiRequest(endpoint, options = {}, retried = false) {
  const accessToken = shouldSendBearer(endpoint) ? localStorage.getItem('access_token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && shouldAttemptRefresh(endpoint, retried)) {
    try {
      await refreshAccessToken();
      return apiRequest(endpoint, options, true);
    } catch {
      clearTokens();
      setSessionNotice('Your session has expired. Please sign in again.');
    }
  }

  if (!res.ok) {
    const data = await parseResponseBody(res);
    const error =
      data && typeof data === 'object' && !Array.isArray(data)
        ? data
        : { detail: data || 'Unknown error' };
    error.status = res.status;
    const message = getApiErrorMessage(error);
    handleAuthFailure(res.status, message);
    throw error;
  }

  return parseResponseBody(res);
}
