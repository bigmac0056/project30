import AsyncStorage from '@react-native-async-storage/async-storage';

// Замени IP на свой локальный адрес если нужно
export const BASE_URL = 'http://10.17.5.162:8000';

async function getToken() {
  return AsyncStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = await getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || 'Ошибка сервера');
  return data;
}

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request('/users/me'),
  updateMe: (body) => request('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),
  createSession: (body) => request('/sessions', { method: 'POST', body: JSON.stringify(body) }),
  getSessions: () => request('/sessions'),
  getProgress: () => request('/sessions/progress'),
};
