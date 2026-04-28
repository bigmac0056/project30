import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';

async function getToken() {
  return AsyncStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = await getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res  = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || 'Ошибка сервера');
  return data;
}

export const api = {
  // Auth
  register : (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login    : (body) => request('/auth/login',    { method: 'POST', body: JSON.stringify(body) }),

  // Users
  getMe    : ()     => request('/users/me'),
  updateMe : (body) => request('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),

  // Sessions
  createSession : (body) => request('/sessions', { method: 'POST', body: JSON.stringify(body) }),
  getSessions   : ()     => request('/sessions'),
  getProgress   : ()     => request('/sessions/progress'),

  // Calibration
  saveCalibration  : (body) => request('/calibration', { method: 'POST', body: JSON.stringify(body) }),
  getCalibration   : ()     => request('/calibration/latest'),
};
