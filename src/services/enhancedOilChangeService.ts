// src/services/enhancedOilChangeService.ts
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { OilChange, OilChangeStats, User } from '../types';
// ✅ INTEGRAR VALIDACIONES Y AUDITORÍA
import { validationMiddleware } from '../middleware/validationMiddleware';
import { auditLoggingService } from '../services/auditLoggingService';
import { getLubricentroById } from './lubricentroService';

const COLLECTION_NAME = 'cambiosAceite';

// Convertir datos de Firestore a nuestro tipo OilChange
const convertFirestoreOilChange = (doc: any): OilChange => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    fecha: data.fecha?.toDate ? data.fecha.toDate() : new Date(data.fecha) || new Date(),
    fechaServicio: data.fechaServicio?.toDate ? data.fechaServicio.toDate() : new Date(data.fechaServicio) || new Date(),
    fechaProximoCambio: data.fechaProximoCambio?.toDate ? data.fechaProximoCambio.toDate() : new Date(data.fechaProximoCambio) || new Date(),
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt) || new Date(),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt ? new Date(data.updatedAt) : undefined,
  } as OilChange;
};

// Función auxiliar para asegurar que una fecha sea un objeto Date
const ensureDateObject = (date: any): Date => {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  if (typeof date === 'string') return new Date(date);
  if (date.toDate && typeof date.toDate === 'function') {
    try {
      return date.toDate();
    } catch (e) {
      console.warn('Error al convertir Timestamp a Date:', e);
      return new Date();
    }
  }
  return new Date();
};

// ✅ VERSIÓN MEJORADA CON VALIDACIONES Y AUDITORÍA
export const createOilChangeWithValidation = async (
  data: Omit<OilChange, 'id' | 'createdAt'>,
  user: User
): Promise<string> => {
  try {
    console.log('🔄 Iniciando creación de cambio de aceite con validaciones...');
    
    // ✅ 1. VALIDACIÓN COMPLETA CON MIDDLEWARE
    const validation = await validationMiddleware.validateServiceCreation(data.lubricentroId, user);
    
    if (!validation.canProceed) {
      // Registrar fallo de validación
      await auditLoggingService.logValidationFailed(
        user,
        'create_service',
        validation.message,
        data.lubricentroId
      );
      
      throw new Error(validation.message);
    }
    
    console.log('✅ Validación exitosa');
    
    // ✅ 2. OBTENER INFORMACIÓN DEL LUBRICENTRO PARA AUDITORÍA
    const lubricentro = await getLubricentroById(data.lubricentroId);
    
    // ✅ 3. PREPARAR DATOS
    const dominioVehiculo = data.dominioVehiculo.toUpperCase();
    const fechaServicio = ensureDateObject(data.fechaServicio);
    
    // Generar fecha del próximo cambio basado en la periodicidad
    const fechaProximoCambio = new Date(fechaServicio);
    fechaProximoCambio.setMonth(fechaProximoCambio.getMonth() + data.perioricidad_servicio);
    
    // ✅ 4. CREAR EL DOCUMENTO
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      dominioVehiculo,
      fechaServicio,
      fechaProximoCambio,
      fecha: new Date(),
      createdAt: serverTimestamp()
    });
    
    console.log('✅ Cambio de aceite creado exitosamente:', docRef.id);
    
    // ✅ 5. REGISTRAR EN AUDITORÍA
    await auditLoggingService.logServiceCreated(
      user,
      data.lubricentroId,
      lubricentro.fantasyName,
      data.nroCambio
    );
    
    return docRef.id;
    
  } catch (error) {
    console.error('❌ Error al crear el cambio de aceite:', error);
    
    // Registrar error en auditoría
    if (error instanceof Error) {
      await auditLoggingService.logSystemError(
        error,
        'createOilChange',
        user,
        data.lubricentroId
      );
    }
    
    throw error;
  }
};

// ✅ ACTUALIZAR CAMBIO DE ACEITE CON AUDITORÍA
export const updateOilChangeWithValidation = async (
  id: string,
  data: Partial<OilChange>,
  user: User
): Promise<void> => {
  try {
    console.log('🔄 Iniciando actualización de cambio de aceite...');
    
    // Obtener el cambio de aceite actual
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('El cambio de aceite no existe');
    }
    
    const currentData = convertFirestoreOilChange(docSnap);
    
    // ✅ VALIDAR PERMISOS
    const validation = await validationMiddleware.validateAction({
      user,
      lubricentroId: currentData.lubricentroId,
      action: 'create_service', // Usamos la misma validación que para crear
      metadata: { action: 'update', changeId: id }
    });
    
    if (!validation.canProceed) {
      await auditLoggingService.logValidationFailed(
        user,
        'update_service',
        validation.message,
        currentData.lubricentroId
      );
      throw new Error(validation.message);
    }
    
    // Preparar datos de actualización
    const updateData: any = { ...data };
    
    if (data.dominioVehiculo) {
      updateData.dominioVehiculo = data.dominioVehiculo.toUpperCase();
    }
    
    if (data.fechaServicio) {
      updateData.fechaServicio = ensureDateObject(data.fechaServicio);
    }
    
    // Recalcular fecha del próximo cambio si es necesario
    if (data.fechaServicio || data.perioricidad_servicio) {
      let fechaServicioToUse;
      if (data.fechaServicio) {
        fechaServicioToUse = ensureDateObject(data.fechaServicio);
      } else {
        fechaServicioToUse = ensureDateObject(currentData.fechaServicio);
      }
      
      const perioricidad = data.perioricidad_servicio !== undefined ? data.perioricidad_servicio : currentData.perioricidad_servicio;
      
      const fechaProximoCambio = new Date(fechaServicioToUse);
      fechaProximoCambio.setMonth(fechaProximoCambio.getMonth() + perioricidad);
      
      updateData.fechaProximoCambio = fechaProximoCambio;
    }
    
    // Eliminar campos que no se deben actualizar
    const { id: _, createdAt: __, lubricentroId: ___, ...cleanData } = updateData;
    
    await updateDoc(docRef, {
      ...cleanData,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Cambio de aceite actualizado exitosamente');
    
    // ✅ REGISTRAR EN AUDITORÍA
    const lubricentro = await getLubricentroById(currentData.lubricentroId);
    await auditLoggingService.logEvent(
      'service_updated',
      'UPDATE_SERVICE',
      `Servicio ${currentData.nroCambio} actualizado`,
      {
        user,
        lubricentroId: currentData.lubricentroId,
        lubricentroName: lubricentro.fantasyName,
        severity: 'info',
        metadata: { 
          serviceNumber: currentData.nroCambio,
          updatedFields: Object.keys(cleanData)
        }
      }
    );
    
  } catch (error) {
    console.error('❌ Error al actualizar el cambio de aceite:', error);
    
    if (error instanceof Error) {
      await auditLoggingService.logSystemError(
        error,
        'updateOilChange',
        user
      );
    }
    
    throw error;
  }
};

// ✅ ELIMINAR CAMBIO DE ACEITE CON AUDITORÍA
export const deleteOilChangeWithValidation = async (
  id: string,
  user: User
): Promise<void> => {
  try {
    console.log('🔄 Iniciando eliminación de cambio de aceite...');
    
    // Obtener el cambio de aceite antes de eliminarlo
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('El cambio de aceite no existe');
    }
    
    const oilChangeData = convertFirestoreOilChange(docSnap);
    
    // ✅ VALIDAR PERMISOS (solo admin o superadmin pueden eliminar)
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      await auditLoggingService.logPermissionDenied(
        user,
        'delete_service',
        'admin'
      );
      throw new Error('Solo administradores pueden eliminar servicios');
    }
    
    // Validar que pertenezca al lubricentro del usuario (excepto superadmin)
    if (user.role !== 'superadmin' && user.lubricentroId !== oilChangeData.lubricentroId) {
      await auditLoggingService.logPermissionDenied(
        user,
        'delete_service_other_lubricentro'
      );
      throw new Error('No puedes eliminar servicios de otros lubricentros');
    }
    
    // Eliminar el documento
    await deleteDoc(docRef);
    
    console.log('✅ Cambio de aceite eliminado exitosamente');
    
    // ✅ REGISTRAR EN AUDITORÍA
    const lubricentro = await getLubricentroById(oilChangeData.lubricentroId);
    await auditLoggingService.logEvent(
      'service_deleted',
      'DELETE_SERVICE',
      `Servicio ${oilChangeData.nroCambio} eliminado`,
      {
        user,
        lubricentroId: oilChangeData.lubricentroId,
        lubricentroName: lubricentro.fantasyName,
        severity: 'warning',
        metadata: { 
          serviceNumber: oilChangeData.nroCambio,
          vehicleDomain: oilChangeData.dominioVehiculo,
          clientName: oilChangeData.nombreCliente
        }
      }
    );
    
  } catch (error) {
    console.error('❌ Error al eliminar el cambio de aceite:', error);
    
    if (error instanceof Error) {
      await auditLoggingService.logSystemError(
        error,
        'deleteOilChange',
        user
      );
    }
    
    throw error;
  }
};

// ✅ RE-EXPORTAR FUNCIONES EXISTENTES SIN CAMBIOS
export const getOilChangeById = async (id: string): Promise<OilChange> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return convertFirestoreOilChange(docSnap);
    } else {
      throw new Error('No se encontró el cambio de aceite');
    }
  } catch (error) {
    console.error('Error al obtener el cambio de aceite:', error);
    throw error;
  }
};

export const getOilChangeByNumber = async (lubricentroId: string, nroCambio: string): Promise<OilChange | null> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('lubricentroId', '==', lubricentroId),
      where('nroCambio', '==', nroCambio)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    return convertFirestoreOilChange(querySnapshot.docs[0]);
  } catch (error) {
    console.error('Error al obtener el cambio de aceite por número:', error);
    throw error;
  }
};

export const getOilChangesByLubricentro = async (
  lubricentroId: string,
  pageSize: number = 20,
  lastVisible?: QueryDocumentSnapshot<DocumentData>
): Promise<{
  oilChanges: OilChange[],
  lastVisible: QueryDocumentSnapshot<DocumentData> | null
}> => {
  try {
    let q;
    
    if (lastVisible) {
      q = query(
        collection(db, COLLECTION_NAME),
        where('lubricentroId', '==', lubricentroId),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(pageSize)
      );
    } else {
      q = query(
        collection(db, COLLECTION_NAME),
        where('lubricentroId', '==', lubricentroId),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    const oilChanges = querySnapshot.docs.map(doc => convertFirestoreOilChange(doc));
    
    const newLastVisible = querySnapshot.docs.length > 0 
      ? querySnapshot.docs[querySnapshot.docs.length - 1] 
      : null;
    
    return {
      oilChanges,
      lastVisible: newLastVisible
    };
  } catch (error) {
    console.error('Error al obtener los cambios de aceite:', error);
    throw error;
  }
};

export const searchOilChanges = async (
  lubricentroId: string,
  searchType: 'cliente' | 'dominio',
  searchTerm: string,
  pageSize: number = 20
): Promise<OilChange[]> => {
  try {
    const field = searchType === 'cliente' ? 'nombreCliente' : 'dominioVehiculo';
    const term = searchTerm.trim();
    
    if (!term) {
      return [];
    }
    
    const q = query(
      collection(db, COLLECTION_NAME),
      where('lubricentroId', '==', lubricentroId),
      orderBy(field),
      limit(pageSize * 5)
    );
    
    const querySnapshot = await getDocs(q);
    
    const oilChanges = querySnapshot.docs
      .map(doc => convertFirestoreOilChange(doc))
      .filter(oilChange => {
        const fieldValue = searchType === 'cliente' 
          ? oilChange.nombreCliente.toLowerCase() 
          : oilChange.dominioVehiculo.toLowerCase();
        
        return fieldValue.includes(term.toLowerCase());
      })
      .slice(0, pageSize);
    
    return oilChanges;
  } catch (error) {
    console.error('Error al buscar cambios de aceite:', error);
    throw error;
  }
};

export const getUpcomingOilChanges = async (
  lubricentroId: string,
  daysAhead: number = 30
): Promise<OilChange[]> => {
  try {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysAhead);
    
    const q = query(
      collection(db, COLLECTION_NAME),
      where('lubricentroId', '==', lubricentroId),
      where('fechaProximoCambio', '>=', startDate),
      where('fechaProximoCambio', '<=', endDate),
      orderBy('fechaProximoCambio', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => convertFirestoreOilChange(doc));
  } catch (error) {
    console.error('Error al obtener los próximos cambios de aceite:', error);
    throw error;
  }
};

export const getOilChangesByVehicle = async (dominioVehiculo: string): Promise<OilChange[]> => {
  try {
    const dominio = dominioVehiculo.toUpperCase();
    
    const q = query(
      collection(db, COLLECTION_NAME),
      where('dominioVehiculo', '==', dominio),
      orderBy('fecha', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => convertFirestoreOilChange(doc));
  } catch (error) {
    console.error('Error al obtener los cambios de aceite del vehículo:', error);
    throw error;
  }
};

export const getNextOilChangeNumber = async (lubricentroId: string, prefix: string): Promise<string> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('lubricentroId', '==', lubricentroId),
      where('nroCambio', '>=', prefix),
      where('nroCambio', '<=', prefix + '\uf8ff'),
      orderBy('nroCambio', 'desc'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return `${prefix}-00001`;
    }
    
    const lastOilChange = querySnapshot.docs[0].data() as unknown as OilChange;
    const lastNumber = lastOilChange.nroCambio;
    
    const numericPart = lastNumber.split('-')[1];
    const nextNumber = (parseInt(numericPart) + 1).toString().padStart(5, '0');
    
    return `${prefix}-${nextNumber}`;
  } catch (error) {
    console.error('Error al generar el próximo número de cambio:', error);
    throw error;
  }
};

export const getOilChangesStats = async (lubricentroId: string): Promise<OilChangeStats> => {
  try {
    const qTotal = query(
      collection(db, COLLECTION_NAME),
      where('lubricentroId', '==', lubricentroId)
    );
    const totalSnapshot = await getDocs(qTotal);
    const total = totalSnapshot.size;
    
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const qThisMonth = query(
      collection(db, COLLECTION_NAME),
      where('lubricentroId', '==', lubricentroId),
      where('fecha', '>=', firstDayThisMonth),
      where('fecha', '<=', lastDayThisMonth)
    );
    const thisMonthSnapshot = await getDocs(qThisMonth);
    const thisMonth = thisMonthSnapshot.size;
    
    const qLastMonth = query(
      collection(db, COLLECTION_NAME),
      where('lubricentroId', '==', lubricentroId),
      where('fecha', '>=', firstDayLastMonth),
      where('fecha', '<=', lastDayLastMonth)
    );
    const lastMonthSnapshot = await getDocs(qLastMonth);
    const lastMonth = lastMonthSnapshot.size;
    
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    
    const qUpcoming = query(
      collection(db, COLLECTION_NAME),
      where('lubricentroId', '==', lubricentroId),
      where('fechaProximoCambio', '>=', now),
      where('fechaProximoCambio', '<=', in30Days)
    );
    const upcomingSnapshot = await getDocs(qUpcoming);
    const upcoming30Days = upcomingSnapshot.size;
    
    return {
      total,
      thisMonth,
      lastMonth,
      upcoming30Days
    };
  } catch (error) {
    console.error('Error al obtener estadísticas de cambios de aceite:', error);
    throw error;
  }
};

export const getOilChangesByOperator = async (
  operatorId: string,
  lubricentroId: string,
  startDate: Date,
  endDate: Date
): Promise<OilChange[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('lubricentroId', '==', lubricentroId),
      where('operatorId', '==', operatorId),
      where('fecha', '>=', startDate),
      where('fecha', '<=', endDate),
      orderBy('fecha', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => convertFirestoreOilChange(doc));
  } catch (error) {
    console.error('Error al obtener cambios de aceite por operador:', error);
    throw error;
  }
};

// ✅ MANTENER COMPATIBILIDAD CON CÓDIGO EXISTENTE
// Exportar la función original con el nuevo nombre como alias
export const createOilChange = createOilChangeWithValidation;
export const updateOilChange = updateOilChangeWithValidation;
export const deleteOilChange = deleteOilChangeWithValidation;