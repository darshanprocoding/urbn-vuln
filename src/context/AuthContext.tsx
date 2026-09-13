import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  username: string;
  name: string;
  role: string;
  badge: string;
  loginTime: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: UserProfile | null;
  login: (username: string, password: string) => { success: boolean; error?: string };
  quickJudgeLogin: () => void;
  logout: () => void;
}

const AUTH_STORAGE_KEY = 'bharat_watchdogs_ndma_auth_v1';

const DEFAULT_JUDGE_USER: UserProfile = {
  username: 'bharat',
  name: 'Commander Bharat',
  role: 'Hackathon Judge / NDMA Tactical Lead',
  badge: 'LEVEL 5 CLEARANCE',
  loginTime: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.isAuthenticated === 'boolean') {
          return parsed.isAuthenticated;
        }
      }
    } catch {
      // ignore
    }
    return true; // Default to authenticated for instant operational preview
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.user) return parsed.user;
      }
    } catch {
      // ignore
    }
    return DEFAULT_JUDGE_USER;
  });

  useEffect(() => {
    try {
      if (isAuthenticated && currentUser) {
        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({ isAuthenticated: true, user: currentUser })
        );
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [isAuthenticated, currentUser]);

  const login = (usernameInput: string, passwordInput: string) => {
    const cleanUser = (usernameInput || '').trim().toLowerCase();
    const cleanPass = (passwordInput || '').trim();

    if (cleanUser === 'bharat' && cleanPass === 'watchdogs') {
      const user: UserProfile = {
        username: 'bharat',
        name: 'Commander Bharat',
        role: 'NDMA Tactical Commander',
        badge: 'LEVEL 5 CLEARANCE',
        loginTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setIsAuthenticated(true);
      setCurrentUser(user);
      return { success: true };
    }

    return {
      success: false,
      error: 'Invalid access credentials. Use Name: "bharat" and Password: "watchdogs", or use 1-Click Judge Access.',
    };
  };

  const quickJudgeLogin = () => {
    const user: UserProfile = {
      username: 'bharat',
      name: 'Commander Bharat',
      role: 'Hackathon Judge (Tactical Clearance)',
      badge: 'JUDGE VIP CLEARANCE',
      loginTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setIsAuthenticated(true);
    setCurrentUser(user);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        login,
        quickJudgeLogin,
        logout,
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
