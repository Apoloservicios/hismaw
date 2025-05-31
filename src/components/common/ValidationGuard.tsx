// src/components/common/ValidationGuard.tsx
import React from 'react';
import { useValidation, UseValidationOptions } from '../../hooks/useValidation';
import { Alert, Button, Spinner } from '../ui';
import { 
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  ClockIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

interface ValidationGuardProps extends UseValidationOptions {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showDetails?: boolean;
  className?: string;
}

/**
 * Componente que protege el contenido basado en validaciones
 */
const ValidationGuard: React.FC<ValidationGuardProps> = ({ 
  children, 
  fallback,
  showDetails = true,
  className = '',
  ...validationOptions 
}) => {
  const { isValidating, canProceed, error, details, suggestedAction, validate } = useValidation(validationOptions);

  // Mostrar spinner mientras valida
  if (isValidating) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-2 text-sm text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si puede proceder, mostrar el contenido
  if (canProceed) {
    return <>{children}</>;
  }

  // Si hay error, mostrar el fallback o mensaje de error
  if (error) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className={`${className}`}>
        <ValidationErrorDisplay
          error={error}
          details={details}
          suggestedAction={suggestedAction}
          showDetails={showDetails}
          onRetry={() => validate()}
        />
      </div>
    );
  }

  // Estado por defecto (no debería llegar aquí)
  return null;
};

/**
 * Componente para mostrar errores de validación
 */
interface ValidationErrorDisplayProps {
  error: string;
  details?: any;
  suggestedAction?: string;
  showDetails?: boolean;
  onRetry: () => void;
}

const ValidationErrorDisplay: React.FC<ValidationErrorDisplayProps> = ({
  error,
  details,
  suggestedAction,
  showDetails,
  onRetry
}) => {
  const getIcon = () => {
    switch (suggestedAction) {
      case 'contact_support':
        return <EnvelopeIcon className="h-8 w-8 text-orange-500" />;
      case 'upgrade_plan':
        return <ShieldExclamationIcon className="h-8 w-8 text-blue-500" />;
      case 'extend_trial':
        return <ClockIcon className="h-8 w-8 text-yellow-500" />;
      case 'login_required':
        return <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="h-8 w-8 text-orange-500" />;
    }
  };

  const getAlertType = () => {
    switch (suggestedAction) {
      case 'contact_support':
      case 'extend_trial':
        return 'warning';
      case 'upgrade_plan':
        return 'info';
      case 'login_required':
        return 'error';
      default:
        return 'warning';
    }
  };

  const getSuggestedActionButtons = () => {
    const buttons = [];

    switch (suggestedAction) {
      case 'contact_support':
        buttons.push(
          <Button
            key="email"
            size="sm"
            color="warning"
            icon={<EnvelopeIcon className="h-4 w-4" />}
            onClick={() => window.location.href = 'mailto:soporte@hisma.com.ar?subject=Solicitud%20de%20soporte'}
          >
            Contactar por Email
          </Button>
        );
        buttons.push(
          <Button
            key="whatsapp"
            size="sm"
            variant="outline"
            color="warning"
            icon={<ChatBubbleLeftRightIcon className="h-4 w-4" />}
            onClick={() => window.open('https://wa.me/5491112345678?text=Hola%2C%20necesito%20ayuda%20con%20mi%20suscripción')}
          >
            WhatsApp
          </Button>
        );
        break;

      case 'upgrade_plan':
        buttons.push(
          <Button
            key="upgrade"
            size="sm"
            color="primary"
            onClick={() => window.location.href = 'mailto:soporte@hisma.com.ar?subject=Solicitar%20upgrade%20de%20plan'}
          >
            Solicitar Upgrade
          </Button>
        );
        break;

      case 'login_required':
        buttons.push(
          <Button
            key="login"
            size="sm"
            color="primary"
            onClick={() => window.location.href = '/login'}
          >
            Iniciar Sesión
          </Button>
        );
        break;

      case 'extend_trial':
        buttons.push(
          <Button
            key="extend"
            size="sm"
            color="warning"
            onClick={() => window.location.href = 'mailto:soporte@hisma.com.ar?subject=Solicitar%20extensión%20de%20prueba'}
          >
            Solicitar Extensión
          </Button>
        );
        break;
    }

    // Botón de reintentar siempre disponible
    buttons.push(
      <Button
        key="retry"
        size="sm"
        variant="outline"
        onClick={onRetry}
      >
        Reintentar
      </Button>
    );

    return buttons;
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Alert type={getAlertType()}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium">
              Acceso Restringido
            </h3>
            <div className="mt-2 text-sm">
              <p>{error}</p>
              
              {/* Mostrar detalles si están disponibles y habilitados */}
              {showDetails && details && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Detalles:</h4>
                  <div className="space-y-1">
                    {details.planName && (
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Plan actual:</span> {details.planName}
                      </div>
                    )}
                    {details.currentServices !== undefined && details.maxServices !== undefined && (
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Servicios:</span> {details.currentServices} / {details.maxServices}
                      </div>
                    )}
                    {details.currentUsers !== undefined && details.maxUsers !== undefined && (
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Usuarios:</span> {details.currentUsers} / {details.maxUsers}
                      </div>
                    )}
                    {details.daysRemaining !== undefined && (
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Días restantes:</span> {details.daysRemaining}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Botones de acción sugerida */}
            <div className="mt-4 flex flex-wrap gap-2">
              {getSuggestedActionButtons()}
            </div>
          </div>
        </div>
      </Alert>
    </div>
  );
};

export default ValidationGuard;

// ✅ COMPONENTES DE CONVENIENCIA ESPECÍFICOS

/**
 * Protege la creación de servicios
 */
export const ServiceCreationGuard: React.FC<{
  children: React.ReactNode;
  lubricentroId?: string;
  className?: string;
}> = ({ children, lubricentroId, className }) => (
  <ValidationGuard
    action="create_service"
    lubricentroId={lubricentroId}
    className={className}
  >
    {children}
  </ValidationGuard>
);

/**
 * Protege la creación de usuarios
 */
export const UserCreationGuard: React.FC<{
  children: React.ReactNode;
  lubricentroId?: string;
  className?: string;
}> = ({ children, lubricentroId, className }) => (
  <ValidationGuard
    action="create_user"
    lubricentroId={lubricentroId}
    className={className}
  >
    {children}
  </ValidationGuard>
);

/**
 * Protege acciones administrativas
 */
export const AdminActionGuard: React.FC<{
  children: React.ReactNode;
  specificAction: string;
  lubricentroId?: string;
  className?: string;
}> = ({ children, specificAction, lubricentroId, className }) => (
  <ValidationGuard
    action="admin_action"
    metadata={{ specificAction }}
    lubricentroId={lubricentroId}
    className={className}
  >
    {children}
  </ValidationGuard>
);

/**
 * Protege acceso a reportes
 */
export const ReportAccessGuard: React.FC<{
  children: React.ReactNode;
  lubricentroId?: string;
  className?: string;
}> = ({ children, lubricentroId, className }) => (
  <ValidationGuard
    action="view_reports"
    lubricentroId={lubricentroId}
    logFailures={false}
    className={className}
  >
    {children}
  </ValidationGuard>
);