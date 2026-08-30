import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  isFirebaseConfigured,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  updateProfile,
  testFirestoreConnection,
} from '../firebase/config';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isFirebaseLive: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName: string) => Promise<void>;
  signInAsDemo: (name?: string) => void;
  signOut: () => Promise<void>;
  saveCustomFirebaseConfig: (configJson: string) => boolean;
  clearCustomFirebaseConfig: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFirebaseLive, setIsFirebaseLive] = useState<boolean>(isFirebaseConfigured);

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Journaler',
            photoURL: firebaseUser.photoURL,
            isAnonymous: firebaseUser.isAnonymous,
            providerId: firebaseUser.providerData[0]?.providerId || 'password',
          });
          testFirestoreConnection().catch(console.warn);
        } else {
          // If no logged in user in Firebase, check for demo/local session
          const savedDemoUser = localStorage.getItem('pgj_demo_user');
          if (savedDemoUser) {
            try {
              setUser(JSON.parse(savedDemoUser));
            } catch (e) {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      // Local/Sandbox mode
      const savedDemoUser = localStorage.getItem('pgj_demo_user');
      if (savedDemoUser) {
        try {
          setUser(JSON.parse(savedDemoUser));
        } catch (e) {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = async () => {
    if (isFirebaseConfigured && auth) {
      setLoading(true);
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const fbUser = result.user;
        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Journaler',
          photoURL: fbUser.photoURL,
          isAnonymous: fbUser.isAnonymous,
          providerId: fbUser.providerData[0]?.providerId || 'google.com',
        });
      } catch (error: any) {
        console.error('Google Sign In Error:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    } else {
      // Demo simulated login
      signInAsDemo('Joy Patel (Google)');
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (isFirebaseConfigured && auth) {
      setLoading(true);
      try {
        const result = await signInWithEmailAndPassword(auth, email, pass);
        const fbUser = result.user;
        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Journaler',
          photoURL: fbUser.photoURL,
          isAnonymous: fbUser.isAnonymous,
          providerId: 'password',
        });
      } catch (error: any) {
        console.error('Email Sign In Error:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    } else {
      signInAsDemo(email.split('@')[0]);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, displayName: string) => {
    if (isFirebaseConfigured && auth) {
      setLoading(true);
      try {
        const result = await createUserWithEmailAndPassword(auth, email, pass);
        if (result.user && displayName) {
          await updateProfile(result.user, { displayName });
        }
        setUser({
          uid: result.user.uid,
          email: result.user.email,
          displayName: displayName || result.user.email?.split('@')[0] || 'Journaler',
          photoURL: result.user.photoURL,
          isAnonymous: result.user.isAnonymous,
          providerId: 'password',
        });
      } catch (error: any) {
        console.error('Email Sign Up Error:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    } else {
      signInAsDemo(displayName || email.split('@')[0]);
    }
  };

  const signInAsDemo = (name: string = 'Demo User') => {
    const demoUser: UserProfile = {
      uid: 'demo_user_gemini_journaler',
      email: 'joypatel2x6@gmail.com',
      displayName: name,
      photoURL: null,
      isAnonymous: true,
      providerId: 'demo',
    };
    setUser(demoUser);
    localStorage.setItem('pgj_demo_user', JSON.stringify(demoUser));
  };

  const signOut = async () => {
    if (isFirebaseConfigured && auth) {
      await firebaseSignOut(auth);
    }
    localStorage.removeItem('pgj_demo_user');
    setUser(null);
  };

  const saveCustomFirebaseConfig = (configJson: string): boolean => {
    try {
      const parsed = JSON.parse(configJson);
      if (!parsed.apiKey || !parsed.projectId) {
        throw new Error('Missing apiKey or projectId');
      }
      localStorage.setItem('pgj_custom_firebase_config', JSON.stringify(parsed));
      window.location.reload();
      return true;
    } catch (e) {
      console.error('Invalid Firebase Config JSON:', e);
      return false;
    }
  };

  const clearCustomFirebaseConfig = () => {
    localStorage.removeItem('pgj_custom_firebase_config');
    window.location.reload();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isFirebaseLive,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signInAsDemo,
        signOut,
        saveCustomFirebaseConfig,
        clearCustomFirebaseConfig,
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
