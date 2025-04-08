// src/services/lubricentroService.ts
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    addDoc, 
    updateDoc, 
    query, 
    where, 
    orderBy, 
    serverTimestamp,
    Timestamp,
    QueryConstraint,
    limit
  } from 'firebase/firestore';
  import { db } from '../lib/firebase';
  import { Lubricentro, LubricentroStatus } from '../types';
  
  const COLLECTION_NAME = 'lubricentros';
  
  // Convertir datos de Firestore a nuestro tipo Lubricentro
  const convertFirestoreLubricentro = (doc: any): Lubricentro => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      trialEndDate: data.trialEndDate?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    } as Lubricentro;
  };
  
  // Obtener lubricentro por ID
  export const getLubricentroById = async (id: string): Promise<Lubricentro> => {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return convertFirestoreLubricentro(docSnap);
      } else {
        throw new Error('No se encontró el lubricentro');
      }
    } catch (error) {
      console.error('Error al obtener el lubricentro:', error);
      throw error;
    }
  };
  
  // Obtener todos los lubricentros
  export const getAllLubricentros = async (): Promise<Lubricentro[]> => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => convertFirestoreLubricentro(doc));
    } catch (error) {
      console.error('Error al obtener los lubricentros:', error);
      throw error;
    }
  };
  
  // Obtener lubricentros por propietario
  export const getLubricentrosByOwner = async (ownerId: string): Promise<Lubricentro[]> => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('ownerId', '==', ownerId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => convertFirestoreLubricentro(doc));
    } catch (error) {
      console.error('Error al obtener los lubricentros del propietario:', error);
      throw error;
    }
  };
  
  // Obtener lubricentros activos y en período de prueba válido
  export const getActiveLubricentros = async (): Promise<Lubricentro[]> => {
    try {
      // Obtener lubricentros activos
      const qActive = query(
        collection(db, COLLECTION_NAME),
        where('estado', '==', 'activo'),
        orderBy('fantasyName', 'asc')
      );
      
      const activeSnapshot = await getDocs(qActive);
      const activeLubricentros = activeSnapshot.docs.map(doc => convertFirestoreLubricentro(doc));
      
      // Obtener lubricentros en período de prueba que aún no ha expirado
      const now = new Date();
      const qTrial = query(
        collection(db, COLLECTION_NAME),
        where('estado', '==', 'trial'),
        where('trialEndDate', '>=', now),
        orderBy('trialEndDate', 'asc')
      );
      
      const trialSnapshot = await getDocs(qTrial);
      const trialLubricentros = trialSnapshot.docs.map(doc => convertFirestoreLubricentro(doc));
      
      // Combinar y retornar
      return [...activeLubricentros, ...trialLubricentros];
    } catch (error) {
      console.error('Error al obtener los lubricentros activos:', error);
      throw error;
    }
  };
  
  // Crear lubricentro
  export const createLubricentro = async (data: Omit<Lubricentro, 'id' | 'createdAt'>): Promise<string> => {
    try {
      // Calcular fecha de fin del período de prueba (7 días)
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7);
      
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...data,
        estado: 'trial', // Por defecto, comienza en período de prueba
        createdAt: serverTimestamp(),
        trialEndDate: trialEndDate
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error al crear el lubricentro:', error);
      throw error;
    }
  };
  
  // Actualizar lubricentro
  export const updateLubricentro = async (id: string, data: Partial<Lubricentro>): Promise<void> => {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      
      // Nunca actualizar el ID, createdAt u ownerId directamente
      const { id: _, createdAt: __, ownerId: ___, ...updateData } = data;
      
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error al actualizar el lubricentro:', error);
      throw error;
    }
  };
  
  // Actualizar estado del lubricentro
  export const updateLubricentroStatus = async (id: string, estado: LubricentroStatus): Promise<void> => {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      
      const updateData: any = {
        estado,
        updatedAt: serverTimestamp()
      };
      
      // Si se cambia a "trial", establecer una nueva fecha de fin de prueba
      if (estado === 'trial') {
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 7);
        updateData.trialEndDate = trialEndDate;
      }
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error al actualizar el estado del lubricentro:', error);
      throw error;
    }
  };
  
  // Verificar y actualizar lubricentros con período de prueba vencido
  export const checkForExpiredTrials = async (): Promise<Lubricentro[]> => {
    try {
      const now = new Date();
      
      const q = query(
        collection(db, COLLECTION_NAME),
        where('estado', '==', 'trial'),
        where('trialEndDate', '<', now)
      );
      
      const querySnapshot = await getDocs(q);
      const expiredLubricentros = querySnapshot.docs.map(doc => convertFirestoreLubricentro(doc));
      
      // Actualizar el estado de los lubricentros expirados
      await Promise.all(
        expiredLubricentros.map(async (lubricentro) => {
          await updateDoc(doc(db, COLLECTION_NAME, lubricentro.id), {
            estado: 'inactivo',
            updatedAt: serverTimestamp()
          });
        })
      );
      
      return expiredLubricentros;
    } catch (error) {
      console.error('Error al verificar lubricentros con periodo de prueba expirado:', error);
      throw error;
    }
  };
  
  // Buscar lubricentros
  export const searchLubricentros = async (
    term: string, 
    field: 'fantasyName' | 'responsable' | 'cuit' | 'email' = 'fantasyName',
    maxResults: number = 10
  ): Promise<Lubricentro[]> => {
    try {
      // Firestore no soporta búsquedas de texto completo, así que hacemos búsqueda exacta
      const q = query(
        collection(db, COLLECTION_NAME),
        where(field, '>=', term),
        where(field, '<=', term + '\uf8ff'), // Truco para simular "startsWith"
        orderBy(field),
        limit(maxResults)
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => convertFirestoreLubricentro(doc));
    } catch (error) {
      console.error('Error al buscar lubricentros:', error);
      throw error;
    }
  };