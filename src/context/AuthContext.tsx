// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User as FirebaseUser, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  setPersistence, 
  browserLocalPersistence
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User } from '../types';

// En AuthContext.tsx, modifica la interfaz
interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, userData: Partial<User>) => Promise<string>; // Cambiado a Promise<string>
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (userData: Partial<User>) => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Función para obtener el perfil de usuario desde Firestore
  const fetchUserProfile = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'usuarios', uid));
      if (userDoc.exists()) {
        // Convertir Firestore timestamps a Date
        const data = userDoc.data();
        const userData: User = {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastLogin: data.lastLogin?.toDate() || null,
          updatedAt: data.updatedAt?.toDate(),
        } as User;
        
        setUserProfile(userData);
      } else {
        console.error('No se encontró el perfil de usuario');
      }
    } catch (error) {
      console.error('Error al obtener el perfil de usuario:', error);
    }
  };

  // Observador de cambios en la autenticación
  useEffect(() => {
    // Configurar persistencia
    setPersistence(auth, browserLocalPersistence);
  
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          // Primero verificamos si existe el documento
          const userDocRef = doc(db, 'usuarios', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            // Si existe, podemos obtener los datos y actualizar el último login
            await fetchUserProfile(user.uid);
            await updateDoc(userDocRef, {
              lastLogin: serverTimestamp()
            });
          } else {
            // Si no existe, no hacemos nada por ahora o podemos manejar de otra forma
            console.warn(`Usuario autenticado pero sin documento en Firestore: ${user.uid}`);
            setUserProfile(null);
          }
        } catch (error) {
          console.error('Error al procesar usuario autenticado:', error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
  
    return () => unsubscribe();
  }, []);

  // Función para iniciar sesión
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

// Función para registrar un nuevo usuario
const register = async (email: string, password: string, userData: Partial<User>): Promise<string> => {
  try {
    setLoading(true);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Crear objeto base del usuario
    const newUser: Partial<User> = {
      id: user.uid,
      nombre: userData.nombre || '',
      apellido: userData.apellido || '',
      email: user.email || '',
      role: userData.role || 'user',
      estado: userData.role === 'superadmin' ? 'activo' : userData.estado || 'pendiente',
      lastLogin: new Date(),
      createdAt: new Date()
    };

    // Añadir lubricentroId solo si existe
    if (userData.lubricentroId) {
      newUser.lubricentroId = userData.lubricentroId;
    }

    // Crear perfil en Firestore
    await setDoc(doc(db, 'usuarios', user.uid), {
      ...newUser,
      lastLogin: serverTimestamp(),
      createdAt: serverTimestamp()
    });
    
    setUserProfile(newUser as User);
    return user.uid; // Devolver el ID del usuario creado
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    throw error;
  } finally {
    setLoading(false);
  }
};

  // Función para cerrar sesión
  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Función para restablecer contraseña
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error al enviar correo de restablecimiento:', error);
      throw error;
    }
  };

  // Función para actualizar el perfil de usuario
  const updateUserProfile = async (userData: Partial<User>) => {
    try {
      if (!currentUser) throw new Error('No hay usuario autenticado');
      
      await updateDoc(doc(db, 'usuarios', currentUser.uid), {
        ...userData,
        updatedAt: serverTimestamp()
      });
      
      // Actualizar el estado local
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          ...userData
        });
      }
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    currentUser,
  userProfile,
  loading,
  login,
  register,
  logout,
  resetPassword,
  updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}