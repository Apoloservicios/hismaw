// src/services/subscriptionService.ts
import { Timestamp } from 'firebase/firestore';
import { 
  getLubricentroById, 
  updateLubricentroStatus, 
  updateLubricentro,
  getAllLubricentros 
} from './lubricentroService';
import { getUsersByLubricentro } from './userService';
import { 
  Lubricentro, 
  LubricentroStatus 
} from '../types/lubricentro';
import { 
  SubscriptionPlanType, 
  SUBSCRIPTION_PLANS 
} from '../types/subscription';

/**
 * Verifica y actualiza el estado de todas las suscripciones
 * Devuelve los lubricentros con suscripciones expiradas y con pagos próximos
 */
export const checkSubscriptionStatuses = async (): Promise<{
  expired: Lubricentro[];
  paymentDue: Lubricentro[];
}> => {
  try {
    // Obtener todos los lubricentros
    const lubricentros = await getAllLubricentros();
    const now = new Date();
    
    const expired: Lubricentro[] = [];
    const paymentDue: Lubricentro[] = [];
    
    // Procesar cada lubricentro
    await Promise.all(lubricentros.map(async (lub) => {
      // Manejar expiración del período de prueba
      if (lub.estado === 'trial' && lub.trialEndDate && lub.trialEndDate < now) {
        // Período de prueba expirado, marcar como inactivo
        await updateLubricentroStatus(lub.id, 'inactivo');
        expired.push(lub);
        return;
      }
      
      // Manejar suscripciones pagas
      if (lub.estado === 'activo' && lub.subscriptionEndDate) {
        // Verificar si la suscripción ha expirado
        if (lub.subscriptionEndDate < now) {
          // Si la renovación automática está activada, intentar extender
          if (lub.autoRenewal) {
            // En un sistema real, aquí se activaría el procesamiento de pago
            // Por ahora, solo marcar como pago pendiente
            await updateLubricentro(lub.id, {
              paymentStatus: 'pending',
              nextPaymentDate: now
            });
            paymentDue.push(lub);
          } else {
            // Sin renovación automática, marcar como inactivo
            await updateLubricentroStatus(lub.id, 'inactivo');
            expired.push(lub);
          }
        }
        // Verificar pagos próximos (7 días de anticipación)
        else if (lub.nextPaymentDate && 
                (lub.nextPaymentDate.getTime() - now.getTime()) < 7 * 24 * 60 * 60 * 1000) {
          paymentDue.push(lub);
        }
      }
      
      // Reiniciar contador de servicios mensuales si estamos en un nuevo mes
      const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
      const lastServiceMonth = Object.keys(lub.servicesUsedHistory || {}).sort().pop();
      
      if (lastServiceMonth && lastServiceMonth !== currentMonth) {
        await updateLubricentro(lub.id, {
          servicesUsedThisMonth: 0
        });
      }
    }));
    
    return { expired, paymentDue };
  } catch (error) {
    console.error('Error al verificar estados de suscripciones:', error);
    throw error;
  }
};

/**
 * Actualiza la suscripción de un lubricentro
 */
export const updateSubscription = async (
  lubricentroId: string,
  plan: SubscriptionPlanType,
  renewalType: 'monthly' | 'semiannual',
  autoRenewal: boolean = true,
  paymentMethod?: string,
  paymentReference?: string
): Promise<void> => {
  try {
    const lubricentro = await getLubricentroById(lubricentroId);
    const now = new Date();
    
    // Calcular fechas basadas en el tipo de renovación
    const cycleMonths = renewalType === 'monthly' ? 1 : 6;
    const billingCycleEnd = new Date(now);
    billingCycleEnd.setMonth(billingCycleEnd.getMonth() + cycleMonths);
    
    // Calcular fin del contrato (mínimo 6 meses desde ahora)
    let contractEnd = new Date(now);
    contractEnd.setMonth(contractEnd.getMonth() + 6);
    
    // Si el contrato existente es más largo, mantenerlo
    if (lubricentro.contractEndDate && lubricentro.contractEndDate > contractEnd) {
      contractEnd = lubricentro.contractEndDate;
    }
    
    // Registrar pago
    const payment = {
      date: now,
      amount: SUBSCRIPTION_PLANS[plan].price * (renewalType === 'monthly' ? 1 : 6),
      method: paymentMethod || 'N/A',
      reference: paymentReference || 'N/A'
    };
    
    const paymentHistory = lubricentro.paymentHistory || [];
    paymentHistory.push(payment);
    
    // Actualizar datos de suscripción
    await updateLubricentro(lubricentroId, {
      estado: 'activo',
      subscriptionPlan: plan,
      subscriptionStartDate: lubricentro.subscriptionStartDate || now,
      subscriptionEndDate: contractEnd, // Establecer al fin del contrato
      subscriptionRenewalType: renewalType,
      contractEndDate: contractEnd,
      billingCycleEndDate: billingCycleEnd,
      lastPaymentDate: now,
      nextPaymentDate: billingCycleEnd,
      paymentStatus: 'paid',
      autoRenewal,
      paymentHistory
    });
    
    // Actualizar recuento de usuarios activos
    await updateActiveUserCount(lubricentroId);
    
  } catch (error) {
    console.error('Error al actualizar suscripción:', error);
    throw error;
  }
};

/**
 * Registra un pago para un lubricentro
 */
export const recordPayment = async (
  lubricentroId: string,
  amount: number,
  method: string,
  reference: string
): Promise<void> => {
  try {
    const lubricentro = await getLubricentroById(lubricentroId);
    const now = new Date();
    
    // Calcular próxima fecha de facturación
    const nextPaymentDate = new Date(now);
    const cycleMonths = lubricentro.subscriptionRenewalType === 'monthly' ? 1 : 6;
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + cycleMonths);
    
    // Registrar pago
    const payment = {
      date: now,
      amount,
      method,
      reference
    };
    
    const paymentHistory = lubricentro.paymentHistory || [];
    paymentHistory.push(payment);
    
    // Actualizar lubricentro con la información de pago
    await updateLubricentro(lubricentroId, {
      lastPaymentDate: now,
      nextPaymentDate,
      paymentStatus: 'paid',
      paymentHistory,
      // Si está inactivo, reactivar
      estado: 'activo'
    });
    
  } catch (error) {
    console.error('Error al registrar pago:', error);
    throw error;
  }
};

/**
 * Verifica y actualiza el recuento de usuarios activos para un lubricentro
 */
export const updateActiveUserCount = async (lubricentroId: string): Promise<number> => {
  try {
    // Obtener usuarios del lubricentro
    const users = await getUsersByLubricentro(lubricentroId);
    
    // Contar usuarios activos
    const activeUserCount = users.filter(user => user.estado === 'activo').length;
    
    // Actualizar el recuento en el lubricentro
    await updateLubricentro(lubricentroId, { activeUserCount });
    
    return activeUserCount;
  } catch (error) {
    console.error('Error al actualizar recuento de usuarios activos:', error);
    throw error;
  }
};

/**
 * Incrementa el contador de servicios usados para un lubricentro
 * y verifica si se ha alcanzado el límite
 */
export const incrementServiceCount = async (lubricentroId: string): Promise<boolean> => {
  try {
    const lubricentro = await getLubricentroById(lubricentroId);
    
    // Verificar si el lubricentro está activo
    if (lubricentro.estado !== 'activo') {
      throw new Error('El lubricentro no tiene una suscripción activa');
    }
    
    // Verificar límites de servicio si el plan tiene un límite
    if (lubricentro.subscriptionPlan && 
        SUBSCRIPTION_PLANS[lubricentro.subscriptionPlan].maxMonthlyServices !== null) {
      
      const currentMonth = new Date().toISOString().slice(0, 7); // Formato YYYY-MM
      const servicesUsed = lubricentro.servicesUsedThisMonth || 0;
      const maxServices = SUBSCRIPTION_PLANS[lubricentro.subscriptionPlan].maxMonthlyServices;
      
      // Verificar si se ha alcanzado el límite
      // Verificar si hay un límite de servicios (maxServices podría ser null para el plan premium)
if (maxServices !== null && servicesUsed >= maxServices) {
    throw new Error(`Has alcanzado el límite de ${maxServices} servicios para este mes según tu plan ${SUBSCRIPTION_PLANS[lubricentro.subscriptionPlan].name}`);
  }
      
      // Actualizar contadores
      const servicesUsedHistory = lubricentro.servicesUsedHistory || {};
      servicesUsedHistory[currentMonth] = (servicesUsedHistory[currentMonth] || 0) + 1;
      
      await updateLubricentro(lubricentroId, {
        servicesUsedThisMonth: servicesUsed + 1,
        servicesUsedHistory
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error al incrementar contador de servicios:', error);
    throw error;
  }
};

/**
 * Verifica si un lubricentro puede agregar más usuarios
 * basado en su plan de suscripción actual
 */
export const canAddMoreUsers = async (lubricentroId: string): Promise<boolean> => {
  try {
    // Obtener datos del lubricentro y usuarios
    const [lubricentro, users] = await Promise.all([
      getLubricentroById(lubricentroId),
      getUsersByLubricentro(lubricentroId)
    ]);
    
    // Si no tiene plan, usar el límite más bajo
    if (!lubricentro.subscriptionPlan) {
      return users.filter(u => u.estado === 'activo').length < SUBSCRIPTION_PLANS.starter.maxUsers;
    }
    
    // Verificar contra el límite del plan
    const activeUsers = users.filter(u => u.estado === 'activo').length;
    const maxUsers = SUBSCRIPTION_PLANS[lubricentro.subscriptionPlan].maxUsers;
    
    return activeUsers < maxUsers;
  } catch (error) {
    console.error('Error al verificar límite de usuarios:', error);
    return false;
  }
};