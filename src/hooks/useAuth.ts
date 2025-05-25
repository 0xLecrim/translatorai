"use client";

import { useState, useEffect, createContext, useContext } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      verifySession(sessionId);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifySession = async (sessionId: string) => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'verify',
          sessionId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('sessionId');
      }
    } catch (err) {
      console.error('Session verification failed:', err);
      localStorage.removeItem('sessionId');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'login',
          email,
          password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        localStorage.setItem('sessionId', data.sessionId);
        return true;
      } else {
        setError(data.error || 'Błąd logowania');
        return false;
      }
    } catch (err) {
      setError('Błąd połączenia z serwerem');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'register',
          username,
          email,
          password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        localStorage.setItem('sessionId', data.sessionId);
        return true;
      } else {
        setError(data.error || 'Błąd rejestracji');
        return false;
      }
    } catch (err) {
      setError('Błąd połączenia z serwerem');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    const sessionId = localStorage.getItem('sessionId');
    
    if (sessionId) {
      try {
        await fetch('/api/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'logout',
            sessionId
          }),
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }

    localStorage.removeItem('sessionId');
    setUser(null);
    setError(null);
  };

  return {
    user,
    isLoading,
    login,
    register,
    logout,
    error
  };
}
