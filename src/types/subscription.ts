// src/types/subscription.ts
export type SubscriptionPlanType = 'starter' | 'plus' | 'premium';

export interface SubscriptionPlan {
  id: SubscriptionPlanType;
  name: string;
  maxUsers: number;          // Máximo de usuarios permitidos
  maxMonthlyServices: number | null; // Máximo de servicios por mes (null para ilimitado)
  price: number;             // Precio mensual
  description: string;       // Descripción del plan
  features: string[];        // Lista de características incluidas
}

// Definiciones de los planes que coinciden con la página de precios
export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanType, SubscriptionPlan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    maxUsers: 2,
    maxMonthlyServices: 50,
    price: 7500,
    description: 'Pensado para el inicio, empezá a olvidarte de las tarjetas físicas, digitaliza tus datos.',
    features: [
      'Reportes y estadísticas',
      'Sistema de notificaciones',
      'Usuarios de sistemas (2 usuarios)',
      'Soporte - mail y Whatsapp',
      'Acceso a app',
      'Límite de servicios mensuales (50)'
    ]
  },
  plus: {
    id: 'plus',
    name: 'Plus',
    maxUsers: 4,
    maxMonthlyServices: 150,
    price: 12000,
    description: 'Aumenta la capacidad de tu negocio con más usuarios y servicios mensuales.',
    features: [
      'Reportes y estadísticas',
      'Sistema de notificaciones',
      'Usuarios de sistemas (4 usuarios)',
      'Soporte - mail y Whatsapp (prioritario)',
      'Acceso a app',
      'Límite de servicios mensuales (150)'
    ]
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    maxUsers: 6,
    maxMonthlyServices: null, // Ilimitado
    price: 16500,
    description: 'Acceso completo a todas las funcionalidades sin limitaciones de servicios.',
    features: [
      'Reportes y estadísticas',
      'Sistema de notificaciones',
      'Usuarios de sistemas (6 usuarios)',
      'Soporte - mail, Whatsapp, Telefónico - Prioritario',
      'Acceso a app',
      'Sin límite de servicios mensuales'
    ]
  }
};