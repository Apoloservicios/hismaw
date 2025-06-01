// src/components/common/ValidationGuard.tsx
import React, { ReactNode, useEffect, useState } from 'react';
import { useAuth, usePermissions } from '../../hooks/useAuth';
import { validationMiddleware, ValidationResult } from '../../middleware/validationMiddleware';

interface ValidationGuardProps {
  children: ReactNode;
  lubricentroId?: string;
  requiredRole?: 'superadmin' | 'admin' | 'user';
  action?: string;
  className?: string;
  fallback?: ReactNode;
}

interface ValidationStatus {
  isValid: boolean;
  loading: boolean;
  errors: string[];
  details?: {
    currentServices?: number;
    servicesLimit?: number;
    subscriptionStatus?: string;
  };
}

export const ValidationGuard: React.FC<ValidationGuardProps> = ({
  children,
  lubricentroId,
  requiredRole,
  action = 'view',
  className = '',
  fallback
}) => {
  const { user, loading: authLoading } = useAuth();
  const { canAccessLubricentro, canManageSubscriptions, canCreateService } = usePermissions();
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>({
    isValid: false,
    loading: true,
    errors: []
  });

  useEffect(() => {
    validateAccess();
  }, [user, lubricentroId, requiredRole, action]);

  const validateAccess = async () => {
    if (authLoading) return;

    setValidationStatus({ isValid: false, loading: true, errors: [] });

    try {
      const errors: string[] = [];
      let validationDetails = {};

      // Validar autenticación
      if (!user) {
        errors.push('Usuario no autenticado');
        setValidationStatus({ 
          isValid: false, 
          loading: false, 
          errors 
        });
        return;
      }

      // Validar estado del usuario
      if (user.estado !== 'activo') {
        errors.push('Usuario inactivo. Contacte al administrador.');
        setValidationStatus({ 
          isValid: false, 
          loading: false, 
          errors 
        });
        return;
      }

      // Validar rol requerido
      if (requiredRole && user.role !== requiredRole && user.role !== 'superadmin') {
        errors.push(`Permisos insuficientes. Rol requerido: ${requiredRole}`);
      }

      // Validar acceso a lubricentro específico
      if (lubricentroId && !canAccessLubricentro(lubricentroId)) {
        errors.push('No tiene permisos para acceder a este lubricentro');
      }

      // Validar acción específica
      if (action && user.id) {
        const permissionValidation = await validationMiddleware.validateUserPermissions(
          user.id,
          action,
          lubricentroId
        );
        
        if (!permissionValidation.isValid) {
          errors.push(...permissionValidation.errors);
        }
      }

      // Validar límites de suscripción si es necesario
      if (lubricentroId && (action === 'create_service' || action === 'create')) {
        const subscriptionValidation = await validationMiddleware.validateSubscriptionLimits(lubricentroId);
        
        if (!subscriptionValidation.isValid) {
          errors.push(...subscriptionValidation.errors);
        } else {
          validationDetails = subscriptionValidation.details || {};
        }
      }

      setValidationStatus({
        isValid: errors.length === 0,
        loading: false,
        errors,
        details: validationDetails
      });

    } catch (error) {
      console.error('Error in validation guard:', error);
      setValidationStatus({
        isValid: false,
        loading: false,
        errors: ['Error de validación interno']
      });
    }
  };

  // Loading state
  if (authLoading || validationStatus.loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Validando permisos...</span>
      </div>
    );
  }

  // Error state
  if (!validationStatus.isValid) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className={`bg-red-50 border border-red-200 rounded-md p-6 ${className}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-red-400 text-xl">⚠</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Acceso Denegado
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <ul className="list-disc list-inside space-y-1">
                {validationStatus.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
            
            {/* Mostrar información de suscripción si es relevante */}
            {validationStatus.details && (
              <div className="mt-3 p-3 bg-red-100 rounded-md">
                <p className="text-sm text-red-800">
                  <strong>Estado de suscripción:</strong>
                </p>
                <ul className="text-xs text-red-700 mt-1">
                  {validationStatus.details.currentServices !== undefined && (
                    <li>
                      Servicios: {validationStatus.details.currentServices} / {' '}
                      {validationStatus.details.servicesLimit === -1 ? 'Ilimitado' : validationStatus.details.servicesLimit}
                    </li>
                  )}
                  {validationStatus.details.subscriptionStatus && (
                    <li>Estado: {validationStatus.details.subscriptionStatus}</li>
                  )}
                </ul>
              </div>
            )}
            
            <div className="mt-4">
              <button
                onClick={() => window.history.back()}
                className="text-sm bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state - mostrar contenido con información adicional si es útil
  return (
    <div className={className}>
      {validationStatus.details && validationStatus.details.currentServices !== undefined && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
          <div className="text-blue-800 text-sm">
            <strong>Estado de suscripción:</strong> {' '}
            Servicios utilizados: {validationStatus.details.currentServices} / {' '}
            {validationStatus.details.servicesLimit === -1 ? 'Ilimitado' : validationStatus.details.servicesLimit}
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

// Componente de HOC para validación más avanzada
interface withValidationProps {
  lubricentroId?: string;
  requiredRole?: 'superadmin' | 'admin' | 'user';
  action?: string;
}

export const withValidation = <P extends object>(
  Component: React.ComponentType<P>,
  validationProps: withValidationProps
) => {
  return (props: P) => (
    <ValidationGuard {...validationProps}>
      <Component {...props} />
    </ValidationGuard>
  );
};

// Hook personalizado para usar validación en componentes
export const useValidation = (lubricentroId?: string, action?: string) => {
  const { user } = useAuth();
  const [validationResult, setValidationResult] = useState<ValidationStatus>({
    isValid: false,
    loading: true,
    errors: []
  });

  useEffect(() => {
    if (user && lubricentroId) {
      validateUserAccess();
    }
  }, [user, lubricentroId, action]);

  const validateUserAccess = async () => {
    if (!user || !lubricentroId) return;

    try {
      setValidationResult(prev => ({ ...prev, loading: true }));

      // Validar permisos del usuario
      const permissionValidation = await validationMiddleware.validateUserPermissions(
        user.id,
        action || 'view',
        lubricentroId
      );

      // Validar límites de suscripción si es necesario
      let subscriptionValidation: ValidationResult = { isValid: true, errors: [], details: {} };
      if (action === 'create_service' || action === 'create') {
        subscriptionValidation = await validationMiddleware.validateSubscriptionLimits(lubricentroId);
      }

      const allErrors = [
        ...permissionValidation.errors,
        ...subscriptionValidation.errors
      ];

      setValidationResult({
        isValid: allErrors.length === 0,
        loading: false,
        errors: allErrors,
        details: subscriptionValidation.details
      });

    } catch (error) {
      console.error('Error in useValidation:', error);
      setValidationResult({
        isValid: false,
        loading: false,
        errors: ['Error de validación']
      });
    }
  };

  return {
    ...validationResult,
    revalidate: validateUserAccess
  };
};

export default ValidationGuard;