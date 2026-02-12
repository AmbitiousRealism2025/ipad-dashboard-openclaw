import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, AuthTokens } from '../types';
import { api } from '../services/api';
import { wsService } from '../services/websocket';

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_tokens';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens>({ accessToken: null, refreshToken: null });
  const [isLoading, setIsLoading] = useState(true);

  // Load tokens from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthTokens;
        setTokens(parsed);
        api.setAccessToken(parsed.accessToken);
        wsService.setToken(parsed.accessToken);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // Fetch current user when tokens change
  useEffect(() => {
    if (tokens.accessToken) {
      api.getCurrentUser()
        .then((userData) => {
          setUser({
            id: userData.id,
            email: userData.email,
            role: userData.role as User['role'],
          });
        })
        .catch(() => {
          // Token might be expired, try refresh
          refreshAuth();
        });
    }
  }, [tokens.accessToken]);

  const saveTokens = useCallback((newTokens: AuthTokens) => {
    setTokens(newTokens);
    api.setAccessToken(newTokens.accessToken);
    wsService.setToken(newTokens.accessToken);
    localStorage.setItem(TOKEN_KEY, JSON.stringify(newTokens));
  }, []);

  const clearTokens = useCallback(() => {
    setTokens({ accessToken: null, refreshToken: null });
    setUser(null);
    api.setAccessToken(null);
    wsService.setToken(null);
    localStorage.removeItem(TOKEN_KEY);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.login(email, password);

    const newTokens: AuthTokens = {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    };

    saveTokens(newTokens);

    setUser({
      id: response.user.id,
      email: response.user.email,
      name: response.user.name,
      role: response.user.role as User['role'],
    });
  }, [saveTokens]);

  const logout = useCallback(async () => {
    if (tokens.refreshToken) {
      try {
        await api.logout(tokens.refreshToken);
      } catch {
        // Ignore logout errors
      }
    }

    clearTokens();
    wsService.disconnect();
  }, [tokens.refreshToken, clearTokens]);

  const refreshAuth = useCallback(async () => {
    if (!tokens.refreshToken) {
      clearTokens();
      return;
    }

    try {
      const response = await api.refreshToken(tokens.refreshToken);

      const newTokens: AuthTokens = {
        accessToken: response.accessToken,
        refreshToken: tokens.refreshToken,
      };

      saveTokens(newTokens);
    } catch {
      clearTokens();
    }
  }, [tokens.refreshToken, saveTokens, clearTokens]);

  // Set up token refresh interval
  useEffect(() => {
    if (!tokens.accessToken) return;

    // Refresh token every 14 minutes (tokens expire in 15 minutes)
    const interval = setInterval(refreshAuth, 14 * 60 * 1000);

    return () => clearInterval(interval);
  }, [tokens.accessToken, refreshAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        isLoading,
        isAuthenticated: !!user && !!tokens.accessToken,
        login,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
