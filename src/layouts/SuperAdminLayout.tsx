// src/layouts/SuperAdminLayout.tsx
import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import hismaLogo from '../assets/img/hisma_logo_horizontal.png';

// Heroicons específicos para superadmin
import { 
  Bars3Icon, 
  XMarkIcon,
  HomeIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  DocumentChartBarIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  UserIcon,
  ArrowLeftOnRectangleIcon,
  BellIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

// Componente de carga
const LoadingScreen = () => (
  <div className="flex justify-center items-center min-h-screen bg-gray-900">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
  </div>
);

const SuperAdminLayout: React.FC = () => {
  const { currentUser, userProfile, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estados
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  // Verificar que el usuario sea superadmin
  useEffect(() => {
    if (!loading && (!currentUser || !userProfile)) {
      navigate('/login');
      return;
    }
    
    if (!loading && userProfile && userProfile.role !== 'superadmin') {
      // Redirigir a su dashboard correspondiente
      navigate('/dashboard');
      return;
    }
  }, [currentUser, userProfile, navigate, loading]);
  
  // No renderizar nada hasta que se confirme la autenticación
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!currentUser || !userProfile || userProfile.role !== 'superadmin') {
    return null;
  }
  
  // Manejar cierre de sesión
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };
  
  // Menú de navegación específico para superadmin
  const menuItems = [
    { 
      text: 'Panel Principal', 
      icon: <HomeIcon className="w-5 h-5" />, 
      path: '/superadmin/dashboard',
      divider: false
    },
    { 
      text: 'Gestión de Lubricentros', 
      icon: <BuildingOfficeIcon className="w-5 h-5" />, 
      path: '/superadmin/lubricentros',
      divider: false
    },
    { 
      text: 'Usuarios del Sistema', 
      icon: <UserGroupIcon className="w-5 h-5" />, 
      path: '/superadmin/usuarios',
      divider: true
    },
    { 
      text: 'Control de Suscripciones', 
      icon: <CreditCardIcon className="w-5 h-5" />, 
      path: '/superadmin/suscripciones',
      divider: false
    },
    { 
      text: 'Estadísticas Financieras', 
      icon: <CurrencyDollarIcon className="w-5 h-5" />, 
      path: '/superadmin/finanzas',
      divider: false
    },
    { 
      text: 'Reportes Globales', 
      icon: <DocumentChartBarIcon className="w-5 h-5" />, 
      path: '/superadmin/reportes',
      divider: true
    },
    { 
      text: 'Logs del Sistema', 
      icon: <ClipboardDocumentListIcon className="w-5 h-5" />, 
      path: '/superadmin/logs',
      divider: false
    },
    { 
      text: 'Configuración Global', 
      icon: <Cog6ToothIcon className="w-5 h-5" />, 
      path: '/superadmin/configuracion',
      divider: true
    },
    { 
      text: 'Mi Perfil', 
      icon: <UserIcon className="w-5 h-5" />, 
      path: '/superadmin/perfil',
      divider: false
    }
  ];
  
  // Obtener las iniciales del usuario para el avatar
  const getUserInitials = () => {
    if (!userProfile) return 'SA';
    return `${userProfile.nombre.charAt(0)}${userProfile.apellido.charAt(0)}`;
  };
  
  return (
    <div className="h-screen flex overflow-hidden bg-gray-900">
      {/* Sidebar móvil */}
      <div 
        className={`fixed inset-0 z-40 flex md:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}
      >
        {/* Overlay */}
        <div 
          className={`fixed inset-0 bg-gray-900 bg-opacity-90 transition-opacity duration-300 ease-linear
                      ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setSidebarOpen(false)}
        ></div>
        
        {/* Drawer */}
        <div 
          className={`relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-gray-800 transition duration-300 ease-in-out transform
                      ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          {/* Cerrar sidebar */}
          <div className="absolute top-0 right-0 pt-2 pr-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-gray-300" />
            </button>
          </div>
          
          {/* Logo y título */}
          <div className="flex-shrink-0 flex items-center px-4">
            <img src={hismaLogo} alt="HISMA" className="h-8" />
            <div className="ml-3">
              <div className="flex items-center">
                <ShieldCheckIcon className="h-5 w-5 text-blue-400 mr-1" />
                <span className="text-blue-400 font-medium text-sm">SuperAdmin</span>
              </div>
            </div>
          </div>
          
          {/* Menú */}
          <div className="mt-5 flex-1 h-0 overflow-y-auto">
            <nav className="px-2 space-y-1">
              {menuItems.map((item, index) => (
                <React.Fragment key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => 
                      `group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                        isActive 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`
                    }
                    onClick={() => setSidebarOpen(false)}
                  >
                    <div className="mr-4">{item.icon}</div>
                    {item.text}
                  </NavLink>
                  
                  {item.divider && <hr className="border-t border-gray-700 my-2" />}
                </React.Fragment>
              ))}
            </nav>
          </div>
          
          {/* Perfil de usuario */}
          <div className="flex-shrink-0 flex border-t border-gray-700 p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div>
                  {userProfile.photoURL ? (
                    <img
                      className="inline-block h-10 w-10 rounded-full border-2 border-blue-500"
                      src={userProfile.photoURL}
                      alt={`${userProfile.nombre} ${userProfile.apellido}`}
                    />
                  ) : (
                    <div className="inline-flex h-10 w-10 rounded-full bg-blue-600 text-white items-center justify-center border-2 border-blue-500">
                      {getUserInitials()}
                    </div>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-base font-medium text-white">
                    {`${userProfile.nombre} ${userProfile.apellido}`}
                  </p>
                  <p className="text-sm font-medium text-blue-400">
                    Super Administrador
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sidebar desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1">
            <div className="flex items-center justify-center h-16 flex-shrink-0 px-4 bg-gray-800">
              <img src={hismaLogo} alt="HISMA" className="h-8" />
              <div className="ml-3">
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-5 w-5 text-blue-400 mr-1" />
                  <span className="text-blue-400 font-medium text-sm">SuperAdmin</span>
                </div>
              </div>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto bg-gray-800">
              <nav className="flex-1 px-2 py-4 space-y-1">
                {menuItems.map((item, index) => (
                  <React.Fragment key={item.path}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) => 
                        `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                          isActive 
                            ? 'bg-blue-600 text-white' 
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`
                      }
                    >
                      <div className="mr-3 flex-shrink-0">{item.icon}</div>
                      {item.text}
                    </NavLink>
                    
                    {item.divider && <hr className="border-t border-gray-700 my-2" />}
                  </React.Fragment>
                ))}
              </nav>
              
              {/* Botón de logout */}
              <div className="p-4">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <ArrowLeftOnRectangleIcon className="mr-3 flex-shrink-0 h-5 w-5" />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-gray-800 shadow-lg">
          <button
            className="px-4 border-r border-gray-700 text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
              <h1 className="text-lg font-semibold text-white">
                Panel de Super Administración
              </h1>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              {/* Notificaciones */}
              <button className="p-1 rounded-full text-gray-400 hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <BellIcon className="h-6 w-6" />
              </button>
              
              {/* Perfil dropdown */}
              <div className="ml-3 relative">
                <div>
                  <button
                    className="max-w-xs bg-gray-700 flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    {userProfile.photoURL ? (
                      <img
                        className="h-8 w-8 rounded-full border-2 border-blue-500"
                        src={userProfile.photoURL}
                        alt={`${userProfile.nombre} ${userProfile.apellido}`}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center border-2 border-blue-500">
                        {getUserInitials()}
                      </div>
                    )}
                  </button>
                </div>
                
                {userMenuOpen && (
                  <div 
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <div className="block px-4 py-2 text-xs text-gray-400">
                      {`${userProfile.nombre} ${userProfile.apellido}`}
                    </div>
                    <div className="block px-4 py-1 text-xs text-blue-400 border-b border-gray-600 mb-1">
                      Super Administrador
                    </div>
                    <NavLink
                      to="/superadmin/perfil"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
                    >
                      Mi Perfil
                    </NavLink>
                    <NavLink
                      to="/superadmin/configuracion"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
                    >
                      Configuración
                    </NavLink>
                    <div className="border-t border-gray-600"></div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Contenido de la página */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-gray-50">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;