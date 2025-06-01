// src/components/common/PrivateRoute.tsx - VERSIÓN ACTUALIZADA
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Alert, Spinner } from '../ui';
// ✅ USAR SERVICIO UNIFICADO
import { validateServiceCreation, getSubscriptionLimits } from '../../services/unifiedSubscriptionService';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRoles?: ('admin' | 'user' | 'superadmin')[];
  requiresActiveSubscription?: boolean;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  children, 
  requiredRoles,
  requiresActiveSubscription = false 
}) => {
  const { currentUser, userProfile, loading } = useAuth();
  const location = useLocation();
  const [subscriptionChecking, setSubscriptionChecking] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  
  // Verificar suscripción si es necesario
  useEffect(() => {
    const checkSubscription = async () => {
      if (!requiresActiveSubscription || !userProfile?.lubricentroId || userProfile.role === 'superadmin') {
        return;
      }
      
      try {
        setSubscriptionChecking(true);
        setSubscriptionError(null);
        
        // ✅ USAR VALIDACIÓN UNIFICADA
        const validation = await validateServiceCreation(userProfile.lubricentroId);
        
        if (!validation.canCreateService) {
          setSubscriptionError(validation.message || 'No tienes permisos para realizar esta acción');
        }
        
      } catch (error) {
        console.error('Error al verificar suscripción:', error);
        setSubscriptionError('Error al verificar los permisos de suscripción');
      } finally {
        setSubscriptionChecking(false);
      }
    };
    
    if (userProfile && requiresActiveSubscription) {
      checkSubscription();
    }
  }, [userProfile, requiresActiveSubscription]);
  
  // Mostrar spinner mientras carga
  if (loading || subscriptionChecking) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-2 text-gray-600">
            {loading ? 'Verificando autenticación...' : 'Verificando permisos de suscripción...'}
          </p>
        </div>
      </div>
    );
  }
  
  // Redirigir a login si no está autenticado
  if (!currentUser || !userProfile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Verificar roles requeridos
  if (requiredRoles && !requiredRoles.includes(userProfile.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full">
          <Alert type="error">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Acceso Denegado
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                No tienes permisos para acceder a esta sección.
              </p>
              <button
                onClick={() => window.history.back()}
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
              >
                Volver
              </button>
            </div>
          </Alert>
        </div>
      </div>
    );
  }
  
  // Verificar suscripción si es requerida
  if (requiresActiveSubscription && subscriptionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full">
          <Alert type="warning">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Suscripción Requerida
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {subscriptionError}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  onClick={() => window.location.href = 'mailto:soporte@hisma.com.ar?subject=Activar%20suscripción'}
                  className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
                >
                  Contactar Soporte
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  Volver
                </button>
              </div>
            </div>
          </Alert>
        </div>
      </div>
    );
  }
  
  // ✅ TODO OK - Renderizar el componente hijo
  return <>{children}</>;
};

export default PrivateRoute;