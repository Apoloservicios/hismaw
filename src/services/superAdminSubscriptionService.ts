// src/services/superAdminSubscriptionService.ts
import { 
  collection, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  Lubricentro, 
  SubscriptionPlanType, 
  SubscriptionAction,
  SuperAdminSubscriptionOverview 
} from '../types';
import { auditLoggingService } from './auditLoggingService';

// Tipos específicos para SuperAdmin
export interface SubscriptionUpdate {
  lubricentroId: string;
  subscriptionPlan: SubscriptionPlanType | 'custom';
  renewalType: 'manual' | 'automatic';
  notes?: string;
}

export interface BatchActionResult {
  successful: string[];
  failed: Array<{
    lubricentroId: string;
    error: string;
  }>;
}

export interface LubricentroWithAttention extends Lubricentro {
  attentionType: 'trial_ending' | 'subscription_expired' | 'payment_overdue';
  daysRemaining?: number;
}

const SUBSCRIPTION_PLANS = {
  basic: {
    name: 'Básico',
    monthlyPrice: 9900,
    yearlyPrice: 99000,
    servicesLimit: 100,
    features: ['Gestión básica', 'Reportes simples']
  },
  premium: {
    name: 'Premium', 
    monthlyPrice: 19900,
    yearlyPrice: 199000,
    servicesLimit: 500,
    features: ['Gestión avanzada', 'Reportes detallados', 'API']
  },
  enterprise: {
    name: 'Enterprise',
    monthlyPrice: 39900,
    yearlyPrice: 399000,
    servicesLimit: -1,
    features: ['Sin límites', 'Soporte prioritario', 'Personalización']
  }
};

export class SuperAdminSubscriptionService {
  private readonly COLLECTION_NAME = 'lubricentros';
  private readonly SUBSCRIPTIONS_COLLECTION = 'subscriptions';

  /**
   * Obtiene resumen completo de suscripciones para SuperAdmin
   */
  async getSubscriptionOverview(): Promise<SuperAdminSubscriptionOverview[]> {
    try {
      const lubricentrosRef = collection(db, this.COLLECTION_NAME);
      const snapshot = await getDocs(lubricentrosRef);
      
      const overviews: SuperAdminSubscriptionOverview[] = [];
      
      for (const docSnap of snapshot.docs) {
        const lubricentro = { id: docSnap.id, ...docSnap.data() } as Lubricentro;
        
        const overview: SuperAdminSubscriptionOverview = {
          lubricentroId: lubricentro.id!,
          fantasyName: lubricentro.fantasyName,
          responsable: lubricentro.responsable,
          subscriptionStatus: lubricentro.subscriptionStatus || 'trial',
          subscriptionPlan: lubricentro.subscriptionPlan || 'basic',
          currentPeriodEnd: lubricentro.currentPeriodEnd || new Date(),
          servicesCount: lubricentro.servicesCount || 0,
          servicesLimit: this.getServicesLimit(lubricentro.subscriptionPlan || 'basic'),
          isTrialActive: this.isTrialActive(lubricentro),
          daysUntilExpiration: this.getDaysUntilExpiration(lubricentro),
          revenue: this.calculateRevenue(lubricentro),
          lastPaymentDate: lubricentro.lastPaymentDate,
          autoRenewal: lubricentro.autoRenewal || false
        };
        
        overviews.push(overview);
      }
      
      return overviews.sort((a, b) => 
        new Date(b.currentPeriodEnd).getTime() - new Date(a.currentPeriodEnd).getTime()
      );
    } catch (error) {
      console.error('Error getting subscription overview:', error);
      throw new Error('Error al obtener resumen de suscripciones');
    }
  }

  /**
   * Activa suscripción para un lubricentro específico
   */
  async activateSubscriptionForLubricentro(
    lubricentroId: string,
    subscriptionPlan: SubscriptionPlanType | 'custom' = 'basic',
    renewalType: 'manual' | 'automatic' = 'manual',
    notes?: string
  ): Promise<void> {
    try {
      if (!lubricentroId) {
        throw new Error('lubricentroId es requerido');
      }

      const lubricentroRef = doc(db, this.COLLECTION_NAME, lubricentroId);
      const lubricentroDoc = await getDoc(lubricentroRef);
      
      if (!lubricentroDoc.exists()) {
        throw new Error(`Lubricentro con ID ${lubricentroId} no encontrado`);
      }

      const plan = subscriptionPlan !== 'custom' ? SUBSCRIPTION_PLANS[subscriptionPlan] : null;
      const currentDate = new Date();
      const endDate = new Date(currentDate);
      endDate.setMonth(endDate.getMonth() + 1); // 1 mes por defecto

      const updateData = {
        subscriptionStatus: 'active' as const,
        subscriptionPlan,
        currentPeriodStart: Timestamp.fromDate(currentDate),
        currentPeriodEnd: Timestamp.fromDate(endDate),
        autoRenewal: renewalType === 'automatic',
        servicesLimit: plan?.servicesLimit || -1,
        lastPaymentDate: Timestamp.fromDate(currentDate),
        updatedAt: Timestamp.fromDate(currentDate)
      };

      await updateDoc(lubricentroRef, updateData);

      // Log de auditoría
      await auditLoggingService.logSubscriptionAction({
        lubricentroId,
        action: 'activation',
        details: {
          subscriptionPlan,
          renewalType,
          notes
        },
        adminId: 'superadmin', // En producción, obtener del contexto de auth
        timestamp: currentDate
      });

    } catch (error) {
      console.error('Error activating subscription:', error);
      throw error;
    }
  }

  /**
   * Desactiva suscripción para un lubricentro
   */
  async deactivateSubscriptionForLubricentro(
    lubricentroId: string,
    reason?: string
  ): Promise<void> {
    try {
      if (!lubricentroId) {
        throw new Error('lubricentroId es requerido');
      }

      const lubricentroRef = doc(db, this.COLLECTION_NAME, lubricentroId);
      const lubricentroDoc = await getDoc(lubricentroRef);
      
      if (!lubricentroDoc.exists()) {
        throw new Error(`Lubricentro con ID ${lubricentroId} no encontrado`);
      }

      const updateData = {
        subscriptionStatus: 'inactive' as const,
        currentPeriodEnd: Timestamp.fromDate(new Date()),
        autoRenewal: false,
        updatedAt: Timestamp.fromDate(new Date())
      };

      await updateDoc(lubricentroRef, updateData);

      // Log de auditoría
      await auditLoggingService.logSubscriptionAction({
        lubricentroId,
        action: 'deactivation',
        details: { reason },
        adminId: 'superadmin',
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error deactivating subscription:', error);
      throw error;
    }
  }

  /**
   * Extiende período de prueba para un lubricentro
   */
  async extendTrialForLubricentro(
    lubricentroId: string,
    additionalDays: number,
    reason?: string
  ): Promise<void> {
    try {
      if (!lubricentroId) {
        throw new Error('lubricentroId es requerido');
      }

      const lubricentroRef = doc(db, this.COLLECTION_NAME, lubricentroId);
      const lubricentroDoc = await getDoc(lubricentroRef);
      
      if (!lubricentroDoc.exists()) {
        throw new Error(`Lubricentro con ID ${lubricentroId} no encontrado`);
      }

      const currentTrialEnd = lubricentroDoc.data()?.trialEndDate?.toDate() || new Date();
      const newTrialEnd = new Date(currentTrialEnd);
      newTrialEnd.setDate(newTrialEnd.getDate() + additionalDays);

      const updateData = {
        trialEndDate: Timestamp.fromDate(newTrialEnd),
        updatedAt: Timestamp.fromDate(new Date())
      };

      await updateDoc(lubricentroRef, updateData);

      // Log de auditoría
      await auditLoggingService.logSubscriptionAction({
        lubricentroId,
        action: 'trial_extension',
        details: {
          additionalDays,
          newTrialEnd: newTrialEnd.toISOString(),
          reason
        },
        adminId: 'superadmin',
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error extending trial:', error);
      throw error;
    }
  }

  /**
   * Cambia plan de suscripción para un lubricentro
   */
  async changePlanForLubricentro(
    lubricentroId: string,
    newPlan: SubscriptionPlanType,
    renewalType: 'manual' | 'automatic' = 'manual'
  ): Promise<void> {
    try {
      if (!lubricentroId) {
        throw new Error('lubricentroId es requerido');
      }

      const lubricentroRef = doc(db, this.COLLECTION_NAME, lubricentroId);
      const plan = SUBSCRIPTION_PLANS[newPlan];
      
      if (!plan) {
        throw new Error(`Plan ${newPlan} no válido`);
      }

      const currentDate = new Date();
      let endDate: Date;

      if (renewalType === 'automatic') {
        endDate = new Date(currentDate);
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        // Para renovación manual, mantener la fecha actual de fin
        const lubricentroDoc = await getDoc(lubricentroRef);
        endDate = lubricentroDoc.data()?.currentPeriodEnd?.toDate() || new Date();
      }

      const updateData = {
        subscriptionPlan: newPlan,
        servicesLimit: plan.servicesLimit,
        autoRenewal: renewalType === 'automatic',
        updatedAt: Timestamp.fromDate(currentDate)
      };

      await updateDoc(lubricentroRef, updateData);

      // Log de auditoría
      await auditLoggingService.logSubscriptionAction({
        lubricentroId,
        action: 'plan_change',
        details: {
          newPlan,
          renewalType
        },
        adminId: 'superadmin',
        timestamp: currentDate
      });

    } catch (error) {
      console.error('Error changing plan:', error);
      throw error;
    }
  }

  /**
   * Resetea contador de servicios para un lubricentro
   */
  async resetServicesCounterForLubricentro(
    lubricentroId: string,
    reason?: string
  ): Promise<void> {
    try {
      if (!lubricentroId) {
        throw new Error('lubricentroId es requerido');
      }

      const lubricentroRef = doc(db, this.COLLECTION_NAME, lubricentroId);
      
      const updateData = {
        servicesCount: 0,
        updatedAt: Timestamp.fromDate(new Date())
      };

      await updateDoc(lubricentroRef, updateData);

      // Log de auditoría
      await auditLoggingService.logSubscriptionAction({
        lubricentroId,
        action: 'services_reset',
        details: { reason },
        adminId: 'superadmin',
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error resetting services counter:', error);
      throw error;
    }
  }

  /**
   * Ejecuta acciones en lote para múltiples lubricentros
   */
  async executeBatchActions(actions: SubscriptionAction[]): Promise<BatchActionResult> {
    const successful: string[] = [];
    const failed: Array<{ lubricentroId: string; error: string }> = [];

    for (const action of actions) {
      try {
        switch (action.type) {
          case 'activate':
            await this.activateSubscriptionForLubricentro(
              action.lubricentroId,
              action.subscriptionPlan,
              action.renewalType
            );
            break;
          
          case 'deactivate':
            await this.deactivateSubscriptionForLubricentro(
              action.lubricentroId,
              action.reason
            );
            break;
          
          case 'extend_trial':
            await this.extendTrialForLubricentro(
              action.lubricentroId,
              action.additionalDays || 7,
              action.reason
            );
            break;
          
          case 'reset_services':
            await this.resetServicesCounterForLubricentro(
              action.lubricentroId,
              action.reason
            );
            break;
        }
        
        successful.push(action.lubricentroId);
      } catch (error) {
        failed.push({
          lubricentroId: action.lubricentroId,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }

    return { successful, failed };
  }

  /**
   * Obtiene lubricentros que necesitan atención
   */
  async getLubricentrosNeedingAttention(): Promise<LubricentroWithAttention[]> {
    try {
      const lubricentrosRef = collection(db, this.COLLECTION_NAME);
      const snapshot = await getDocs(lubricentrosRef);
      
      const needingAttention: LubricentroWithAttention[] = [];
      
      for (const docSnap of snapshot.docs) {
        const lubricentro = { id: docSnap.id, ...docSnap.data() } as Lubricentro;
        const attention = this.checkAttentionNeeded(lubricentro);
        
        if (attention) {
          needingAttention.push({
            ...lubricentro,
            attentionType: attention.type,
            daysRemaining: attention.daysRemaining
          });
        }
      }
      
      return needingAttention;
    } catch (error) {
      console.error('Error getting lubricentros needing attention:', error);
      throw error;
    }
  }

  /**
   * Obtiene lubricentro por ID (para SuperAdmin)
   */
  async getLubricentroById(id: string): Promise<Lubricentro | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Lubricentro;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting lubricentro by ID:', error);
      throw error;
    }
  }

  // Métodos auxiliares privados
  private getServicesLimit(plan: SubscriptionPlanType): number {
    return SUBSCRIPTION_PLANS[plan]?.servicesLimit || 100;
  }

  private isTrialActive(lubricentro: Lubricentro): boolean {
    if (lubricentro.subscriptionStatus !== 'trial') return false;
    const trialEnd = lubricentro.trialEndDate?.toDate() || new Date();
    return trialEnd > new Date();
  }

  private getDaysUntilExpiration(lubricentro: Lubricentro): number {
    const endDate = lubricentro.currentPeriodEnd?.toDate() || 
                   lubricentro.trialEndDate?.toDate() || 
                   new Date();
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private calculateRevenue(lubricentro: Lubricentro): number {
    if (lubricentro.subscriptionStatus !== 'active') return 0;
    const plan = SUBSCRIPTION_PLANS[lubricentro.subscriptionPlan as SubscriptionPlanType];
    return plan?.monthlyPrice || 0;
  }

  private checkAttentionNeeded(lubricentro: Lubricentro): {
    type: 'trial_ending' | 'subscription_expired' | 'payment_overdue';
    daysRemaining: number;
  } | null {
    const now = new Date();
    
    // Verificar trial próximo a vencer
    if (lubricentro.subscriptionStatus === 'trial') {
      const trialEnd = lubricentro.trialEndDate?.toDate() || new Date();
      const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysRemaining <= 3 && daysRemaining >= 0) {
        return { type: 'trial_ending', daysRemaining };
      }
    }
    
    // Verificar suscripción vencida
    if (lubricentro.subscriptionStatus === 'active') {
      const periodEnd = lubricentro.currentPeriodEnd?.toDate() || new Date();
      const daysRemaining = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysRemaining < 0) {
        return { type: 'subscription_expired', daysRemaining: Math.abs(daysRemaining) };
      }
    }
    
    return null;
  }
}

// Instancia singleton para uso en toda la aplicación
export const superAdminSubscriptionService = new SuperAdminSubscriptionService();