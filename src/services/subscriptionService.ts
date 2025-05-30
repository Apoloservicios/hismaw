// src/services/subscriptionService.ts
import { serverTimestamp } from 'firebase/firestore';
import {
  getLubricentroById,
  updateLubricentro,
  getAllLubricentros
} from './lubricentroService';
import { SUBSCRIPTION_PLANS, SubscriptionPlanType } from '../types/subscription';
import { TRIAL_LIMITS } from '../config/constants';

// Función para incrementar el contador de servicios mensuales - ACTUALIZADA
export const incrementServiceCount = async (lubricentroId: string): Promise<boolean> => {
  try {
    const lubricentro = await getLubricentroById(lubricentroId);
    
    // Si está en período de prueba, manejar límites específicos
    if (lubricentro.estado === 'trial') {
      const trialLimit = TRIAL_LIMITS.SERVICES; // ✅ Usar constante coherente (10)
      const currentServices = lubricentro.servicesUsedThisMonth || 0;
      
      
      
      if (currentServices >= trialLimit) {
        
        return false; // Ha alcanzado el límite
      }
      
      // Incrementar contador
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      await updateLubricentro(lubricentroId, {
        servicesUsedThisMonth: currentServices + 1,
        servicesUsedHistory: {
          ...(lubricentro.servicesUsedHistory || {}),
          [currentMonth]: ((lubricentro.servicesUsedHistory || {})[currentMonth] || 0) + 1
        }
      });
      

      return true;
    }
    
    // Si es un lubricentro activo con suscripción
    if (lubricentro.estado === 'activo' && lubricentro.subscriptionPlan) {
      const plan = SUBSCRIPTION_PLANS[lubricentro.subscriptionPlan];
      
      if (plan.maxMonthlyServices === null) {
        // Plan ilimitado
        const currentMonth = new Date().toISOString().slice(0, 7);
        const currentServices = lubricentro.servicesUsedThisMonth || 0;
        
        await updateLubricentro(lubricentroId, {
          servicesUsedThisMonth: currentServices + 1,
          servicesUsedHistory: {
            ...(lubricentro.servicesUsedHistory || {}),
            [currentMonth]: ((lubricentro.servicesUsedHistory || {})[currentMonth] || 0) + 1
          }
        });
        
      
        return true;
      } else {
        // Plan con límite
        const currentServices = lubricentro.servicesUsedThisMonth || 0;
        
        if (currentServices >= plan.maxMonthlyServices) {
  
          return false; // Ha alcanzado el límite
        }
        
        const currentMonth = new Date().toISOString().slice(0, 7);
        await updateLubricentro(lubricentroId, {
          servicesUsedThisMonth: currentServices + 1,
          servicesUsedHistory: {
            ...(lubricentro.servicesUsedHistory || {}),
            [currentMonth]: ((lubricentro.servicesUsedHistory || {})[currentMonth] || 0) + 1
          }
        });
        
    
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error al incrementar contador de servicios:', error);
    return false;
  }
};

// Función para activar suscripción
export const activateSubscription = async (
  lubricentroId: string,
  subscriptionPlan: SubscriptionPlanType,
  renewalType: 'monthly' | 'semiannual' = 'monthly'
): Promise<void> => {
  try {
    const now = new Date();
    const subscriptionEndDate = new Date(now);
    
    // Calcular fecha de fin según el tipo de renovación
    if (renewalType === 'monthly') {
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
    } else {
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 6);
    }
    
    const nextPaymentDate = new Date(subscriptionEndDate);
    
    await updateLubricentro(lubricentroId, {
      estado: 'activo',
      subscriptionPlan,
      subscriptionStartDate: now,
      subscriptionEndDate,
      subscriptionRenewalType: renewalType,
      nextPaymentDate,
      paymentStatus: 'paid',
      autoRenewal: true,
      // Reiniciar contador de servicios al activar
      servicesUsedThisMonth: 0
    });
    

  } catch (error) {
    console.error('Error al activar suscripción:', error);
    throw error;
  }
};

// Función para actualizar suscripción (corregida - solo 4 parámetros máximo)
export const updateSubscription = async (
  lubricentroId: string,
  subscriptionPlan: SubscriptionPlanType,
  renewalType: 'monthly' | 'semiannual' = 'monthly',
  autoRenewal: boolean = true
): Promise<void> => {
  try {
    const now = new Date();
    const subscriptionEndDate = new Date(now);
    
    // Calcular fecha de fin según el tipo de renovación
    if (renewalType === 'monthly') {
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
    } else {
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 6);
    }
    
    const nextPaymentDate = new Date(subscriptionEndDate);
    
    await updateLubricentro(lubricentroId, {
      subscriptionPlan,
      subscriptionRenewalType: renewalType,
      subscriptionEndDate,
      nextPaymentDate,
      autoRenewal,
      paymentStatus: 'paid'
    });
    

  } catch (error) {
    console.error('Error al actualizar suscripción:', error);
    throw error;
  }
};

// Función para registrar pago (nueva función)
export const recordPayment = async (
  lubricentroId: string,
  amount: number,
  method: string,
  reference: string
): Promise<void> => {
  try {
    const lubricentro = await getLubricentroById(lubricentroId);
    const now = new Date();
    
    // Crear registro de pago
    const paymentRecord = {
      date: now,
      amount,
      method,
      reference
    };
    
    // Calcular próxima fecha de pago
    const nextPaymentDate = new Date(now);
    if (lubricentro.subscriptionRenewalType === 'monthly') {
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    } else {
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 6);
    }
    
    // Actualizar lubricentro
    await updateLubricentro(lubricentroId, {
      lastPaymentDate: now,
      nextPaymentDate,
      paymentStatus: 'paid',
      paymentHistory: [
        ...(lubricentro.paymentHistory || []),
        paymentRecord
      ]
    });
    
  } catch (error) {
    console.error('Error al registrar pago:', error);
    throw error;
  }
};

// Función para verificar si se pueden agregar más usuarios - ACTUALIZADA
export const canAddMoreUsers = async (lubricentroId: string, currentUserCount: number): Promise<boolean> => {
  try {
    const lubricentro = await getLubricentroById(lubricentroId);
    
    // Si está en período de prueba
    if (lubricentro.estado === 'trial') {
      return currentUserCount < TRIAL_LIMITS.USERS; // ✅ Usar constante coherente (2)
    }
    
    // Si tiene suscripción activa
    if (lubricentro.estado === 'activo' && lubricentro.subscriptionPlan) {
      const plan = SUBSCRIPTION_PLANS[lubricentro.subscriptionPlan];
      return currentUserCount < plan.maxUsers;
    }
    
    return false;
  } catch (error) {
    console.error('Error al verificar límite de usuarios:', error);
    return false;
  }
};

// Función para cancelar suscripción
export const cancelSubscription = async (lubricentroId: string): Promise<void> => {
  try {
    await updateLubricentro(lubricentroId, {
      estado: 'inactivo',
      autoRenewal: false,
      paymentStatus: 'pending'
    });
    

  } catch (error) {
    console.error('Error al cancelar suscripción:', error);
    throw error;
  }
};

// Función para verificar suscripciones expiradas
export const checkExpiredSubscriptions = async (): Promise<void> => {
  try {
    const allLubricentros = await getAllLubricentros();
    const now = new Date();
    
    for (const lubricentro of allLubricentros) {
      if (lubricentro.estado === 'activo' && lubricentro.subscriptionEndDate) {
        const endDate = new Date(lubricentro.subscriptionEndDate);
        
        if (endDate < now) {
          // Suscripción expirada
          await updateLubricentro(lubricentro.id, {
            estado: 'inactivo',
            paymentStatus: 'overdue'
          });
          
         
        }
      }
    }
  } catch (error) {
    console.error('Error al verificar suscripciones expiradas:', error);
    throw error;
  }
};

// Función para obtener estadísticas de suscripciones
export const getSubscriptionStats = async () => {
  try {
    const allLubricentros = await getAllLubricentros();
    
    const stats = {
      total: allLubricentros.length,
      active: allLubricentros.filter(lub => lub.estado === 'activo').length,
      trial: allLubricentros.filter(lub => lub.estado === 'trial').length,
      inactive: allLubricentros.filter(lub => lub.estado === 'inactivo').length,
      byPlan: {} as Record<string, number>
    };
    
    // Contar por plan de suscripción
    allLubricentros.forEach(lub => {
      if (lub.subscriptionPlan) {
        stats.byPlan[lub.subscriptionPlan] = (stats.byPlan[lub.subscriptionPlan] || 0) + 1;
      }
    });
    
    return stats;
  } catch (error) {
    console.error('Error al obtener estadísticas de suscripciones:', error);
    throw error;
  }
};

// Función para reiniciar contadores mensuales (ejecutar al inicio de cada mes)
export const resetMonthlyCounters = async (): Promise<void> => {
  try {
    const allLubricentros = await getAllLubricentros();
    
    for (const lubricentro of allLubricentros) {
      if (lubricentro.estado === 'activo' || lubricentro.estado === 'trial') {
        await updateLubricentro(lubricentro.id, {
          servicesUsedThisMonth: 0
        });
      }
    }
    
 
  } catch (error) {
    console.error('Error al reiniciar contadores mensuales:', error);
    throw error;
  }
};

// Nueva función para obtener información de límites de manera coherente
export const getSubscriptionLimits = async (lubricentroId: string) => {
  try {
    const lubricentro = await getLubricentroById(lubricentroId);
    
    if (lubricentro.estado === 'trial') {
      return {
        maxUsers: TRIAL_LIMITS.USERS,
        maxServices: TRIAL_LIMITS.SERVICES,
        currentUsers: lubricentro.activeUserCount || 0,
        currentServices: lubricentro.servicesUsedThisMonth || 0,
        daysRemaining: Math.max(0, Math.ceil(
          (new Date(lubricentro.trialEndDate || new Date()).getTime() - new Date().getTime()) 
          / (1000 * 60 * 60 * 24)
        )),
        planName: 'Período de Prueba',
        isUnlimited: false
      };
    }
    
    if (lubricentro.estado === 'activo' && lubricentro.subscriptionPlan) {
      const plan = SUBSCRIPTION_PLANS[lubricentro.subscriptionPlan];
      return {
        maxUsers: plan.maxUsers,
        maxServices: plan.maxMonthlyServices,
        currentUsers: lubricentro.activeUserCount || 0,
        currentServices: lubricentro.servicesUsedThisMonth || 0,
        daysRemaining: null,
        planName: plan.name,
        isUnlimited: plan.maxMonthlyServices === null
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error al obtener límites de suscripción:', error);
    return null;
  }
};