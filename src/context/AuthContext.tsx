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
            } else {
              localStorage.removeItem('webstore360_admin_token');
              setToken(null);
              setAdminUser(null);
            }
          } else {
            localStorage.removeItem('webstore360_admin_token');
            setToken(null);
            setAdminUser(null);
          }
        } catch {
          // Token check failed
        }
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
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Credenciais inválidas. Verifique o usuário e a senha.',
        };
      }

      setToken(data.token);
      setAdminUser(data.user);
      localStorage.setItem('webstore360_admin_token', data.token);

      return { success: true };
    } catch (err: any) {
      console.error('Login error:', err);
      return { success: false, error: 'Erro de conexão ao autenticar. Tente novamente.' };
    }
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
