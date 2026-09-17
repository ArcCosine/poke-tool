import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

export interface AuthUser {
  id: string;
  name: string;
  avatarUrl?: string;
  authProvider: 'google' | 'x';
}

interface AuthContextProps {
  user: AuthUser | null;
  isLoading: boolean;
  clientId: string;
  loginWithGoogle: () => void;
  loginWithX: () => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

const CLIENT_ID_KEY = 'poke_anon_client_id';

function getOrCreateClientId(): string {
  try {
    const existing = localStorage.getItem(CLIENT_ID_KEY);
    if (existing && existing.startsWith('anon:')) {
      return existing;
    }
    const newId = `anon:${crypto.randomUUID()}`;
    localStorage.setItem(CLIENT_ID_KEY, newId);
    return newId;
  } catch {
    return 'anon:temp-fallback-id';
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [clientId] = useState<string>(() => getOrCreateClientId());

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/me', {
        headers: { 'X-Client-Id': clientId },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const loginWithGoogle = () => {
    const currentPath =
      typeof window !== 'undefined'
        ? window.location.pathname + window.location.search
        : '/party-ranking.html';
    const returnUrl = encodeURIComponent(currentPath);
    window.location.href = `/api/auth/google?redirect_to=${returnUrl}`;
  };

  const loginWithX = () => {
    window.location.href = '/api/auth/x';
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Logout request failed:', err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        clientId,
        loginWithGoogle,
        loginWithX,
        logout,
        checkAuth,
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
