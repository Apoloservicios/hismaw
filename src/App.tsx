// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Providers
import { AuthProvider } from './context/AuthContext';

// Layouts
import MainLayout from './layouts/MainLayout';
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

// Pages - Dashboard
import DashboardPage from './pages/dashboard/DashboardPage';

// Pages - Oil Changes
import OilChangeListPage from './pages/oilchanges/OilChangeListPage';
import OilChangeFormPage from './pages/oilchanges/OilChangeFormPage';
import OilChangeDetailPage from './pages/oilchanges/OilChangeDetailPage';

// Pages - Users
import UserListPage from './pages/users/UserListPage';
import UserProfilePage from './pages/users/UserProfilePage';

// Pages - Reports
import ReportsPage from './pages/reports/ReportsPage';
import UpcomingServicesPage from './pages/services/UpcomingServicesPage';
import SupportPage from './pages/support/SupportPage';

// Pages - Admin
import LubricentroManagementPage from './pages/admin/LubricentroManagementPage';

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
            
            {/* Rutas protegidas con MainLayout */}
            <Route element={<MainLayout />}>
              {/* Dashboard */}
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRoute>
                    <DashboardPage />
                  </PrivateRoute>
                } 
              />
              
              {/* Rutas de cambios de aceite */}
              <Route 
                path="/cambios-aceite" 
                element={
                  <PrivateRoute>
                    <OilChangeListPage />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/cambios-aceite/nuevo" 
                element={
                  <PrivateRoute>
                    <OilChangeFormPage />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/cambios-aceite/:id" 
                element={
                  <PrivateRoute>
                    <OilChangeDetailPage />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/cambios-aceite/editar/:id" 
                element={
                  <PrivateRoute>
                    <OilChangeFormPage />
                  </PrivateRoute>
                } 
              />
              
              {/* Rutas de usuarios */}
              <Route 
                path="/usuarios" 
                element={
                  <PrivateRoute requiredRoles={['admin', 'superadmin']}>
                    <UserListPage />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/perfil" 
                element={
                  <PrivateRoute>
                    <UserProfilePage />
                  </PrivateRoute>
                } 
              />
              
              {/* Rutas de reportes y servicios */}
              <Route 
                path="/reportes" 
                element={
                  <PrivateRoute requiredRoles={['admin', 'superadmin']}>
                    <ReportsPage />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/proximos-servicios" 
                element={
                  <PrivateRoute>
                    <UpcomingServicesPage />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/soporte" 
                element={
                  <PrivateRoute>
                    <SupportPage />
                  </PrivateRoute>
                } 
              />
              
              {/* Rutas de superadmin */}
              <Route 
                path="/superadmin/lubricentros" 
                element={
                  <PrivateRoute requiredRoles={['superadmin']}>
                    <LubricentroManagementPage />
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