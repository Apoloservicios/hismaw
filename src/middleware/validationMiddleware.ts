// src/middleware/validationMiddleware.ts
import { 
  collection, 
  doc, 
  getDoc, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../lib/firebase'; // Usar la ruta correcta
import { 
  User, 
  Lubricentro, 
  OilChange, 
  SubscriptionPlanType 
} from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  details?: {
    currentServices?: number;
    servicesLimit?: number;
    subscriptionStatus?: string;
  };
}

export interface ServiceValidationData {
  lubricentroId: string;
  serviceType?: string;
  clientName?: string;
  vehicleDomain?: string;
}

export interface UserValidationData {
  email: string;
  lubricentroId?: string;
  role?: string;
  name?: string;
}

export interface SubscriptionValidationData {
  lubricentroId: string;
  newPlan?: SubscriptionPlanType;
  currentPlan?: SubscriptionPlanType;
  servicesCount?: number;
}

export class ValidationMiddleware {
  private readonly MAX_SERVICES_DEFAULT = 100;
  private readonly TRIAL_DURATION_DAYS = 7;

  /**
   * Valida creación de servicio de cambio de aceite
   */
  async validateServiceCreation(data: ServiceValidationData): Promise<ValidationResult> {
    const errors: string[] = [];

    try {
      // Validaciones básicas
      if (!data.lubricentroId) {
        errors.push('ID de lubricentro es requerido');
      }

      if (!data.clientName || data.clientName.trim().length < 2) {
        errors.push('Nombre del cliente debe tener al menos 2 caracteres');
      }

      if (!data.vehicleDomain || !this.isValidDomain(data.vehicleDomain)) {
        errors.push('Dominio de vehículo debe tener formato válido (ej: ABC123)');
      }

      // Validar límites de suscripción si hay lubricentroId
      if (data.lubricentroId && errors.length === 0) {
        const subscriptionValidation = await this.validateSubscriptionLimits(data.lubricentroId);
        
        if (!subscriptionValidation.isValid) {
          errors.push(...subscriptionValidation.errors);
          return {
            isValid: false,
            errors,
            details: subscriptionValidation.details
          };
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        details: {
          currentServices: 0, // Se actualizará con datos reales
          servicesLimit: this.MAX_SERVICES_DEFAULT
        }
      };

    } catch (error) {
      console.error('Error in service validation:', error);
      return {
        isValid: false,
        errors: ['Error de validación interno'],
        details: {}
      };
    }
  }

  /**
   * Valida creación de usuario
   */
  async validateUserCreation(data: UserValidationData): Promise<ValidationResult> {
    const errors: string[] = [];

    try {
      // Validar email
      if (!data.email || !this.isValidEmail(data.email)) {
        errors.push('Email debe tener formato válido');
      }

      // Validar nombre
      if (!data.name || data.name.trim().length < 2) {
        errors.push('Nombre debe tener al menos 2 caracteres');
      }

      // Validar lubricentroId para usuarios no admin
      if (data.role !== 'superadmin' && !data.lubricentroId) {
        errors.push('Usuario debe estar asociado a un lubricentro');
      }

      // Validar que el lubricentro existe (si se proporciona)
      if (data.lubricentroId) {
        const lubricentroExists = await this.validateLubricentroExists(data.lubricentroId);
        if (!lubricentroExists.isValid) {
          errors.push(...lubricentroExists.errors);
        }
      }

      // Verificar que el email no esté en uso
      const emailExists = await this.checkEmailExists(data.email);
      if (emailExists) {
        errors.push('El email ya está registrado en el sistema');
      }

      return {
        isValid: errors.length === 0,
        errors
      };

    } catch (error) {
      console.error('Error in user validation:', error);
      return {
        isValid: false,
        errors: ['Error de validación interno']
      };
    }
  }

  /**
   * Valida límites de suscripción para un lubricentro
   */
  async validateSubscriptionLimits(lubricentroId: string): Promise<ValidationResult> {
    const errors: string[] = [];

    try {
      // Obtener datos del lubricentro desde Firebase
      const lubricentro = await this.getLubricentroData(lubricentroId);
      
      if (!lubricentro) {
        errors.push('Lubricentro no encontrado');
        return { isValid: false, errors };
      }

      // Verificar estado de suscripción - usar campo correcto del tipo real
      if (lubricentro.estado === 'inactivo') {
        errors.push('Lubricentro inactivo. Contacte al administrador.');
        return { 
          isValid: false, 
          errors,
          details: {
            subscriptionStatus: lubricentro.estado
          }
        };
      }

      // Verificar si está en período de prueba vencido
      if (lubricentro.estado === 'trial') {
        const trialEnd = lubricentro.trialEndDate || new Date();
        if (trialEnd < new Date()) {
          errors.push('Período de prueba vencido. Active su suscripción.');
          return { 
            isValid: false, 
            errors,
            details: {
              subscriptionStatus: 'trial_expired'
            }
          };
        }
      }

      // Verificar límite de servicios usando los campos reales del proyecto
      const currentServices = lubricentro.servicesUsedThisMonth || 0;
      const servicesLimit = this.getServicesLimitForPlan(lubricentro.subscriptionPlan || 'basic');
      
      if (servicesLimit > 0 && currentServices >= servicesLimit) {
        errors.push(`Límite de servicios alcanzado (${currentServices}/${servicesLimit}). Actualice su plan.`);
        return { 
          isValid: false, 
          errors,
          details: {
            currentServices,
            servicesLimit,
            subscriptionStatus: lubricentro.estado
          }
        };
      }

      return {
        isValid: true,
        errors: [],
        details: {
          currentServices,
          servicesLimit,
          subscriptionStatus: lubricentro.estado
        }
      };

    } catch (error) {
      console.error('Error validating subscription limits:', error);
      return {
        isValid: false,
        errors: ['Error al validar límites de suscripción']
      };
    }
  }

  /**
   * Valida cambio de plan de suscripción
   */
  async validateSubscriptionChange(data: SubscriptionValidationData): Promise<ValidationResult> {
    const errors: string[] = [];

    try {
      if (!data.lubricentroId) {
        errors.push('ID de lubricentro es requerido');
      }

      if (!data.newPlan) {
        errors.push('Nuevo plan es requerido');
      }

      // Validar que el nuevo plan es diferente al actual
      if (data.newPlan === data.currentPlan) {
        errors.push('El nuevo plan debe ser diferente al plan actual');
      }

      // Validar downgrade con servicios excedidos
      if (data.newPlan && data.currentPlan && data.servicesCount) {
        const newLimit = this.getServicesLimitForPlan(data.newPlan);
        if (newLimit > 0 && data.servicesCount > newLimit) {
          errors.push(`No se puede cambiar al plan ${data.newPlan}. Servicios actuales (${data.servicesCount}) exceden el límite del nuevo plan (${newLimit})`);
        }
      }

      return {
        isValid: errors.length === 0,
        errors
      };

    } catch (error) {
      console.error('Error validating subscription change:', error);
      return {
        isValid: false,
        errors: ['Error al validar cambio de suscripción']
      };
    }
  }

  /**
   * Valida datos de lubricentro
   */
  async validateLubricentroData(lubricentro: Partial<Lubricentro>): Promise<ValidationResult> {
    const errors: string[] = [];

    try {
      // Validaciones requeridas
      if (!lubricentro.fantasyName || lubricentro.fantasyName.trim().length < 2) {
        errors.push('Nombre de fantasía debe tener al menos 2 caracteres');
      }

      if (!lubricentro.responsable || lubricentro.responsable.trim().length < 2) {
        errors.push('Nombre del responsable debe tener al menos 2 caracteres');
      }

      if (!lubricentro.cuit || !this.isValidCUIT(lubricentro.cuit)) {
        errors.push('CUIT debe tener formato válido (XX-XXXXXXXX-X)');
      }

      if (!lubricentro.email || !this.isValidEmail(lubricentro.email)) {
        errors.push('Email debe tener formato válido');
      }

      if (!lubricentro.phone || lubricentro.phone.trim().length < 8) {
        errors.push('Teléfono debe tener al menos 8 dígitos');
      }

      if (!lubricentro.domicilio || lubricentro.domicilio.trim().length < 5) {
        errors.push('Domicilio debe tener al menos 5 caracteres');
      }

      return {
        isValid: errors.length === 0,
        errors
      };

    } catch (error) {
      console.error('Error validating lubricentro data:', error);
      return {
        isValid: false,
        errors: ['Error al validar datos del lubricentro']
      };
    }
  }

  /**
   * Valida permisos de usuario
   */
  async validateUserPermissions(
    userId: string, 
    action: string, 
    resourceId?: string
  ): Promise<ValidationResult> {
    const errors: string[] = [];

    try {
      // Obtener datos del usuario desde Firebase
      const user = await this.getUserData(userId);
      
      if (!user) {
        errors.push('Usuario no encontrado');
        return { isValid: false, errors };
      }

      // Validar permisos según rol
      if (user.role === 'superadmin') {
        // SuperAdmin tiene todos los permisos
        return { isValid: true, errors: [] };
      }

      if (user.role === 'admin' && resourceId) {
        // Admin solo puede acceder a recursos de su lubricentro
        if (user.lubricentroId !== resourceId) {
          errors.push('No tiene permisos para acceder a este recurso');
        }
      }

      if (user.role === 'user') {
        // Usuario regular tiene permisos limitados
        const allowedActions = ['view_services', 'create_service', 'edit_own_service'];
        if (!allowedActions.includes(action)) {
          errors.push('No tiene permisos para realizar esta acción');
        }
      }

      return {
        isValid: errors.length === 0,
        errors
      };

    } catch (error) {
      console.error('Error validating user permissions:', error);
      return {
        isValid: false,
        errors: ['Error al validar permisos']
      };
    }
  }

  // Métodos auxiliares privados
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidDomain(domain: string): boolean {
    // Formato argentino: ABC123 o AB123CD
    const domainRegex = /^[A-Z]{2,3}\d{3}[A-Z]{0,2}$/i;
    return domainRegex.test(domain.replace(/\s/g, ''));
  }

  private isValidCUIT(cuit: string): boolean {
    // Formato: XX-XXXXXXXX-X
    const cuitRegex = /^\d{2}-\d{8}-\d{1}$/;
    return cuitRegex.test(cuit);
  }

  private getServicesLimitForPlan(plan: SubscriptionPlanType): number {
    const limits = {
      basic: 100,
      premium: 500,
      enterprise: -1, // Sin límite
      starter: 50 // Agregado para manejar el plan starter
    };
    return limits[plan] || 100;
  }

  private async getLubricentroData(lubricentroId: string): Promise<Lubricentro | null> {
    try {
      const docRef = doc(db, 'lubricentros', lubricentroId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Lubricentro;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting lubricentro data:', error);
      return null;
    }
  }

  private async validateLubricentroExists(lubricentroId: string): Promise<ValidationResult> {
    try {
      const lubricentro = await this.getLubricentroData(lubricentroId);
      
      if (!lubricentro) {
        return {
          isValid: false,
          errors: ['Lubricentro no encontrado']
        };
      }

      return {
        isValid: true,
        errors: []
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['Error al verificar lubricentro']
      };
    }
  }

  private async getUserData(userId: string): Promise<User | null> {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as User;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  private async checkEmailExists(email: string): Promise<boolean> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking email existence:', error);
      return false; // En caso de error, permitir continuar
    }
  }
}

// Instancia singleton para uso en toda la aplicación
export const validationMiddleware = new ValidationMiddleware();