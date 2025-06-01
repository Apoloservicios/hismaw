// src/hooks/useAuth.ts
import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        // Obtener datos adicionales del usuario desde Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setUser({
              ...userData,
              id: firebaseUser.uid
            });
          } else {
            // Si no existe el documento del usuario, crear uno básico
            const basicUser: User = {
              id: firebaseUser.uid,
              nombre: firebaseUser.displayName?.split(' ')[0] || 'Usuario',
              apellido: firebaseUser.displayName?.split(' ')[1] || 'Sin Apellido',
              email: firebaseUser.email || '',
              role: 'user',
              estado: 'activo',
              lubricentroId: null,
              createdAt: new Date(),
              lastLogin: new Date()
            };
            
            await setDoc(doc(db, 'users', firebaseUser.uid), basicUser);
            setUser(basicUser);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      
      // Actualizar último login
      if (auth.currentUser) {
        await setDoc(
          doc(db, 'users', auth.currentUser.uid),
          { lastLogin: new Date() },
          { merge: true }
        );
      }
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<User>): Promise<void> => {
    try {
      setLoading(true);
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Crear documento de usuario en Firestore
      const newUser: User = {
        id: firebaseUser.uid,
        nombre: userData.nombre || 'Usuario',
        apellido: userData.apellido || 'Sin Apellido',
        email: firebaseUser.email || email,
        role: userData.role || 'user',
        estado: 'activo',
        lubricentroId: userData.lubricentroId || null,
        createdAt: new Date(),
        lastLogin: new Date(),
        ...userData
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      setUser(newUser);
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    signIn,
    signUp,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Hook adicional para verificar permisos
export const usePermissions = () => {
  const { user } = useAuth();
  
  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin';
  const isUser = user?.role === 'user';
  
  const canAccessLubricentro = (lubricentroId: string) => {
    if (isSuperAdmin) return true;
    if (isAdmin || isUser) return user?.lubricentroId === lubricentroId;
    return false;
  };
  
  const canManageSubscriptions = () => {
    return isSuperAdmin;
  };
  
  const canCreateService = () => {
    return user?.estado === 'activo';
  };
  
  const canManageUsers = (targetLubricentroId?: string) => {
    if (isSuperAdmin) return true;
    if (isAdmin && targetLubricentroId) {
      return user?.lubricentroId === targetLubricentroId;
    }
    return false;
  };
  
  return {
    user,
    isSuperAdmin,
    isAdmin,
    isUser,
    canAccessLubricentro,
    canManageSubscriptions,
    canCreateService,
    canManageUsers
  };
};