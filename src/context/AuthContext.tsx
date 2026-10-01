import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  token: null,
  signInWithGoogle: async () => {},
  logout: async () => {},
  isAdmin: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const idToken = await currentUser.getIdToken();
          setToken(idToken);
          // Sync with server users table
          await fetch('/api/auth/sync-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
          });
        } catch (err) {
          console.error('Error fetching token/syncing user:', err);
        }
      } else {
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      const res = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await res.user.getIdToken();
      setToken(idToken);
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      throw err;
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setToken(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        signInWithGoogle: handleSignIn,
        logout: handleLogout,
        isAdmin: !!user, // Any authenticated user in this admin context has access
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
