// src/types/index.ts

// Tipos de usuario
export type UserRole = 'superadmin' | 'admin' | 'user';
export type UserStatus = 'activo' | 'inactivo' | 'pendiente';

export interface User {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  role: UserRole;
  estado: UserStatus;
  lubricentroId?: string;
  lastLogin: Date | null;
  createdAt: Date;
  photoURL?: string;
  updatedAt?: Date;
}

// Tipos de Lubricentro
export type LubricentroStatus = 'activo' | 'inactivo' | 'trial';

export interface Lubricentro {
  id: string;
  fantasyName: string;
  responsable: string;
  domicilio: string;
  cuit: string;
  phone: string;
  email: string;
  location: {
    lat?: number;
    lng?: number;
    address?: string;
  };
  logoUrl?: string;
  ownerId: string;
  estado: LubricentroStatus;
  subscriptionId?: string;
  ticketPrefix: string;
  createdAt: Date;
  trialEndDate?: Date;
  updatedAt?: Date;
}

// Tipo de suscripción
export type SubscriptionPlan = 'trial' | 'basic' | 'premium';
export type SubscriptionStatus = 'active' | 'expired' | 'canceled';

export interface Subscription {
  id: string;
  lubricentroId: string;
  plan: SubscriptionPlan;
  startDate: Date;
  endDate: Date;
  status: SubscriptionStatus;
  paymentMethod?: string;
  paymentReference?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Tipos para Cambio de Aceite
export interface OilChange {
  id: string;
  lubricentroId: string;
  fecha: Date;
  nroCambio: string; // formato: prefijo-numero (ej: AP-00001)
  nombreCliente: string;
  celular?: string;
  lubricentroNombre?: string;
  
  // Datos del vehículo
  dominioVehiculo: string; // Patente
  marcaVehiculo: string;
  modeloVehiculo: string;
  tipoVehiculo: string; // Ej: Automóvil, Camioneta, etc.
  añoVehiculo?: number;
  kmActuales: number;
  kmProximo: number; // Calculado: kmActuales + 10000 mínimo
  perioricidad_servicio: number; // En meses
  fechaProximoCambio: Date;
  
  // Datos del servicio
  fechaServicio: Date;
  marcaAceite: string;
  tipoAceite: string;
  sae: string; // Viscosidad del aceite
  cantidadAceite: number;
  
  // Filtros y extras (check y notas)
  filtroAceite: boolean;
  filtroAceiteNota?: string;
  filtroAire: boolean;
  filtroAireNota?: string;
  filtroHabitaculo: boolean;
  filtroHabitaculoNota?: string;
  filtroCombustible: boolean;
  filtroCombustibleNota?: string;
  aditivo: boolean;
  aditivoNota?: string;
  refrigerante: boolean;
  refrigeranteNota?: string;
  diferencial: boolean;
  diferencialNota?: string;
  caja: boolean;
  cajaNota?: string;
  engrase: boolean;
  engraseNota?: string;
  
  // Observaciones generales
  observaciones?: string;
  
  // Datos del operario
  nombreOperario: string;
  operatorId: string;
  
  // Metadata
  createdAt: Date;
  updatedAt?: Date;
}

// Estadísticas para dashboards
export interface OilChangeStats {
  total: number;
  thisMonth: number;
  lastMonth: number;
  upcoming30Days: number;
}

export interface OperatorStats {
  operatorId: string;
  operatorName: string;
  count: number;
}