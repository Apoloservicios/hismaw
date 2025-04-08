// src/components/common/PrivateRoute.tsx
import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

// Componente de carga
const LoadingScreen = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
  </div>
);

interface PrivateRouteProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  children, 
  requiredRoles = ['superadmin', 'admin', 'user']  // Por defecto permite todos los roles
}) => {
  const { currentUser, userProfile, loading } = useAuth();
  const location = useLocation();
  
  // Mostrar un spinner mientras se verifica la autenticación
  if (loading) {
    return <LoadingScreen />;
  }
  
  // Si no hay usuario autenticado, redirigir al login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Si hay requisitos de roles, verificar el rol del usuario
  if (requiredRoles.length > 0 && userProfile) {
    if (!requiredRoles.includes(userProfile.role)) {
      // Redirigir al dashboard si no tiene los permisos
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  // Verificar si la cuenta del lubricentro está activa o en período de prueba
  if (userProfile && userProfile.role !== 'superadmin') {
    if (userProfile.estado === 'inactivo') {
      // Redirigir a la página de soporte si la cuenta está inactiva
      return <Navigate to="/soporte" replace />;
    }
  }
  
  // Si pasa todas las validaciones, renderizar los hijos
  return <>{children}</>;
};

export default PrivateRoute;