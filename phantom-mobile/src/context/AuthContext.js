import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('token');
        if (stored) {
          setToken(stored);
          const me = await api.getMe();
          setUser(me);
        }
      } catch {
        await AsyncStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveAuth = async (tokenStr, userData) => {
    await AsyncStorage.setItem('token', tokenStr);
    setToken(tokenStr);
    setUser(userData);
  };

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    await saveAuth(res.access_token, res.user);
    return res.user;
  };

  const register = async (email, name, password, amputationLevel = '', weeksFitting = 16) => {
    const res = await api.register({
      email, name, password,
      amputation_level: amputationLevel,
      weeks_to_fitting: weeksFitting,
    });
    await saveAuth(res.access_token, res.user);
    return res.user;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updates) => setUser((prev) => ({ ...prev, ...updates }));

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
