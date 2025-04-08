// src/services/userService.ts
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc,
    updateDoc, 
    query, 
    where, 
    orderBy, 
    serverTimestamp,
    limit
  } from 'firebase/firestore';
  import { db, auth } from '../lib/firebase';
  import { User, UserStatus } from '../types';
  import { createUserWithEmailAndPassword, updateEmail, updatePassword } from 'firebase/auth';
  
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
  export const createUser = async (email: string, password: string, userData: Omit<User, 'id' | 'createdAt' | 'lastLogin'>): Promise<string> => {
    try {
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      // Crear documento en Firestore
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
  
  // Actualizar usuario
  export const updateUser = async (id: string, data: Partial<User>): Promise<void> => {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      
      // Nunca actualizar el ID o createdAt directamente
      const { id: _, createdAt: __, ...updateData } = data;
      
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      
      // Si se está actualizando el email, también actualizarlo en Firebase Auth
      // Esto requiere que el usuario esté actualmente autenticado
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
      // Esto requiere que el usuario esté actualmente autenticado
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
  
  // Buscar usuarios
  export const searchUsers = async (
    searchTerm: string,
    lubricentroId?: string,
    maxResults: number = 10
  ): Promise<User[]> => {
    try {
      let constraints = [];
      
      // Si se proporciona un lubricentroId, filtrar por ese lubricentro
      if (lubricentroId) {
        constraints.push(where('lubricentroId', '==', lubricentroId));
      }
      
      // Búsqueda por nombre (startsWith)
      const qNombre = query(
        collection(db, COLLECTION_NAME),
        ...constraints,
        where('nombre', '>=', searchTerm),
        where('nombre', '<=', searchTerm + '\uf8ff'), // Truco para simular "startsWith"
        orderBy('nombre'),
        limit(maxResults)
      );
      
      const nombreSnapshot = await getDocs(qNombre);
      const nombreResults = nombreSnapshot.docs.map(doc => convertFirestoreUser(doc));
      
      // Búsqueda por apellido (startsWith)
      const qApellido = query(
        collection(db, COLLECTION_NAME),
        ...constraints,
        where('apellido', '>=', searchTerm),
        where('apellido', '<=', searchTerm + '\uf8ff'), // Truco para simular "startsWith"
        orderBy('apellido'),
        limit(maxResults)
      );
      
      const apellidoSnapshot = await getDocs(qApellido);
      const apellidoResults = apellidoSnapshot.docs.map(doc => convertFirestoreUser(doc));
      
      // Combinar resultados y eliminar duplicados
      const combinedResults = [...nombreResults, ...apellidoResults];
      const uniqueResults = combinedResults.filter((user, index, self) =>
        index === self.findIndex((u) => u.id === user.id)
      );
      
      return uniqueResults.slice(0, maxResults);
    } catch (error) {
      console.error('Error al buscar usuarios:', error);
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
      // Obtener todos los cambios de aceite en el período especificado
      const q = query(
        collection(db, 'cambiosAceite'),
        where('lubricentroId', '==', lubricentroId),
        where('fecha', '>=', startDate),
        where('fecha', '<=', endDate)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Agrupar por operador y contar
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
      
      // Convertir a array y ordenar por cantidad (descendente)
      return Object.values(operatorCounts).sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('Error al obtener estadísticas de operadores:', error);
      throw error;
    }
  };