import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getErrorMessage } from '../api/client';
import { User, LoginResponse } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  privateKey: string | null;
  setPrivateKey: (key: string | null) => void;
  login: (email: string, password: string) => Promise<LoginResponse>;
  verifyMfa: (email: string, otpCode: string) => Promise<User>;
  register: (email: string, password: string, firstName?: string, lastName?: string, publicKeyEcc?: string) => Promise<User>;
  verifyEmail: (email: string, otpCode: string) => Promise<User>;
  loginWithGoogle: (idToken: string, publicKeyEcc?: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function sanitizePrivateKey(key: string | null): string | null {
  if (!key) return null;
  let cleaned = key.trim();
  if (cleaned.includes('-----BEGIN')) {
    cleaned = cleaned
      .replace(/-----BEGIN[\s\S]*?-----/g, '')
      .replace(/-----END[\s\S]*?-----/g, '')
      .replace(/["']/g, '')
      .replace(/\s+/g, '');
  }
  return cleaned || null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [privateKey, setPrivateKeyState] = useState<string | null>(() => {
    const saved = localStorage.getItem('user');
    let raw: string | null = null;
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u?.email) {
          raw = localStorage.getItem(`ecc_private_key_${u.email}`) || localStorage.getItem('ecc_private_key');
        }
      } catch {}
    }
    if (!raw) {
      raw = localStorage.getItem('ecc_private_key');
    }
    return sanitizePrivateKey(raw);
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync private key whenever user changes
  useEffect(() => {
    if (user?.email) {
      const userKey = localStorage.getItem(`ecc_private_key_${user.email}`);
      setPrivateKeyState(sanitizePrivateKey(userKey));
    } else {
      setPrivateKeyState(null);
    }
  }, [user?.email]);

  const setPrivateKey = (key: string | null) => {
    const cleaned = sanitizePrivateKey(key);
    setPrivateKeyState(cleaned);
    if (cleaned) {
      localStorage.setItem('ecc_private_key', cleaned);
      if (user?.email) {
        localStorage.setItem(`ecc_private_key_${user.email}`, cleaned);
      }
    } else {
      localStorage.removeItem('ecc_private_key');
      if (user?.email) {
        localStorage.removeItem(`ecc_private_key_${user.email}`);
      }
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.get<User>('/auth/me');
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      if (res.data?.email) {
        const storedKey = localStorage.getItem(`ecc_private_key_${res.data.email}`);
        if (storedKey) setPrivateKeyState(storedKey);
      }
    } catch {
      // Token might be invalid
      setUser(null);
      setToken(null);
      setPrivateKeyState(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('ecc_private_key');
    }
  };

  useEffect(() => {
    if (token) {
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<LoginResponse> => {
    const res = await api.post<LoginResponse>('/auth/login', { email, password });
    if (!res.data.mfaRequired && res.data.accessToken && res.data.user) {
      setToken(res.data.accessToken);
      setUser(res.data.user);
      localStorage.setItem('token', res.data.accessToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const verifyMfa = async (email: string, otpCode: string): Promise<User> => {
    const res = await api.post<LoginResponse>('/auth/verify-login-otp', {
      email,
      otpCode,
      purpose: 'LOGIN_MFA',
    });
    if (res.data.accessToken && res.data.user) {
      setToken(res.data.accessToken);
      setUser(res.data.user);
      localStorage.setItem('token', res.data.accessToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      return res.data.user;
    }
    throw new Error('Authentication failed');
  };

  const register = async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    publicKeyEcc?: string
  ): Promise<User> => {
    const res = await api.post<User>('/auth/register', {
      email,
      password,
      firstName,
      lastName,
      publicKeyEcc,
    });
    return res.data;
  };

  const verifyEmail = async (email: string, otpCode: string): Promise<User> => {
    const res = await api.post<User>('/auth/verify-email', {
      email,
      otpCode,
      purpose: 'REGISTRATION_VERIFICATION',
    });
    return res.data;
  };

  const loginWithGoogle = async (idToken: string, publicKeyEcc?: string): Promise<User> => {
    const res = await api.post<LoginResponse>('/auth/google', {
      idToken,
      publicKeyEcc,
    });
    if (res.data.accessToken && res.data.user) {
      setToken(res.data.accessToken);
      setUser(res.data.user);
      localStorage.setItem('token', res.data.accessToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      return res.data.user;
    }
    throw new Error('Google authentication failed');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore
    } finally {
      setUser(null);
      setToken(null);
      setPrivateKeyState(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('ecc_private_key');
    }
  };

  const isAdmin = Boolean(user?.roles?.some((r) => r.toUpperCase() === 'ADMIN' || r === 'ROLE_ADMIN'));

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isAdmin,
        isLoading,
        privateKey,
        setPrivateKey,
        login,
        verifyMfa,
        register,
        verifyEmail,
        loginWithGoogle,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
