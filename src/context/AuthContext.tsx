import type React from 'react';
import {
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
      // If user rejected cookies, do NOT call /api/auth/me (prevent cookie transmission)
      const consent = localStorage.getItem('poke_cookie_consent');
      if (consent === 'rejected') {
        setUser(null);
        setIsLoading(false);
        return;
      }

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

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Logout request failed:', err);
    } finally {
      setUser(null);
      try {
        localStorage.removeItem('saved_parties');
        localStorage.removeItem('current_party_id');
        localStorage.removeItem('deleted_party_ids');
        localStorage.removeItem('saved_party');
      } catch (e) {
        console.warn(
          'Failed to clear party data from localStorage on logout:',
          e
        );
      }
      window.dispatchEvent(new CustomEvent('poke:parties-reset'));
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const handleCookieRejected = async () => {
      await logout();
    };
    const handleCookieAccepted = () => {
      checkAuth();
    };

    window.addEventListener('poke:cookie-rejected', handleCookieRejected);
    window.addEventListener('poke:cookie-accepted', handleCookieAccepted);
    return () => {
      window.removeEventListener('poke:cookie-rejected', handleCookieRejected);
      window.removeEventListener('poke:cookie-accepted', handleCookieAccepted);
    };
  }, [logout, checkAuth]);

  const loginWithGoogle = () => {
    if (localStorage.getItem('poke_cookie_consent') === 'rejected') {
      window.dispatchEvent(new CustomEvent('poke:open-cookie-settings'));
      return;
    }
    const currentPath =
      typeof window !== 'undefined'
        ? window.location.pathname + window.location.search
        : '/party-ranking.html';
    const returnUrl = encodeURIComponent(currentPath);
    window.location.href = `/api/auth/google?redirect_to=${returnUrl}`;
  };

  const loginWithX = () => {
    if (localStorage.getItem('poke_cookie_consent') === 'rejected') {
      window.dispatchEvent(new CustomEvent('poke:open-cookie-settings'));
      return;
    }
    window.location.href = '/api/auth/x';
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
