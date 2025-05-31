// src/services/superAdminSubscriptionService.ts
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Lubricentro, LubricentroStatus } from '../types';
import { SUBSCRIPTION_PLANS, SubscriptionPlanType } from '../types/subscription';
import unifiedSubscriptionService from './unifiedSubscriptionService';

// ✅ TIPOS ESPECÍFICOS PARA SUPERADMIN
export interface SuperAdminSubscriptionOverview {
  lubricentroId: string;
  fantasyName: string;
  responsable: string;
  email: string;
  estado: LubricentroStatus;
  subscriptionPlan?: SubscriptionPlanType;
  subscriptionEndDate?: Date;
  trialEndDate?: Date;
  servicesUsedThisMonth: number;
  activeUserCount: number;
  monthlyRevenue: number;
  daysRemaining?: number;
  isExpiring: boolean;
  needsAttention: boolean;
  createdAt: Date;
}

export interface SubscriptionAction {
  type: 'activate' | 'deactivate' | 'extend_trial' | 'change_plan' | 'reset_services';
  lubricentroId: string;
  parameters?: {
    subscriptionPlan?: SubscriptionPlanType;
    renewalType?: 'monthly' | 'semiannual';
    additionalDays?: number;
    reason?: string;
  };
}

export interface GlobalSubscriptionStats {
  totalLubricentros: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  expiredSubscriptions: number;
  totalMonthlyRevenue: number;
  averageRevenuePerUser: number;
  conversionRate: number;
  expiringTrialsCount: number;
  planDistribution: Record<SubscriptionPlanType, number>;
  revenueByPlan: Record<SubscriptionPlanType, number>;
}

// ✅ CLASE PRINCIPAL PARA GESTIÓN DE SUPERADMIN
class SuperAdminSubscriptionService {

  /**
   * Obtiene vista general de todas las suscripciones
   */
  async getAllSubscriptionsOverview(): Promise<SuperAdminSubscriptionOverview[]> {
    try {
      const q = query(
        collection(db, 'lubricentros'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const today = new Date();
      
      const overviews: SuperAdminSubscriptionOverview[] = [];
      
      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        const lubricentro: Lubricentro = {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          trialEndDate: data.trialEndDate?.toDate(),
          subscriptionEndDate: data.subscriptionEndDate?.toDate(),
        } as Lubricentro;
        
        // Calcular días restantes
        let daysRemaining: number | undefined;
        if (lubricentro.estado === 'trial' && lubricentro.trialEndDate) {
          const diffTime = lubricentro.trialEndDate.getTime() - today.getTime();
          daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        } else if (lubricentro.estado === 'activo' && lubricentro.subscriptionEndDate) {
          const diffTime = lubricentro.subscriptionEndDate.getTime() - today.getTime();
          daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        }
        
        // Calcular ingresos mensuales
        let monthlyRevenue = 0;
        if (lubricentro.subscriptionPlan && SUBSCRIPTION_PLANS[lubricentro.subscriptionPlan]) {
          monthlyRevenue = SUBSCRIPTION_PLANS[lubricentro.subscriptionPlan].price.monthly;
        }
        
        // Determinar si necesita atención
        const isExpiring = (daysRemaining !== undefined && daysRemaining <= 7);
        const needsAttention = isExpiring || 
          lubricentro.estado === 'inactivo' || 
          (lubricentro.estado === 'trial' && (daysRemaining === undefined || daysRemaining === 0));
        
        const overview: SuperAdminSubscriptionOverview = {
          lubricentroId: lubricentro.id,
          fantasyName: lubricentro.fantasyName,
          responsable: lubricentro.responsable,
          email: lubricentro.email,
          estado: lubricentro.estado,
          subscriptionPlan: lubricentro.subscriptionPlan,
          subscriptionEndDate: lubricentro.subscriptionEndDate,
          trialEndDate: lubricentro.trialEndDate,
          servicesUsedThisMonth: lubricentro.servicesUsedThisMonth || 0,
          activeUserCount: lubricentro.activeUserCount || 1,
          monthlyRevenue,
          daysRemaining,
          isExpiring,
          needsAttention,
          createdAt: lubricentro.createdAt
        };
        
        overviews.push(overview);
      }
      
      return overviews;
      
    } catch (error) {
      console.error('Error al obtener vista general de suscripciones:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas globales del sistema
   */
  async getGlobalStats(): Promise<GlobalSubscriptionStats> {
    try {
      const overviews = await this.getAllSubscriptionsOverview();
      
      const activeSubscriptions = overviews.filter(o => o.estado === 'activo').length;
      const trialSubscriptions = overviews.filter(o => o.estado === 'trial').length;
      const expiredSubscriptions = overviews.filter(o => o.estado === 'inactivo').length;
      
      const totalMonthlyRevenue = overviews
        .filter(o => o.estado === 'activo')
        .reduce((total, o) => total + o.monthlyRevenue, 0);
      
      const averageRevenuePerUser = activeSubscriptions > 0 
        ? totalMonthlyRevenue / activeSubscriptions 
        : 0;
      
      const conversionRate = (trialSubscriptions + activeSubscriptions) > 0 
        ? (activeSubscriptions / (trialSubscriptions + activeSubscriptions)) * 100 
        : 0;
      
      const expiringTrialsCount = overviews.filter(o => o.isExpiring).length;
      
      // Distribución por planes
      const planDistribution: Record<SubscriptionPlanType, number> = 
        Object.keys(SUBSCRIPTION_PLANS).reduce((acc, plan) => {
          acc[plan as SubscriptionPlanType] = 0;
          return acc;
        }, {} as Record<SubscriptionPlanType, number>);
      
      const revenueByPlan: Record<SubscriptionPlanType, number> = 
        Object.keys(SUBSCRIPTION_PLANS).reduce((acc, plan) => {
          acc[plan as SubscriptionPlanType] = 0;
          return acc;
        }, {} as Record<SubscriptionPlanType, number>);
      
      overviews.forEach(overview => {
        if (overview.subscriptionPlan && overview.estado === 'activo') {
          planDistribution[overview.subscriptionPlan]++;
          revenueByPlan[overview.subscriptionPlan] += overview.monthlyRevenue;
        }
      });
      
      return {
        totalLubricentros: overviews.length,
        activeSubscriptions,
        trialSubscriptions,
        expiredSubscriptions,
        totalMonthlyRevenue,
        averageRevenuePerUser,
        conversionRate,
        expiringTrialsCount,
        planDistribution,
        revenueByPlan
      };
      
    } catch (error) {
      console.error('Error al obtener estadísticas globales:', error);
      throw error;
    }
  }

  /**
   * Activa una suscripción desde el panel de superadmin
   */
  async activateSubscriptionForLubricentro(
    lubricentroId: string,
    subscriptionPlan: SubscriptionPlanType,
    renewalType: 'monthly' | 'semiannual' = 'monthly',
    notes?: string
  ): Promise<void> => {
    try {
      console.log(`🔄 SuperAdmin activando suscripción para ${lubricentroId}...`);
      
      // Usar el servicio unificado
      await unifiedSubscriptionService.activateSubscription(
        lubricentroId, 
        subscriptionPlan, 
        renewalType
      );
      
      // Registrar la acción (en una implementación completa, esto iría a una tabla de auditoría)
      console.log(`✅ Suscripción activada por SuperAdmin:`, {
        lubricentroId,
        subscriptionPlan,
        renewalType,
        notes,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Error al activar suscripción desde SuperAdmin:', error);
      throw error;
    }
  }

  /**
   * Desactiva una suscripción desde el panel de superadmin
   */
  async deactivateSubscriptionForLubricentro(
    lubricentroId: string,
    reason?: string
  ): Promise<void> => {
    try {
      console.log(`⚠️ SuperAdmin desactivando suscripción para ${lubricentroId}...`);
      
      // Usar el servicio unificado
      await unifiedSubscriptionService.deactivateSubscription(lubricentroId, reason);
      
      // Registrar la acción
      console.log(`❌ Suscripción desactivada por SuperAdmin:`, {
        lubricentroId,
        reason,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Error al desactivar suscripción desde SuperAdmin:', error);
      throw error;
    }
  }

  /**
   * Extiende el período de prueba desde el panel de superadmin
   */
  async extendTrialForLubricentro(
    lubricentroId: string,
    additionalDays: number,
    reason?: string
  ): Promise<void> => {
    try {
      console.log(`⏱️ SuperAdmin extendiendo prueba para ${lubricentroId}: +${additionalDays} días`);
      
      // Usar el servicio unificado
      await unifiedSubscriptionService.extendTrialPeriod(lubricentroId, additionalDays);
      
      // Registrar la acción
      console.log(`⏰ Período de prueba extendido por SuperAdmin:`, {
        lubricentroId,
        additionalDays,
        reason,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Error al extender período de prueba desde SuperAdmin:', error);
      throw error;
    }
  }

  /**
   * Cambia el plan de suscripción
   */
  async changePlanForLubricentro(
    lubricentroId: string,
    newPlan: SubscriptionPlanType,
    renewalType: 'monthly' | 'semiannual' = 'monthly'
  ): Promise<void> => {
    try {
      console.log(`🔄 SuperAdmin cambiando plan para ${lubricentroId} a ${newPlan}...`);
      
      const lubricentro = await this.getLubricentroById(lubricentroId);
      
      if (lubricentro.estado !== 'activo') {
        throw new Error('Solo se puede cambiar el plan de lubricentros activos');
      }
      
      // Actualizar el plan manteniendo las fechas existentes si es un upgrade/downgrade
      const now = new Date();
      const subscriptionEndDate = new Date(now);
      
      if (renewalType === 'monthly') {
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
      } else {
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 6);
      }
      
      await updateDoc(doc(db, 'lubricentros', lubricentroId), {
        subscriptionPlan: newPlan,
        subscriptionRenewalType: renewalType,
        subscriptionEndDate,
        nextPaymentDate: subscriptionEndDate,
        updatedAt: serverTimestamp()
      });
      
      console.log(`✅ Plan cambiado exitosamente por SuperAdmin`);
      
    } catch (error) {
      console.error('Error al cambiar plan desde SuperAdmin:', error);
      throw error;
    }
  }

  /**
   * Reinicia el contador de servicios mensuales
   */
  async resetServicesCounterForLubricentro(
    lubricentroId: string,
    reason?: string
  ): Promise<void> => {
    try {
      console.log(`🔄 SuperAdmin reiniciando contador de servicios para ${lubricentroId}...`);
      
      await updateDoc(doc(db, 'lubricentros', lubricentroId), {
        servicesUsedThisMonth: 0,
        updatedAt: serverTimestamp()
      });
      
      console.log(`✅ Contador de servicios reiniciado por SuperAdmin:`, {
        lubricentroId,
        reason,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Error al reiniciar contador de servicios:', error);
      throw error;
    }
  }

  /**
   * Ejecuta múltiples acciones en lote
   */
  async executeBatchActions(actions: SubscriptionAction[]): Promise<{
    successful: string[];
    failed: { lubricentroId: string; error: string }[];
  }> {
    const successful: string[] = [];
    const failed: { lubricentroId: string; error: string }[] = [];
    
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'activate':
            if (!action.parameters?.subscriptionPlan) {
              throw new Error('Plan de suscripción requerido para activación');
            }
            await this.activateSubscriptionForLubricentro(
              action.lubricentroId,
              action.parameters.subscriptionPlan,
              action.parameters.renewalType
            );
            break;
            
          case 'deactivate':
            await this.deactivateSubscriptionForLubricentro(
              action.lubricentroId,
              action.parameters?.reason
            );
            break;
            
          case 'extend_trial':
            if (!action.parameters?.additionalDays) {
              throw new Error('Días adicionales requeridos para extensión');
            }
            await this.extendTrialForLubricentro(
              action.lubricentroId,
              action.parameters.additionalDays,
              action.parameters.reason
            );
            break;
            
          case 'change_plan':
            if (!action.parameters?.subscriptionPlan) {
              throw new Error('Nuevo plan requerido para cambio');
            }
            await this.changePlanForLubricentro(
              action.lubricentroId,
              action.parameters.subscriptionPlan,
              action.parameters.renewalType
            );
            break;
            
          case 'reset_services':
            await this.resetServicesCounterForLubricentro(
              action.lubricentroId,
              action.parameters?.reason
            );
            break;
            
          default:
            throw new Error(`Tipo de acción no reconocido: ${action.type}`);
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
  async getLubricentrosNeedingAttention(): Promise<SuperAdminSubscriptionOverview[]> {
    try {
      const allOverviews = await this.getAllSubscriptionsOverview();
      return allOverviews.filter(overview => overview.needsAttention);
    } catch (error) {
      console.error('Error al obtener lubricentros que necesitan atención:', error);
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
}

// ✅ EXPORTAR INSTANCIA SINGLETON
export const superAdminSubscriptionService = new SuperAdminSubscriptionService();

// ✅ FUNCIONES DE CONVENIENCIA
export const getAllSubscriptionsOverview = () => 
  superAdminSubscriptionService.getAllSubscriptionsOverview();

export const getGlobalSubscriptionStats = () => 
  superAdminSubscriptionService.getGlobalStats();

export const activateSubscriptionForLubricentro = (
  lubricentroId: string,
  subscriptionPlan: SubscriptionPlanType,
  renewalType: 'monthly' | 'semiannual' = 'monthly',
  notes?: string
) => superAdminSubscriptionService.activateSubscriptionForLubricentro(
  lubricentroId, subscriptionPlan, renewalType, notes
);

export const deactivateSubscriptionForLubricentro = (lubricentroId: string, reason?: string) => 
  superAdminSubscriptionService.deactivateSubscriptionForLubricentro(lubricentroId, reason);

export const extendTrialForLubricentro = (lubricentroId: string, additionalDays: number, reason?: string) => 
  superAdminSubscriptionService.extendTrialForLubricentro(lubricentroId, additionalDays, reason);

export const getLubricentrosNeedingAttention = () => 
  superAdminSubscriptionService.getLubricentrosNeedingAttention();

export default superAdminSubscriptionService;