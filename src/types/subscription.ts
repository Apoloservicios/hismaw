// src/types/subscription.ts
export type SubscriptionPlanType = 'starter' | 'basic' | 'premium' | 'enterprise';

export interface SubscriptionPlan {
  id: SubscriptionPlanType; // ✅ AGREGAR: ID del plan
  name: string;
  description: string;
  price: {
    monthly: number;
    semiannual: number;
  };
  maxUsers: number;
  maxMonthlyServices: number | null; // null = ilimitado
  features: string[];
  recommended?: boolean;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanType, SubscriptionPlan> = {
  starter: {
    id: 'starter', // ✅ AGREGAR: ID del plan
    name: 'Plan Iniciante',
    description: 'Ideal para lubricentros pequeños que están comenzando',
    price: {
      monthly: 1500,
      semiannual: 8500
    },
    maxUsers: 1,
    maxMonthlyServices: 25,
    features: [
      '1 usuario',
      '25 servicios por mes',
      'Gestión básica de cambios de aceite',
      'Reportes básicos',
      'Soporte por email'
    ]
  },
  basic: {
    id: 'basic', // ✅ AGREGAR: ID del plan
    name: 'Plan Básico',
    description: 'Perfecto para lubricentros medianos con operación estándar',
    price: {
      monthly: 2500,
      semiannual: 14000
    },
    maxUsers: 2,
    maxMonthlyServices: 50,
    features: [
      '2 usuarios',
      '50 servicios por mes',
      'Gestión completa de cambios de aceite',
      'Generación de PDF',
      'Envío por WhatsApp',
      'Reportes detallados',
      'Soporte prioritario'
    ]
  },
  premium: {
    id: 'premium', // ✅ AGREGAR: ID del plan
    name: 'Plan Premium',
    description: 'La mejor opción para lubricentros con alto volumen de servicios',
    price: {
      monthly: 4500,
      semiannual: 24000
    },
    maxUsers: 5,
    maxMonthlyServices: 150,
    features: [
      '5 usuarios',
      '150 servicios por mes',
      'Todas las funciones del Plan Básico',
      'Dashboard avanzado',
      'Historial de clientes',
      'Notificaciones automáticas',
      'Múltiples lubricentros',
      'Soporte telefónico'
    ],
    recommended: true
  },
  enterprise: {
    id: 'enterprise', // ✅ AGREGAR: ID del plan
    name: 'Plan Empresarial',
    description: 'Solución completa para cadenas de lubricentros y empresas grandes',
    price: {
      monthly: 7500,
      semiannual: 40000
    },
    maxUsers: 999, // Prácticamente ilimitado
    maxMonthlyServices: null, // Ilimitado
    features: [
      'Usuarios ilimitados',
      'Servicios ilimitados',
      'Todas las funciones Premium',
      'API personalizada',
      'Integración con sistemas existentes',
      'Reportes personalizados',
      'Soporte 24/7',
      'Capacitación del equipo',
      'Gestor de cuenta dedicado'
    ]
  }
};

export interface SubscriptionUsage {
  lubricentroId: string;
  month: string; // formato: "YYYY-MM"
  servicesUsed: number;
  usersActive: number;
  lastUpdated: Date;
}

export interface SubscriptionPayment {
  id: string;
  lubricentroId: string;
  amount: number;
  method: 'transferencia' | 'tarjeta' | 'efectivo' | 'mercadopago' | 'otro';
  reference: string;
  date: Date;
  status: 'completed' | 'pending' | 'failed';
  planType: SubscriptionPlanType;
  period: 'monthly' | 'semiannual';
  createdAt: Date;
}

export interface SubscriptionStats {
  totalRevenue: number;
  totalActiveSubscriptions: number;
  totalTrialSubscriptions: number;
  totalInactiveSubscriptions: number;
  conversionRate: number;
  averageRevenuePerUser: number;
  churnRate: number;
  monthlyGrowthRate: number;
  planDistribution: {
    [key in SubscriptionPlanType]: number;
  };
  revenueByPlan: {
    [key in SubscriptionPlanType]: number;
  };
}

// Funciones de utilidad
export const getSubscriptionPlanById = (planId: SubscriptionPlanType): SubscriptionPlan => {
  return SUBSCRIPTION_PLANS[planId];
};

export const getAllSubscriptionPlans = (): SubscriptionPlan[] => {
  return Object.values(SUBSCRIPTION_PLANS);
};

export const getSubscriptionPlansArray = (): (SubscriptionPlan & { id: SubscriptionPlanType })[] => {
  return Object.entries(SUBSCRIPTION_PLANS).map(([id, plan]) => ({
    ...plan,
    id: id as SubscriptionPlanType
  }));
};

export const calculateMonthlyRevenue = (planId: SubscriptionPlanType, quantity: number = 1): number => {
  return SUBSCRIPTION_PLANS[planId].price.monthly * quantity;
};

export const calculateSemiannualRevenue = (planId: SubscriptionPlanType, quantity: number = 1): number => {
  return SUBSCRIPTION_PLANS[planId].price.semiannual * quantity;
};

export const getSemiannualDiscount = (planId: SubscriptionPlanType): number => {
  const plan = SUBSCRIPTION_PLANS[planId];
  const monthlyTotal = plan.price.monthly * 6;
  const semiannualPrice = plan.price.semiannual;
  const discount = monthlyTotal - semiannualPrice;
  return Math.round((discount / monthlyTotal) * 100);
};

export const isValidSubscriptionPlan = (planId: string): planId is SubscriptionPlanType => {
  return Object.keys(SUBSCRIPTION_PLANS).includes(planId);
};

export const getPlanRecommendation = (monthlyServices: number, users: number): SubscriptionPlanType => {
  if (monthlyServices <= 25 && users <= 1) {
    return 'starter';
  } else if (monthlyServices <= 50 && users <= 2) {
    return 'basic';
  } else if (monthlyServices <= 150 && users <= 5) {
    return 'premium';
  } else {
    return 'enterprise';
  }
};

export default SUBSCRIPTION_PLANS;