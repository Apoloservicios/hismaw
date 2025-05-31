// src/hooks/useValidation.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  validationMiddleware, 
  ValidationResult, 
  ValidationContext 
} from '../middleware/validationMiddleware';
import { auditLoggingService } from '../services/auditLoggingService';

// ✅ TIPOS PARA EL HOOK
export interface ValidationState {
  isValidating: boolean;
  canProceed: boolean;
  error: string | null;
  details?: ValidationResult['details'];
  suggestedAction?: ValidationResult['suggestedAction'];
}

export interface UseValidationOptions {
  validateOnMount?: boolean;
  logFailures?: boolean;
  action: ValidationContext['action'];
  lubricentroId?: string;
  metadata?: Record<string, any>;
}

// ✅ HOOK PRINCIPAL
export const useValidation = (options: UseValidationOptions) => {
  const { userProfile } = useAuth();
  const { validateOnMount = true, logFailures = true, action, lubricentroId, metadata } = options;

  const [validationState, setValidationState] = useState<ValidationState>({
    isValidating: false,
    canProceed: false,
    error: null
  });

  // Función para ejecutar validación
  const validate = useCallback(async (): Promise<ValidationResult> => {
    setValidationState(prev => ({ ...prev, isValidating: true, error: null }));

    try {
      const context: ValidationContext = {
        user: userProfile || undefined,
        lubricentroId,
        action,
        metadata
      };

      const result = await validationMiddleware.validateAction(context);

      setValidationState({
        isValidating: false,
        canProceed: result.canProceed,
        error: result.isValid ? null : result.message,
        details: result.details,
        suggestedAction: result.suggestedAction
      });

      // Registrar fallos de validación si está habilitado
      if (!result.isValid && logFailures) {
        await auditLoggingService.logValidationFailed(
          userProfile || undefined,
          action,
          result.message,
          lubricentroId
        );
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error de validación desconocido';
      
      setValidationState({
        isValidating: false,
        canProceed: false,
        error: errorMessage,
        suggestedAction: 'contact_support'
      });

      // Registrar error del sistema
      if (logFailures && error instanceof Error) {
        await auditLoggingService.logSystemError(
          error,
          `Validación para acción: ${action}`,
          userProfile || undefined,
          lubricentroId
        );
      }

      return {
        isValid: false,
        canProceed: false,
        errorType: 'system',
        message: errorMessage,
        suggestedAction: 'contact_support'
      };
    }
  }, [userProfile, lubricentroId, action, metadata, logFailures]);

  // Validar automáticamente al montar si está habilitado
  useEffect(() => {
    if (validateOnMount && userProfile) {
      validate();
    }
  }, [validateOnMount, userProfile, validate]);

  // Función para resetear el estado de validación
  const resetValidation = useCallback(() => {
    setValidationState({
      isValidating: false,
      canProceed: false,
      error: null
    });
  }, []);

  return {
    ...validationState,
    validate,
    resetValidation
  };
};

// ✅ HOOKS ESPECIALIZADOS PARA ACCIONES COMUNES

/**
 * Hook para validar creación de servicios
 */
export const useServiceValidation = (lubricentroId?: string) => {
  return useValidation({
    action: 'create_service',
    lubricentroId,
    validateOnMount: true,
    logFailures: true
  });
};

/**
 * Hook para validar creación de usuarios
 */
export const useUserValidation = (lubricentroId?: string) => {
  return useValidation({
    action: 'create_user',
    lubricentroId,
    validateOnMount: true,
    logFailures: true
  });
};

/**
 * Hook para validar acciones administrativas
 */
export const useAdminValidation = (specificAction: string, lubricentroId?: string) => {
  return useValidation({
    action: 'admin_action',
    lubricentroId,
    metadata: { specificAction },
    validateOnMount: true,
    logFailures: true
  });
};

/**
 * Hook para validar acceso a reportes
 */
export const useReportValidation = (lubricentroId?: string) => {
  return useValidation({
    action: 'view_reports',
    lubricentroId,
    validateOnMount: true,
    logFailures: false // Los reportes son menos críticos
  });
};

export default useValidation;