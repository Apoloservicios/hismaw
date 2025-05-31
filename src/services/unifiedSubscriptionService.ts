// src/services/unifiedSubscriptionService.ts
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc,
  query,
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Lubricentro, LubricentroStatus } from '../types';
import { SUBSCRIPTION_PLANS, SubscriptionPlanType } from '../types/subscription';

// ✅ CONSTANTES UNIFICADAS - UNA SOLA FUENTE DE VERDAD
export const UNIFIED_LIMITS = {
  TRIAL: {
    DAYS: 7,
    SERVICES: 10,
    USERS: 2
  }
} as const;

// ✅ TIPOS UNIFICADOS
export interface SubscriptionLimits {
  maxUsers: number;
  maxServices: number | null; // null = ilimitado
  currentUsers: number;
  currentServices: number;
  daysRemaining?: number;
  planName: string;
  isUnlimited: boolean;
  canAddServices: boolean;
  canAddUsers: boolean;
}

export interface SubscriptionValidation {
  isValid: boolean;
  canCreateService: boolean;
  canCreateUser: boolean;
  message?: string;
  warningMessage?: string;
  remainingServices?: number;
  remainingUsers?: number;
}

// ✅ CLASE PRINCIPAL DEL SERVICIO UNIFICADO
class UnifiedSubscriptionService {
  
  /**
   * Obtiene los límites actuales de un lubricentro de manera unificada
   */
  async getSubscriptionLimits(lubricentroId: string): Promise<SubscriptionLimits> {
    try {
      const lubricentro = await this.getLubricentroById(lubricentroId);
      
      if (lubricentro.estado === 'trial') {
        return this.getTrialLimits(lubricentro);
      }
      
      if (lubricentro.estado === 'activo' && lubricentro.subscriptionPlan) {
        return this.getActivePlanLimits(lubricentro);
      }
      
      // Lubricentro inactivo
      return this.getInactiveLimits();
      
    } catch (error) {
      console.error('Error al obtener límites de suscripción:', error);
      throw error;
    }
  }

  /**
   * Valida si se puede crear un nuevo servicio
   */
  async validateServiceCreation(lubricentroId: string): Promise<SubscriptionValidation> {
    try {
      const limits = await this.getSubscriptionLimits(lubricentroId);
      
      if (!limits.canAddServices) {
        return {
          isValid: false,
          canCreateService: false,
          canCreateUser: limits.canAddUsers,
          message: this.getServiceLimitMessage(limits),
          remainingServices: 0
        };
      }
      
      return {
        isValid: true,
        canCreateService: true,
        canCreateUser: limits.canAddUsers,
        remainingServices: limits.maxServices ? 
          Math.max(0, limits.maxServices - limits.currentServices) : undefined,
        remainingUsers: Math.max(0, limits.maxUsers - limits.currentUsers)
      };
      
    } catch (error) {
      console.error('Error al validar creación de servicio:', error);
      return {
        isValid: false,
        canCreateService: false,
        canCreateUser: false,
        message: 'Error al verificar los límites de tu suscripción'
      };
    }
  }

  /**
   * Valida si se puede crear un nuevo usuario
   */
  async validateUserCreation(lubricentroId: string): Promise<SubscriptionValidation> {
    try {
      const limits = await this.getSubscriptionLimits(lubricentroId);
      
      if (!limits.canAddUsers) {
        return {
          isValid: false,
          canCreateService: limits.canAddServices,
          canCreateUser: false,
          message: this.getUserLimitMessage(limits),
          remainingUsers: 0
        };
      }
      
      return {
        isValid: true,
        canCreateService: limits.canAddServices,
        canCreateUser: true,
        remainingServices: limits.maxServices ? 
          Math.max(0, limits.maxServices - limits.currentServices) : undefined,
        remainingUsers: Math.max(0, limits.maxUsers - limits.currentUsers)
      };
      
    } catch (error) {
      console.error('Error al validar creación de usuario:', error);
      return {
        isValid: false,
        canCreateService: false,
        canCreateUser: false,
        message: 'Error al verificar los límites de tu suscripción'
      };
    }
  }

  /**
   * Incrementa el contador de servicios de manera unificada
   */
  async incrementServiceCounter(lubricentroId: string): Promise<boolean> {
    try {
      const validation = await this.validateServiceCreation(lubricentroId);
      
      if (!validation.canCreateService) {
        console.warn('No se puede crear servicio:', validation.message);
        return false;
      }
      
      const lubricentro = await this.getLubricentroById(lubricentroId);
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const currentServices = lubricentro.servicesUsedThisMonth || 0;
      
      await updateDoc(doc(db, 'lubricentros', lubricentroId), {
        servicesUsedThisMonth: currentServices + 1,
        servicesUsedHistory: {
          ...(lubricentro.servicesUsedHistory || {}),
          [currentMonth]: ((lubricentro.servicesUsedHistory || {})[currentMonth] || 0) + 1
        },
        updatedAt: serverTimestamp()
      });
      
      console.log(`✅ Contador de servicios incrementado para ${lubricentroId}: ${currentServices + 1}`);
      return true;
      
    } catch (error) {
      console.error('Error al incrementar contador de servicios:', error);
      return false;
    }
  }

  /**
   * Activa una suscripción de manera unificada
   */
  async activateSubscription(
    lubricentroId: string, 
    subscriptionPlan: SubscriptionPlanType,
    renewalType: 'monthly' | 'semiannual' = 'monthly'
  ): Promise<void> {
    try {
      const now = new Date();
      const subscriptionEndDate = new Date(now);
      
      if (renewalType === 'monthly') {
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
      } else {
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 6);
      }
      
      await updateDoc(doc(db, 'lubricentros', lubricentroId), {
        estado: 'activo' as LubricentroStatus,
        subscriptionPlan,
        subscriptionStartDate: now,
        subscriptionEndDate,
        subscriptionRenewalType: renewalType,
        nextPaymentDate: subscriptionEndDate,
        paymentStatus: 'paid',
        autoRenewal: true,
        servicesUsedThisMonth: 0, // Reiniciar contador
        updatedAt: serverTimestamp()
      });
      
      console.log(`✅ Suscripción activada para ${lubricentroId}: ${subscriptionPlan}`);
      
    } catch (error) {
      console.error('Error al activar suscripción:', error);
      throw error;
    }
  }

  /**
   * Desactiva una suscripción
   */
  async deactivateSubscription(lubricentroId: string, reason?: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'lubricentros', lubricentroId), {
        estado: 'inactivo' as LubricentroStatus,
        autoRenewal: false,
        paymentStatus: 'overdue',
        updatedAt: serverTimestamp()
      });
      
      console.log(`⚠️ Suscripción desactivada para ${lubricentroId}:`, reason);
      
    } catch (error) {
      console.error('Error al desactivar suscripción:', error);
      throw error;
    }
  }

  /**
   * Extiende el período de prueba
   */
  async extendTrialPeriod(lubricentroId: string, additionalDays: number): Promise<void> {
    try {
      const lubricentro = await this.getLubricentroById(lubricentroId);
      
      const currentTrialEnd = lubricentro.trialEndDate || new Date();
      const newTrialEnd = new Date(currentTrialEnd);
      newTrialEnd.setDate(newTrialEnd.getDate() + additionalDays);
      
      await updateDoc(doc(db, 'lubricentros', lubricentroId), {
        estado: 'trial' as LubricentroStatus,
        trialEndDate: newTrialEnd,
        servicesUsedThisMonth: 0, // Reiniciar contador
        updatedAt: serverTimestamp()
      });
      
      console.log(`✅ Período de prueba extendido para ${lubricentroId}: +${additionalDays} días`);
      
    } catch (error) {
      console.error('Error al extender período de prueba:', error);
      throw error;
    }
  }

  // ============ MÉTODOS PRIVADOS ============

  private async getLubricentroById(id: string): Promise<Lubricentro> {
    const docRef = doc(db, 'lubricentros', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('No se encontró el lubricentro');
    }
    
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      trialEndDate: data.trialEndDate?.toDate(),
      subscriptionStartDate: data.subscriptionStartDate?.toDate(),
      subscriptionEndDate: data.subscriptionEndDate?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as Lubricentro;
  }

  private getTrialLimits(lubricentro: Lubricentro): SubscriptionLimits {
    const daysRemaining = this.calculateDaysRemaining(lubricentro.trialEndDate);
    const currentServices = lubricentro.servicesUsedThisMonth || 0;
    const currentUsers = lubricentro.activeUserCount || 1;
    
    return {
      maxUsers: UNIFIED_LIMITS.TRIAL.USERS,
      maxServices: UNIFIED_LIMITS.TRIAL.SERVICES,
      currentUsers,
      currentServices,
      daysRemaining,
      planName: 'Período de Prueba',
      isUnlimited: false,
      canAddServices: currentServices < UNIFIED_LIMITS.TRIAL.SERVICES && daysRemaining > 0,
      canAddUsers: currentUsers < UNIFIED_LIMITS.TRIAL.USERS
    };
  }

  private getActivePlanLimits(lubricentro: Lubricentro): SubscriptionLimits {
    const plan = SUBSCRIPTION_PLANS[lubricentro.subscriptionPlan!];
    const currentServices = lubricentro.servicesUsedThisMonth || 0;
    const currentUsers = lubricentro.activeUserCount || 1;
    
    return {
      maxUsers: plan.maxUsers,
      maxServices: plan.maxMonthlyServices,
      currentUsers,
      currentServices,
      planName: plan.name,
      isUnlimited: plan.maxMonthlyServices === null,
      canAddServices: plan.maxMonthlyServices === null || currentServices < plan.maxMonthlyServices,
      canAddUsers: currentUsers < plan.maxUsers
    };
  }

  private getInactiveLimits(): SubscriptionLimits {
    return {
      maxUsers: 0,
      maxServices: 0,
      currentUsers: 0,
      currentServices: 0,
      planName: 'Inactivo',
      isUnlimited: false,
      canAddServices: false,
      canAddUsers: false
    };
  }

  private calculateDaysRemaining(endDate?: Date): number {
    if (!endDate) return 0;
    
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  private getServiceLimitMessage(limits: SubscriptionLimits): string {
    if (limits.planName === 'Período de Prueba') {
      if (limits.daysRemaining === 0) {
        return 'Tu período de prueba ha expirado. Contacta al soporte para activar tu suscripción.';
      }
      return `Has alcanzado el límite de ${UNIFIED_LIMITS.TRIAL.SERVICES} servicios durante el período de prueba. Contacta al soporte para activar tu suscripción.`;
    }
    
    if (limits.planName === 'Inactivo') {
      return 'Tu suscripción está inactiva. Contacta al administrador para reactivar tu cuenta.';
    }
    
    return `Has alcanzado el límite mensual de ${limits.maxServices} servicios según tu plan ${limits.planName}. Actualiza tu plan para continuar.`;
  }

  private getUserLimitMessage(limits: SubscriptionLimits): string {
    if (limits.planName === 'Período de Prueba') {
      return `Has alcanzado el límite de ${UNIFIED_LIMITS.TRIAL.USERS} usuarios durante el período de prueba.`;
    }
    
    if (limits.planName === 'Inactivo') {
      return 'Tu suscripción está inactiva. Contacta al administrador para reactivar tu cuenta.';
    }
    
    return `Has alcanzado el límite de ${limits.maxUsers} usuarios según tu plan ${limits.planName}.`;
  }
}

// ✅ EXPORTAR INSTANCIA SINGLETON
export const unifiedSubscriptionService = new UnifiedSubscriptionService();

// ✅ FUNCIONES DE CONVENIENCIA PARA COMPATIBILIDAD
export const validateServiceCreation = (lubricentroId: string) => 
  unifiedSubscriptionService.validateServiceCreation(lubricentroId);

export const validateUserCreation = (lubricentroId: string) => 
  unifiedSubscriptionService.validateUserCreation(lubricentroId);

export const incrementServiceCounter = (lubricentroId: string) => 
  unifiedSubscriptionService.incrementServiceCounter(lubricentroId);

export const getSubscriptionLimits = (lubricentroId: string) => 
  unifiedSubscriptionService.getSubscriptionLimits(lubricentroId);

export const activateSubscription = (
  lubricentroId: string, 
  subscriptionPlan: SubscriptionPlanType,
  renewalType: 'monthly' | 'semiannual' = 'monthly'
) => unifiedSubscriptionService.activateSubscription(lubricentroId, subscriptionPlan, renewalType);

export const deactivateSubscription = (lubricentroId: string, reason?: string) => 
  unifiedSubscriptionService.deactivateSubscription(lubricentroId, reason);

export const extendTrialPeriod = (lubricentroId: string, additionalDays: number) => 
  unifiedSubscriptionService.extendTrialPeriod(lubricentroId, additionalDays);

export default unifiedSubscriptionService;