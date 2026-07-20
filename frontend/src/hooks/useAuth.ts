import { useState, useCallback, useEffect, createContext, useContext } from 'react';
import api from '../services/api';
import { AuthContextType } from '../types';

export const AuthContext = createContext<AuthContextType>({ 
  token: null, 
  user: null,
  login: () => {}, 
  logout: () => {} 
});

export const useAuth = () => useContext(AuthContext);

export function useAuthProvider() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  
  const logout = useCallback(() => { 
    localStorage.removeItem('token'); 
    setToken(null); 
    setUser(null);
  }, []);

  const login = useCallback((t: string) => { 
    localStorage.setItem('token', t); 
    setToken(t); 
  }, []);

  useEffect(() => {
    // We attach interceptors once
    const requestInterceptor = api.interceptors.request.use((config) => {
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        config.headers.Authorization = `Bearer ${currentToken}`;
      }
      return config;
    });

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [logout]);

  useEffect(() => {
    if (token && !user) {
      // Validate token and fetch user details
      api.get('/auth/me').then(res => {
        setUser(res.data);
      }).catch(err => {
        if (err.response?.status === 401) {
          logout();
        }
      });
    }
  }, [token, user, logout]);

  return { token, user, login, logout };
}
