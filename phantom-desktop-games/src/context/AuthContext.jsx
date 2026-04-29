/**
 * AuthContext.jsx — phantom-desktop-games
 * ─────────────────────────────────────────
 * JWT stored in localStorage. Provides user, login, register, logout.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('phantom_token');
    if (!token) { setLoading(false); return; }
    api.getMe()
      .then(setUser)
      .catch(() => localStorage.removeItem('phantom_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async ({ email, password }) => {
    const data = await api.login({ email, password });
    localStorage.setItem('phantom_token', data.access_token);
    setUser(data.user);
    return data.user;
  };

  const register = async ({ name, email, password }) => {
    const data = await api.register({ name, email, password });
    localStorage.setItem('phantom_token', data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('phantom_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
