// src/middleware/validationMiddleware.ts
import { User } from '../types';
import { 
  getSubscriptionLimits, 
  validateServiceCreation as unifiedValidateServiceCreation,
  validateUserCreation as unifiedValidateUserCreation 
} from '../services/unifiedSubscriptionService';

// ✅ TIPOS PARA EL MIDDLEWARE
export interface ValidationResult {
  isValid: boolean;
  canProceed: boolean;
  errorType: 'auth' | 'subscription' | 'limits' | 'permissions' | 'system';
  message: string;
  details?: {
    currentServices?: number;
    maxServices?: number;
    currentUsers?: number;
    maxUsers?: number;
    daysRemaining?: number;
    planName?: string;
  };
  suggestedAction?: 'contact_support' | 'upgrade_plan' | 'extend_trial' | 'login_required';
}

export interface ValidationContext {
  user?: User;
  lubricentroId?: string;
  action: 'create_service' | 'create_user' | 'view_reports' | 'manage_users' | 'admin_action';
  metadata?: Record<string, any>;
}

// ✅ CLASE PRINCIPAL DEL MIDDLEWARE
class ValidationMiddleware {

  /**
   * Validación principal que determina si una acción puede proceder
   */
  async validateAction(context: ValidationContext): Promise<ValidationResult> {
    try {
      // 1. Validaciones de autenticación
      const authValidation = this.validateAuthentication(context);
      if (!authValidation.isValid) {
        return authValidation;
      }

      // 2. Validaciones de rol y permisos
      const roleValidation = this.validateRolePermissions(context);
      if (!roleValidation.isValid) {
        return roleValidation;
      }

      // 3. Validaciones de suscripción (si aplica)
      if (this.requiresSubscriptionValidation(context)) {
        const subscriptionValidation = await this.validateSubscription(context);
        if (!subscriptionValidation.isValid) {
          return subscriptionValidation;
        }
      }

      // 4. Validaciones específicas por acción
      const actionValidation = await this.validateSpecificAction(context);
      if (!actionValidation.isValid) {
        return actionValidation;
      }

      // ✅ Todas las validaciones pasaron
      return {
        isValid: true,
        canProceed: true,
        errorType: 'system',
        message: 'Validación exitosa'
      };

    } catch (error) {
      console.error('Error en middleware de validación:', error);
      return {
        isValid: false,
        canProceed: false,
        errorType: 'system',
        message: 'Error interno del sistema',
        suggestedAction: 'contact_support'
      };
    }
  }

  /**
   * Validación específica para crear servicios
   */
  async validateServiceCreation(lubricentroId: string, user?: User): Promise<ValidationResult> {
    const context: ValidationContext = {
      user,
      lubricentroId,
      action: 'create_service'
    };

    return this.validateAction(context);
  }

  /**
   * Validación específica para crear usuarios
   */
  async validateUserCreation(lubricentroId: string, user?: User): Promise<ValidationResult> {
    const context: ValidationContext = {
      user,
      lubricentroId,
      action: 'create_user'
    };

    return this.validateAction(context);
  }

  /**
   * Validación específica para acciones administrativas
   */
  async validateAdminAction(action: string, user?: User, lubricentroId?: string): Promise<ValidationResult> {
    const context: ValidationContext = {
      user,
      lubricentroId,
      action: 'admin_action',
      metadata: { specificAction: action }
    };

    return this.validateAction(context);
  }

  // ============ MÉTODOS PRIVADOS ============

  /**
   * Validar autenticación básica
   */
  private validateAuthentication(context: ValidationContext): ValidationResult {
    if (!context.user) {
      return {
        isValid: false,
        canProceed: false,
        errorType: 'auth',
        message: 'Usuario no autenticado',
        suggestedAction: 'login_required'
      };
    }

    if (context.user.estado !== 'activo') {
      return {
        isValid: false,
        canProceed: false,
        errorType: 'auth',
        message: 'Cuenta de usuario inactiva',
        suggestedAction: 'contact_support'
      };
    }

    return {
      isValid: true,
      canProceed: true,
      errorType: 'auth',
      message: 'Autenticación válida'
    };
  }

  /**
   * Validar roles y permisos
   */
  private validateRolePermissions(context: ValidationContext): ValidationResult {
    const { user, action } = context;

    if (!user) {
      return {
        isValid: false,
        canProceed: false,
        errorType: 'permissions',
        message: 'Usuario requerido para validación de permisos'
      };
    }

    // SuperAdmin puede hacer todo
    if (user.role === 'superadmin') {
      return {
        isValid: true,
        canProceed: true,
        errorType: 'permissions',
        message: 'SuperAdmin: todos los permisos'
      };
    }

    // Validaciones específicas por rol
    switch (action) {
      case 'create_service':
      case 'view_reports':
        // Admin y user pueden crear servicios y ver algunos reportes
        if (user.role === 'admin' || user.role === 'user') {
          return this.createSuccessResult('permissions', 'Permisos válidos para la acción');
        }
        break;

      case 'create_user':
      case 'manage_users':
      case 'admin_action':
        // Solo admin puede gestionar usuarios
        if (user.role === 'admin') {
          return this.createSuccessResult('permissions', 'Permisos de administrador válidos');
        }
        return {
          isValid: false,
          canProceed: false,
          errorType: 'permissions',
          message: 'Se requieren permisos de administrador para esta acción'
        };

      default:
        // Acción no reconocida
        return {
          isValid: false,
          canProceed: false,
          errorType: 'permissions',
          message: `Acción no reconocida: ${action}`
        };
    }

    return {
      isValid: false,
      canProceed: false,
      errorType: 'permissions',
      message: 'Permisos insuficientes para esta acción'
    };
  }

  /**
   * Validar suscripción y límites
   */
  private async validateSubscription(context: ValidationContext): Promise<ValidationResult> {
    const { lubricentroId, action } = context;

    if (!lubricentroId) {
      return {
        isValid: false,
        canProceed: false,
        errorType: 'subscription',
        message: 'ID de lubricentro requerido para validación de suscripción'
      };
    }

    try {
      // Obtener límites actuales
      const limits = await getSubscriptionLimits(lubricentroId);

      // Validaciones específicas por acción
      switch (action) {
        case 'create_service':
          const serviceValidation = await validateServiceCreation(lubricentroId);
          
          if (!serviceValidation.canCreateService) {
            return {
              isValid: false,
              canProceed: false,
              errorType: 'limits',
              message: serviceValidation.message || 'No se pueden crear más servicios',
              details: {
                currentServices: limits.currentServices,
                maxServices: limits.maxServices || undefined,
                planName: limits.planName,
                daysRemaining: limits.daysRemaining
              },
              suggestedAction: limits.planName === 'Período de Prueba' ? 'contact_support' : 'upgrade_plan'
            };
          }
          break;

        case 'create_user':
          const userValidation = await validateUserCreation(lubricentroId);
          
          if (!userValidation.canCreateUser) {
            return {
              isValid: false,
              canProceed: false,
              errorType: 'limits',
              message: userValidation.message || 'No se pueden crear más usuarios',
              details: {
                currentUsers: limits.currentUsers,
                maxUsers: limits.maxUsers,
                planName: limits.planName
              },
              suggestedAction: limits.planName === 'Período de Prueba' ? 'contact_support' : 'upgrade_plan'
            };
          }
          break;
      }

      // Verificar si el período de prueba ha expirado
      if (limits.planName === 'Período de Prueba' && limits.daysRemaining === 0) {
        return {
          isValid: false,
          canProceed: false,
          errorType: 'subscription',
          message: 'El período de prueba ha expirado',
          details: {
            planName: limits.planName,
            daysRemaining: 0
          },
          suggestedAction: 'contact_support'
        };
      }

      return this.createSuccessResult('subscription', 'Suscripción válida');

    } catch (error) {
      console.error('Error al validar suscripción:', error);
      return {
        isValid: false,
        canProceed: false,
        errorType: 'system',
        message: 'Error al verificar la suscripción',
        suggestedAction: 'contact_support'
      };
    }
  }

  /**
   * Validaciones específicas por acción
   */
  private async validateSpecificAction(context: ValidationContext): Promise<ValidationResult> {
    const { action, user, lubricentroId } = context;

    switch (action) {
      case 'create_service':
        // Validaciones adicionales para crear servicios
        if (!lubricentroId) {
          return this.createErrorResult('system', 'ID de lubricentro requerido para crear servicios');
        }
        break;

      case 'create_user':
        // Validaciones adicionales para crear usuarios
        if (!lubricentroId) {
          return this.createErrorResult('system', 'ID de lubricentro requerido para crear usuarios');
        }
        
        if (user?.role !== 'admin' && user?.role !== 'superadmin') {
          return this.createErrorResult('permissions', 'Solo administradores pueden crear usuarios');
        }
        break;

      case 'admin_action':
        // Validaciones para acciones administrativas
        const specificAction = context.metadata?.specificAction;
        
        if (specificAction === 'delete_data' && user?.role !== 'superadmin') {
          return this.createErrorResult('permissions', 'Solo SuperAdmin puede eliminar datos');
        }
        break;
    }

    return this.createSuccessResult('system', 'Validación específica exitosa');
  }

  /**
   * Determinar si se requiere validación de suscripción
   */
  private requiresSubscriptionValidation(context: ValidationContext): boolean {
    const { action, user } = context;

    // SuperAdmin no necesita validación de suscripción
    if (user?.role === 'superadmin') {
      return false;
    }

    // Acciones que requieren validación de suscripción
    const actionsRequiringSubscription = [
      'create_service',
      'create_user'
    ];

    return actionsRequiringSubscription.includes(action);
  }

  /**
   * Helper para crear resultado de éxito
   */
  private createSuccessResult(errorType: ValidationResult['errorType'], message: string): ValidationResult {
    return {
      isValid: true,
      canProceed: true,
      errorType,
      message
    };
  }

  /**
   * Helper para crear resultado de error
   */
  private createErrorResult(
    errorType: ValidationResult['errorType'], 
    message: string, 
    suggestedAction?: ValidationResult['suggestedAction']
  ): ValidationResult {
    return {
      isValid: false,
      canProceed: false,
      errorType,
      message,
      suggestedAction
    };
  }
}

// ✅ EXPORTAR INSTANCIA SINGLETON
export const validationMiddleware = new ValidationMiddleware();

// ✅ FUNCIONES DE CONVENIENCIA
export const validateServiceCreationAction = (lubricentroId: string, user?: User) =>
  validationMiddleware.validateServiceCreation(lubricentroId, user);

export const validateUserCreationAction = (lubricentroId: string, user?: User) =>
  validationMiddleware.validateUserCreation(lubricentroId, user);

export const validateAdminAction = (action: string, user?: User, lubricentroId?: string) =>
  validationMiddleware.validateAdminAction(action, user, lubricentroId);

export const validateAction = (context: ValidationContext) =>
  validationMiddleware.validateAction(context);

export default validationMiddleware;