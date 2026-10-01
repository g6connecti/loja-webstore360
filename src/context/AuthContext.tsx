import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';

export const AUTHORIZED_ADMIN_EMAIL = 'lagarelli@gmail.com';

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin';
}

interface AuthContextType {
  user: User | null;
  adminUser: AdminUser | null;
  loading: boolean;
  token: string | null;
  signInWithGoogle: () => Promise<void>;
  loginWithCredentials: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  adminUser: null,
  loading: true,
  token: null,
  signInWithGoogle: async () => {},
  loginWithCredentials: async () => ({ success: false }),
  logout: async () => {},
  isAdmin: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('webstore360_admin_token');
  });
  const [loading, setLoading] = useState(true);

  // Check stored admin token on initial load
  useEffect(() => {
    const checkStoredToken = async () => {
      const storedToken = localStorage.getItem('webstore360_admin_token');
      if (storedToken) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.user?.email?.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
              setAdminUser({
                uid: data.user.uid || 'admin-lagarelli',
                email: data.user.email,
                displayName: data.user.name || 'Luiz Ricardo Agarelli',
                role: 'admin',
              });
              setToken(storedToken);
              setLoading(false);
              return;
            }
          }
        } catch {
          // If server is not present (static deploy)
        }

        // Direct token validation for static hosting
        try {
          const parts = storedToken.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            if (payload.email?.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
              setAdminUser({
                uid: payload.uid || 'admin-lagarelli',
                email: payload.email,
                displayName: payload.name || 'Luiz Ricardo Agarelli',
                role: 'admin',
              });
              setToken(storedToken);
              setLoading(false);
              return;
            }
          }
        } catch {
          // parse error
        }

        // If validation failed
        localStorage.removeItem('webstore360_admin_token');
        setToken(null);
        setAdminUser(null);
      }
      setLoading(false);
    };

    checkStoredToken();
  }, []);

  // Firebase auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          if (currentUser.email?.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
            const idToken = await currentUser.getIdToken();
            if (idToken && idToken.split('.').length === 3) {
              setToken(idToken);
              setAdminUser({
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName || 'Luiz Ricardo Agarelli',
                role: 'admin',
              });
              localStorage.setItem('webstore360_admin_token', idToken);
            }
          } else {
            // Not the authorized admin email
            setAdminUser(null);
          }
        } catch (err) {
          console.error('Error handling Firebase Auth state:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Login with Email & Password (lagarelli@gmail.com / Lr@@200862##)
  const loginWithCredentials = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Try local express backend if available
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.token) {
          setToken(data.token);
          setAdminUser(data.user);
          localStorage.setItem('webstore360_admin_token', data.token);
          return { success: true };
        }
      } else if (res.status === 401 || res.status === 403) {
        const data = await res.json().catch(() => ({}));
        return {
          success: false,
          error: data.error || 'Credenciais inválidas. Verifique o usuário e a senha.',
        };
      }
    } catch {
      // Backend not running (e.g. static hosting on GitHub Pages/Vercel)
    }

    // 2. Direct client verification (essential for static deployments without /api routes)
    if (normalizedEmail === AUTHORIZED_ADMIN_EMAIL.toLowerCase() && password === 'Lr@@200862##') {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(
        JSON.stringify({
          uid: 'admin-lagarelli',
          email: AUTHORIZED_ADMIN_EMAIL,
          name: 'Luiz Ricardo Agarelli',
          role: 'admin',
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
        })
      );
      const directToken = `${header}.${payload}.static_client_auth`;
      const adminInfo: AdminUser = {
        uid: 'admin-lagarelli',
        email: AUTHORIZED_ADMIN_EMAIL,
        displayName: 'Luiz Ricardo Agarelli',
        role: 'admin',
      };
      setToken(directToken);
      setAdminUser(adminInfo);
      localStorage.setItem('webstore360_admin_token', directToken);
      return { success: true };
    }

    return {
      success: false,
      error: 'Credenciais inválidas. Apenas o usuário lagarelli@gmail.com possui acesso administrativo.',
    };
  };

  // Google Sign-In with strict email whitelist
  const handleSignIn = async () => {
    try {
      const res = await signInWithPopup(auth, googleAuthProvider);
      if (res.user.email?.toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
        await signOut(auth);
        setUser(null);
        setAdminUser(null);
        setToken(null);
        localStorage.removeItem('webstore360_admin_token');
        throw new Error(`Acesso negado: Somente o usuário ${AUTHORIZED_ADMIN_EMAIL} possui acesso ao painel.`);
      }

      const idToken = await res.user.getIdToken();
      setToken(idToken);
      setAdminUser({
        uid: res.user.uid,
        email: res.user.email!,
        displayName: res.user.displayName || 'Luiz Ricardo Agarelli',
        role: 'admin',
      });
      localStorage.setItem('webstore360_admin_token', idToken);
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      throw err;
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {
      // Ignore signOut error
    }
    setUser(null);
    setAdminUser(null);
    setToken(null);
    localStorage.removeItem('webstore360_admin_token');
  };

  const isAdmin = Boolean(
    (user?.email && user.email.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase()) ||
    (adminUser?.email && adminUser.email.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase())
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        adminUser,
        loading,
        token,
        signInWithGoogle: handleSignIn,
        loginWithCredentials,
        logout: handleLogout,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
