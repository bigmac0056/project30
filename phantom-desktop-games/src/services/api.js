/**
 * api.js — phantom-desktop-games
 * ────────────────────────────────
 * REST client for the Phantom backend.
 * Reads VITE_API_URL from .env (falls back to localhost).
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

function getToken() {
  return localStorage.getItem('phantom_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? 'Request failed');
  }
  return res.json();
}

export const api = {
  login:  (body) => request('/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  getMe:  ()     => request('/users/me'),
  createSession: (body) => request('/sessions', { method: 'POST', body: JSON.stringify(body) }),
  getSessions:   (limit = 50) => request(`/sessions?limit=${limit}`),
  getProgress:   ()     => request('/sessions/progress'),
};
