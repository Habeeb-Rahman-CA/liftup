'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getCookie, setCookie, deleteCookie } from 'cookies-next';
import type { UserProfile, AuthResponse, LoginPayload, RegisterPayload } from '@liftup/types';

import { handleSessionExpired, TOKEN_COOKIE_KEY, REFRESH_COOKIE_KEY } from '@/lib/api-client';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (_payload: LoginPayload) => Promise<void>;
  register: (_payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = useCallback(async (authToken: string): Promise<UserProfile | null> => {
    try {
      const res = await fetch('/api/v1/auth/me', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          handleSessionExpired();
          setToken(null);
          setUser(null);
        }
        return null;
      }

      const data = await res.json();
      const profile = data.data || data;
      return profile;
    } catch {
      return null;
    }
  }, []);

  // Listen for global session-expired events from any API call
  useEffect(() => {
    const handleExpiredEvent = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener('liftup:session-expired', handleExpiredEvent);
    return () => {
      window.removeEventListener('liftup:session-expired', handleExpiredEvent);
    };
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getCookie(TOKEN_COOKIE_KEY) as string | undefined;
      if (storedToken) {
        setToken(storedToken);
        const profile = await fetchCurrentUser(storedToken);
        if (profile) {
          setUser(profile);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [fetchCurrentUser]);

  const saveAuthSession = (authData: AuthResponse) => {
    const { user: profile, tokens } = authData;
    setCookie(TOKEN_COOKIE_KEY, tokens.accessToken, { maxAge: tokens.expiresIn, path: '/' });
    setCookie(REFRESH_COOKIE_KEY, tokens.refreshToken, { maxAge: 30 * 24 * 60 * 60, path: '/' });
    setToken(tokens.accessToken);
    setUser(profile);
  };

  const login = async (payload: LoginPayload) => {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      const errorMsg =
        data.error?.message || data.message || 'Login failed. Please check your credentials.';
      throw new Error(errorMsg);
    }

    const authResponse: AuthResponse = data.data || data;
    saveAuthSession(authResponse);
  };

  const register = async (payload: RegisterPayload) => {
    const res = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      const errorMsg =
        data.error?.message || data.message || 'Registration failed. Please try again.';
      throw new Error(errorMsg);
    }

    const authResponse: AuthResponse = data.data || data;
    saveAuthSession(authResponse);
  };

  const logout = async () => {
    const currentToken = token || (getCookie(TOKEN_COOKIE_KEY) as string | undefined);
    const refreshToken = getCookie(REFRESH_COOKIE_KEY) as string | undefined;

    if (currentToken) {
      try {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentToken}`,
          },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // Ignore network failure on logout
      }
    }

    deleteCookie(TOKEN_COOKIE_KEY, { path: '/' });
    deleteCookie(REFRESH_COOKIE_KEY, { path: '/' });
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    const currentToken = token || (getCookie(TOKEN_COOKIE_KEY) as string | undefined);
    if (currentToken) {
      const profile = await fetchCurrentUser(currentToken);
      if (profile) {
        setUser(profile);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
