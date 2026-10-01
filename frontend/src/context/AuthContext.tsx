import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { ApiError, authApi } from '@/lib/api';
import { tokenStorage } from '@/lib/token-storage';
import type { LoginInput, RegisterInput, User } from '@/types/user';

/**
 * Session state for the whole app.
 *
 * Holds the user and token, persists the token in the device keystore, and
 * revalidates it against `/auth/me` on launch so a revoked or expired token
 * cannot leave the app in a half-signed-in state.
 */

/** `restoring` covers the launch-time token check, before any screen renders. */
export type AuthStatus = 'restoring' | 'signed-in' | 'signed-out';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  status: AuthStatus;
  isSubmitting: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>('restoring');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Guards against setState after unmount during the async restore.
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Runs once on mount: adopt a stored token, or fall through to signed-out.
  useEffect(() => {
    const restore = async () => {
      try {
        const stored = await tokenStorage.get();

        if (!stored) {
          if (mounted.current) setStatus('signed-out');
          return;
        }

        try {
          const currentUser = await authApi.me(stored);
          if (!mounted.current) return;
          setToken(stored);
          setUser(currentUser);
          setStatus('signed-in');
        } catch {
          // The token is expired, tampered with, or the account is gone.
          // Drop it so the app starts clean instead of retrying every launch.
          await tokenStorage.clear().catch(() => {});
          if (!mounted.current) return;
          setStatus('signed-out');
        }
      } catch {
        // Keystore itself failed; treat as signed out rather than hanging on splash.
        if (mounted.current) setStatus('signed-out');
      }
    };

    void restore();
  }, []);

  const completeSignIn = useCallback(async (auth: { token: string; user: User }) => {
    await tokenStorage.set(auth.token);
    if (!mounted.current) return;
    setToken(auth.token);
    setUser(auth.user);
    setStatus('signed-in');
  }, []);

  const login = useCallback(
    async (input: LoginInput) => {
      setIsSubmitting(true);
      try {
        const auth = await authApi.login(input);
        await completeSignIn(auth);
      } finally {
        if (mounted.current) setIsSubmitting(false);
      }
    },
    [completeSignIn],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      setIsSubmitting(true);
      try {
        const auth = await authApi.register(input);
        await completeSignIn(auth);
      } finally {
        if (mounted.current) setIsSubmitting(false);
      }
    },
    [completeSignIn],
  );

  const logout = useCallback(async () => {
    await tokenStorage.clear().catch(() => {});
    if (!mounted.current) return;
    setToken(null);
    setUser(null);
    setStatus('signed-out');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, status, isSubmitting, login, register, logout }),
    [user, token, status, isSubmitting, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }

  return context;
}

export { ApiError };
export default AuthContext;
