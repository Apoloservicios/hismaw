// src/App.tsx - VERSIÓN ACTUALIZADA
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Providers
import { AuthProvider } from './context/AuthContext';

// ✅ NUEVOS LAYOUTS SEPARADOS
import SuperAdminLayout from './layouts/SuperAdminLayout';
import UserLayout from './layouts/UserLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages - Auth
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import RegistroExitosoPage from './pages/auth/RegistroExitosoPage';
import RegistroPendientePage from './pages/auth/RegistroPendientePage';

// Pages - Public
import HomePage from './pages/public/HomePage';
import PublicHistoryPage from './pages/public/PublicHistoryPage';

// ✅ NUEVOS DASHBOARDS SEPARADOS
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import UserDashboard from './pages/dashboard/UserDashboard';

// Pages - Oil Changes
import OilChangeListPage from './pages/oilchanges/OilChangeListPage';
import OilChangeFormPage from './pages/oilchanges/OilChangeFormPage';
import OilChangeDetailPage from './pages/oilchanges/OilChangeDetailPage';

// Pages - Users
import UserListPage from './pages/users/UserListPage';
import UserProfilePage from './pages/users/UserProfilePage';

// Pages - Reports
import ReportsPage from './pages/reports/ReportsPage';
import OperatorReportPage from './pages/reports/OperatorReportPage';
import VehicleReportPage from './pages/reports/VehicleReportPage';
import UpcomingServicesPage from './pages/services/UpcomingServicesPage';
import SupportPage from './pages/support/SupportPage';

// Pages - Admin Lubricentros (para SuperAdmin)
import LubricentroDashboardPage from './pages/admin/LubricentroDashboardPage';
import LubricentroFormPage from './pages/admin/LubricentroFormPage';
import LubricentroDetailPage from './pages/admin/LubricentroDetailPage';

// ✅ NUEVA PÁGINA DE GESTIÓN DE SUSCRIPCIONES
import SubscriptionManagementPage from './pages/superadmin/SubscriptionManagementPage';

// Pages - Super Admin Reports
import SuperAdminReportPage from './pages/admin/SuperAdminReportPage';

// Components
import PrivateRoute from './components/common/PrivateRoute';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<HomePage />} />
            <Route path="/consulta-historial" element={<PublicHistoryPage />} />
            
            {/* Rutas de autenticación con AuthLayout */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            </Route>
            
            {/* Rutas de registro */}
            <Route path="/registro-exitoso" element={<RegistroExitosoPage />} />
            <Route path="/registro-pendiente" element={<RegistroPendientePage />} />
            
            {/* ========== RUTAS DE SUPERADMIN CON LAYOUT EXCLUSIVO ========== */}
            <Route element={<SuperAdminLayout />}>
              <Route 
                path="/superadmin/dashboard" 
                element={
                  <PrivateRoute requiredRoles={['superadmin']}>
                    <SuperAdminDashboard />
                  </PrivateRoute>
                } 
              />
              
              {/* Gestión de lubricentros */}
              <Route 
                path="/superadmin/lubricentros" 
                element={
                  <PrivateRoute requiredRoles={['superadmin']}>
                    <LubricentroDashboardPage />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/superadmin/lubricentros/nuevo" 
                element={
                  <PrivateRoute requiredRoles={['superadmin']}>
                    <LubricentroFormPage />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/superadmin/lubricentros/editar/:id" 
                element={
                  <PrivateRoute requiredRoles={['superadmin']}>
                    <LubricentroFormPage />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/superadmin/lubricentros/:id" 
                element={
                  <PrivateRoute requiredRoles={['superadmin']}>
                    <LubricentroDetailPage />
                  </PrivateRoute>
                } 
              />

              {/* ✅ NUEVA GESTIÓN UNIFICADA DE SUSCRIPCIONES */}
              <Route 
                path="/superadmin/suscripciones" 
                element={
                  <PrivateRoute requiredRoles={['superadmin']}>
                    <SubscriptionManagementPage />
                  </PrivateRoute>
                } 
              />
              
              {/* Usuarios del sistema */}
              <Route 
                path="/superadmin/usuarios" 
                element={
                  <PrivateRoute requiredRoles={['superadmin']}>
                    <UserListPage />
                  </PrivateRoute>
                } 
              />

              {/* Estadísticas globales del sistema */}
              <Route 
                path="/superadmin/reportes" 
                element={
                  <PrivateRoute requiredRoles={['superadmin']}>
                    <SuperAdminReportPage />
                  </PrivateRoute>
                } 
              />
              
              {/* Perfil del superadmin */}
              <Route 
                path="/superadmin/perfil" 
                element={
                  <PrivateRoute requiredRoles={['superadmin']}>
                    <UserProfilePage />
                  </PrivateRoute>
                } 
              />
            </Route>
            
            {/* ========== RUTAS DE USUARIOS NORMALES CON LAYOUT SIMPLIFICADO ========== */}
            <Route element={<UserLayout />}>
              {/* Dashboard unificado para admin y user */}
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRoute requiredRoles={['admin', 'user']}>
                    <UserDashboard />
                  </PrivateRoute>
                } 
              />

              {/* Rutas de cambios de aceite */}
              <Route 
                path="/cambios-aceite" 
                element={
                  <PrivateRoute requiredRoles={['admin', 'user']}>
                    <OilChangeListPage />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/cambios-aceite/nuevo" 
                element={
                  <PrivateRoute requiredRoles={['admin', 'user']} requiresActiveSubscription={true}>
                    <OilChangeFormPage />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/cambios-aceite/:id" 
                element={
                  <PrivateRoute requiredRoles={['admin', 'user']}>
                    <OilChangeDetailPage />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/cambios-aceite/editar/:id" 
                element={
                  <PrivateRoute requiredRoles={['admin', 'user']} requiresActiveSubscription={true}>
                    <OilChangeFormPage />
                  </PrivateRoute>
                } 
              />
              
              {/* Rutas de usuarios (solo para admin) */}
              <Route 
                path="/usuarios" 
                element={
                  <PrivateRoute requiredRoles={['admin']}>
                    <UserListPage />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/perfil" 
                element={
                  <PrivateRoute requiredRoles={['admin', 'user']}>
                    <UserProfilePage />
                  </PrivateRoute>
                } 
              />
              
              {/* Rutas de reportes y servicios */}
              <Route 
                path="/reportes" 
                element={
                  <PrivateRoute requiredRoles={['admin']}>
                    <ReportsPage />
                  </PrivateRoute>
                } 
              />
              
              {/* Rutas para reportes detallados */}
              <Route 
                path="/reportes/operador/:id" 
                element={
                  <PrivateRoute requiredRoles={['admin']}>
                    <OperatorReportPage />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/reportes/vehiculo/:dominio" 
                element={
                  <PrivateRoute requiredRoles={['admin']}>
                    <VehicleReportPage />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/proximos-servicios" 
                element={
                  <PrivateRoute requiredRoles={['admin', 'user']}>
                    <UpcomingServicesPage />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/soporte" 
                element={
                  <PrivateRoute requiredRoles={['admin', 'user']}>
                    <SupportPage />
                  </PrivateRoute>
                } 
              />
            </Route>
            
            {/* Redirigir rutas desconocidas */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;