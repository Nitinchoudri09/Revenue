import { useState, useCallback, useEffect, createContext, useContext } from 'react';
import api from '../services/api';
import { AuthContextType } from '../types';

export const AuthContext = createContext<AuthContextType>({ 
  token: null, 
  login: () => {}, 
  logout: () => {} 
});

export const useAuth = () => useContext(AuthContext);

export function useAuthProvider() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  
  const login = useCallback((t: string) => { 
    localStorage.setItem('token', t); 
    setToken(t); 
  }, []);
  
  const logout = useCallback(() => { 
    localStorage.removeItem('token'); 
    setToken(null); 
  }, []);

  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use((config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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
  }, [token, logout]);

  return { token, login, logout };
}
