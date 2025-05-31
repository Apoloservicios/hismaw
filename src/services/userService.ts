// src/services/userService.ts - VERSIÓN ACTUALIZADA
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc,
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  limit,
  Timestamp
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail, 
  updatePassword,
  deleteUser
} from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { User, UserRole, UserStatus } from '../types';
// ✅ CAMBIO PRINCIPAL: Usar el nuevo servicio unificado
import { validateUserCreation } from './unifiedSubscriptionService';

import { getLubricentroById } from '../services/lubricentroService';

const COLLECTION_NAME = 'usuarios';

// Convertir datos de Firestore a nuestro tipo de usuario
const convertFirestoreUser = (doc: any): User => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    lastLogin: data.lastLogin?.toDate() || null,
    updatedAt: data.updatedAt?.toDate(),
  } as User;
};

// Obtener usuario por ID
export const getUserById = async (id: string): Promise<User> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return convertFirestoreUser(docSnap);
    } else {
      throw new Error('No se encontró el usuario');
    }
  } catch (error) {
    console.error('Error al obtener el usuario:', error);
    throw error;
  }
};

// Obtener usuarios por lubricentro
export const getUsersByLubricentro = async (lubricentroId: string): Promise<User[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('lubricentroId', '==', lubricentroId),
      orderBy('apellido', 'asc'),
      orderBy('nombre', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => convertFirestoreUser(doc));
  } catch (error) {
    console.error('Error al obtener los usuarios del lubricentro:', error);
    throw error;
  }
};

// Obtener super admins
export const getSuperAdmins = async (): Promise<User[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('role', '==', 'superadmin')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => convertFirestoreUser(doc));
  } catch (error) {
    console.error('Error al obtener los superadmins:', error);
    throw error;
  }
};

// Crear usuario
export const createUser = async (
  email: string, 
  password: string, 
  userData: Omit<User, 'id' | 'createdAt' | 'lastLogin'>
): Promise<string> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    
    await setDoc(doc(db, COLLECTION_NAME, uid), {
      ...userData,
      email,
      id: uid,
      createdAt: serverTimestamp(),
      lastLogin: null
    });
    
    return uid;
  } catch (error) {
    console.error('Error al crear el usuario:', error);
    throw error;
  }
};

// ✅ CAMBIO PRINCIPAL: Invitar usuario con validación unificada
export const inviteUser = async (
  email: string,
  userData: {
    nombre: string;
    apellido: string;
    role: UserRole;
    lubricentroId: string;
  }
): Promise<void> => {
  try {
    console.log('🔄 Iniciando invitación de usuario...');
    
    // ✅ NUEVA VALIDACIÓN UNIFICADA
    const validation = await validateUserCreation(userData.lubricentroId);
    
    if (!validation.canCreateUser) {
      console.error('❌ Validación de usuario falló:', validation.message);
      throw new Error(validation.message || 'No se puede invitar más usuarios');
    }
    
    console.log('✅ Validación de usuario exitosa');
    console.log(`👥 Usuarios restantes: ${validation.remainingUsers}`);
    
    // Aquí continuaría la lógica de invitación (envío de email, etc.)
    // Por ahora solo validamos los límites
    
  } catch (error) {
    console.error('❌ Error al invitar al usuario:', error);
    throw error;
  }
};

// Verificar email disponible
export const isEmailAvailable = async (email: string): Promise<boolean> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('email', '==', email),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.empty;
  } catch (error) {
    console.error('Error al verificar disponibilidad del email:', error);
    throw error;
  }
};

// Actualizar usuario
export const updateUserProfile = async (id: string, data: Partial<User>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    
    const { id: _, createdAt: __, ...updateData } = data;
    
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    
    if (data.email && auth.currentUser && auth.currentUser.uid === id) {
      await updateEmail(auth.currentUser, data.email);
    }
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    throw error;
  }
};

// Actualizar contraseña de usuario
export const updateUserPassword = async (id: string, newPassword: string): Promise<void> => {
  try {
    if (auth.currentUser && auth.currentUser.uid === id) {
      await updatePassword(auth.currentUser, newPassword);
    } else {
      throw new Error('El usuario debe estar autenticado para cambiar su contraseña');
    }
  } catch (error) {
    console.error('Error al actualizar la contraseña:', error);
    throw error;
  }
};

// Reautenticar usuario
export const reauthenticateUser = async (password: string): Promise<void> => {
  try {
    if (!auth.currentUser || !auth.currentUser.email) {
      throw new Error('No hay usuario autenticado');
    }
    
    const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
    await reauthenticateWithCredential(auth.currentUser, credential);
  } catch (error) {
    console.error('Error al reautenticar al usuario:', error);
    throw error;
  }
};

// Actualizar estado de usuario
export const updateUserStatus = async (id: string, estado: UserStatus): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    
    await updateDoc(docRef, {
      estado,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error al actualizar el estado del usuario:', error);
    throw error;
  }
};

// Eliminar usuario
export const deleteUserAccount = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    
    if (auth.currentUser && auth.currentUser.uid === id) {
      await deleteUser(auth.currentUser);
    }
  } catch (error) {
    console.error('Error al eliminar el usuario:', error);
    throw error;
  }
};

// Buscar usuarios
export const searchUsers = async (
  searchTerm: string,
  lubricentroId?: string,
  maxResults: number = 10
): Promise<User[]> => {
  try {
    let constraints = [];
    
    if (lubricentroId) {
      constraints.push(where('lubricentroId', '==', lubricentroId));
    }
    
    const qNombre = query(
      collection(db, COLLECTION_NAME),
      ...constraints,
      where('nombre', '>=', searchTerm),
      where('nombre', '<=', searchTerm + '\uf8ff'),
      orderBy('nombre'),
      limit(maxResults)
    );
    
    const nombreSnapshot = await getDocs(qNombre);
    const nombreResults = nombreSnapshot.docs.map(doc => convertFirestoreUser(doc));
    
    const qApellido = query(
      collection(db, COLLECTION_NAME),
      ...constraints,
      where('apellido', '>=', searchTerm),
      where('apellido', '<=', searchTerm + '\uf8ff'),
      orderBy('apellido'),
      limit(maxResults)
    );
    
    const apellidoSnapshot = await getDocs(qApellido);
    const apellidoResults = apellidoSnapshot.docs.map(doc => convertFirestoreUser(doc));
    
    const qEmail = query(
      collection(db, COLLECTION_NAME),
      ...constraints,
      where('email', '>=', searchTerm),
      where('email', '<=', searchTerm + '\uf8ff'),
      orderBy('email'),
      limit(maxResults)
    );
    
    const emailSnapshot = await getDocs(qEmail);
    const emailResults = emailSnapshot.docs.map(doc => convertFirestoreUser(doc));
    
    const combinedResults = [...nombreResults, ...apellidoResults, ...emailResults];
    const uniqueResults = combinedResults.filter((user, index, self) =>
      index === self.findIndex((u) => u.id === user.id)
    );
    
    return uniqueResults.slice(0, maxResults);
  } catch (error) {
    console.error('Error al buscar usuarios:', error);
    throw error;
  }
};

// Actualizar usuario
export const updateUser = async (id: string, data: Partial<User>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    
    const { id: _, createdAt: __, ...updateData } = data;
    
    if (updateData.photoURL) {
      try {
        new URL(updateData.photoURL);
      } catch (e) {
        console.error('URL de foto inválida', e);
        throw new Error('La URL de la foto no es válida');
      }
    }
    
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    
    if (data.email && auth.currentUser && auth.currentUser.uid === id) {
      await updateEmail(auth.currentUser, data.email);
    }
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    throw error;
  }
};

// Obtener estadísticas de operadores
export const getUsersOperatorStats = async (
  lubricentroId: string, 
  startDate: Date, 
  endDate: Date
): Promise<{ operatorId: string, operatorName: string, count: number }[]> => {
  try {
    const q = query(
      collection(db, 'cambiosAceite'),
      where('lubricentroId', '==', lubricentroId),
      where('fecha', '>=', startDate),
      where('fecha', '<=', endDate)
    );
    
    const querySnapshot = await getDocs(q);
    
    const operatorCounts: Record<string, { operatorId: string, operatorName: string, count: number }> = {};
    
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      const operatorId = data.operatorId;
      const operatorName = data.nombreOperario;
      
      if (!operatorCounts[operatorId]) {
        operatorCounts[operatorId] = {
          operatorId,
          operatorName,
          count: 0
        };
      }
      
      operatorCounts[operatorId].count++;
    });
    
    return Object.values(operatorCounts).sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error al obtener estadísticas de operadores:', error);
    throw error;
  }
};