'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { api, ApiError } from '@/lib/api';
import type { AuthUser, AuthResponse, RestaurantMembershipInfo } from '@sdm/shared';

interface AuthState {
  user: AuthUser | null;
  memberships: RestaurantMembershipInfo[];
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    memberships: [],
    isLoading: true,
    isAuthenticated: false,
  });

  const setTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem('sdm_access_token', accessToken);
    localStorage.setItem('sdm_refresh_token', refreshToken);
  };

  const clearTokens = () => {
    localStorage.removeItem('sdm_access_token');
    localStorage.removeItem('sdm_refresh_token');
  };

  const fetchUser = useCallback(async () => {
    try {
      const data = await api.get<{ user: AuthUser; memberships: RestaurantMembershipInfo[] }>(
        '/auth/me',
      );
      setState({
        user: data.user,
        memberships: data.memberships,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch {
      clearTokens();
      setState({ user: null, memberships: [], isLoading: false, isAuthenticated: false });
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('sdm_access_token');
    if (token) {
      fetchUser();
    } else {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const data = await api.post<AuthResponse>('/auth/login', { email, password });
    setTokens(data.tokens.accessToken, data.tokens.refreshToken);
    setState({
      user: data.user,
      memberships: [],
      isLoading: false,
      isAuthenticated: true,
    });
    // Fetch full user data including memberships
    await fetchUser();
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await api.post<AuthResponse>('/auth/register', { name, email, password });
    setTokens(data.tokens.accessToken, data.tokens.refreshToken);
    setState({
      user: data.user,
      memberships: [],
      isLoading: false,
      isAuthenticated: true,
    });
  };

  const logout = () => {
    clearTokens();
    setState({ user: null, memberships: [], isLoading: false, isAuthenticated: false });
  };

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, refreshUser: fetchUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { ApiError };
