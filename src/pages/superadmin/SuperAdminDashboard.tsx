// src/pages/superadmin/SuperAdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Usando tipos coherentes con el proyecto
interface DashboardStats {
  totalLubricentros: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  inactiveSubscriptions: number;
  totalRevenue: number;
  monthlyRevenue: number;
  needingAttention: number;
  newThisMonth: number;
}

interface LubricentroOverview {
  id: string;
  fantasyName: string;
  responsable: string;
  estado: 'activo' | 'inactivo' | 'trial';
  subscriptionPlan: string;
  servicesUsedThisMonth: number;
  servicesLimit: number;
  subscriptionEndDate: Date;
  daysUntilExpiration: number;
  monthlyRevenue: number;
}

export const SuperAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalLubricentros: 0,
    activeSubscriptions: 0,
    trialSubscriptions: 0,
    inactiveSubscriptions: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    needingAttention: 0,
    newThisMonth: 0
  });
  
  const [recentOverviews, setRecentOverviews] = useState<LubricentroOverview[]>([]);
  const [needingAttention, setNeedingAttention] = useState<LubricentroOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Simulación de datos hasta que se conecte con el servicio real
      const mockOverviews: LubricentroOverview[] = [
        {
          id: 'lub1',
          fantasyName: 'Lubricentro Centro',
          responsable: 'Juan Pérez',
          estado: 'activo',
          subscriptionPlan: 'premium',
          servicesUsedThisMonth: 245,
          servicesLimit: 500,
          subscriptionEndDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          daysUntilExpiration: 15,
          monthlyRevenue: 19900
        },
        {
          id: 'lub2',
          fantasyName: 'Lubricentro Norte',
          responsable: 'María García',
          estado: 'trial',
          subscriptionPlan: 'basic',
          servicesUsedThisMonth: 25,
          servicesLimit: 100,
          subscriptionEndDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          daysUntilExpiration: 2,
          monthlyRevenue: 0
        },
        {
          id: 'lub3',
          fantasyName: 'Lubricentro Sur',
          responsable: 'Carlos López',
          estado: 'activo',
          subscriptionPlan: 'basic',
          servicesUsedThisMonth: 89,
          servicesLimit: 100,
          subscriptionEndDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
          daysUntilExpiration: 25,
          monthlyRevenue: 9900
        }
      ];
      
      // Calcular estadísticas
      const newStats: DashboardStats = {
        totalLubricentros: mockOverviews.length,
        activeSubscriptions: mockOverviews.filter(o => o.estado === 'activo').length,
        trialSubscriptions: mockOverviews.filter(o => o.estado === 'trial').length,
        inactiveSubscriptions: mockOverviews.filter(o => o.estado === 'inactivo').length,
        totalRevenue: mockOverviews.reduce((sum, o) => sum + o.monthlyRevenue, 0),
        monthlyRevenue: mockOverviews
          .filter(o => o.estado === 'activo')
          .reduce((sum, o) => sum + o.monthlyRevenue, 0),
        needingAttention: mockOverviews.filter(o => o.daysUntilExpiration <= 3).length,
        newThisMonth: 2
      };
      
      setStats(newStats);
      
      // Obtener lubricentros que necesitan atención
      const attention = mockOverviews
        .filter(o => o.daysUntilExpiration <= 3)
        .sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);
      setNeedingAttention(attention);
      
      // Obtener actividad reciente
      const recent = mockOverviews
        .sort((a, b) => new Date(b.subscriptionEndDate).getTime() - new Date(a.subscriptionEndDate).getTime());
      setRecentOverviews(recent);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (estado: string) => {
    const iconClass = "h-4 w-4";
    switch (estado) {
      case 'activo':
        return <span className={`${iconClass} text-green-600`}>✓</span>;
      case 'trial':
        return <span className={`${iconClass} text-orange-600`}>⏱</span>;
      case 'inactivo':
        return <span className={`${iconClass} text-red-600`}>✗</span>;
      default:
        return <span className={`${iconClass} text-gray-600`}>?</span>;
    }
  };

  const getStatusBadge = (estado: string) => {
    const baseClass = "px-2 py-1 rounded-full text-xs font-medium";
    const variants = {
      activo: 'bg-green-100 text-green-800',
      trial: 'bg-orange-100 text-orange-800',
      inactivo: 'bg-red-100 text-red-800'
    };
    
    const labels = {
      activo: 'Activo',
      trial: 'Prueba',
      inactivo: 'Inactivo'
    };

    return (
      <span className={`${baseClass} ${variants[estado as keyof typeof variants] || 'bg-gray-100 text-gray-800'}`}>
        {labels[estado as keyof typeof labels] || estado}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard SuperAdmin</h1>
          <p className="text-gray-600 mt-1">Resumen general del sistema HISMA</p>
        </div>
        
        <div className="flex space-x-3">
          <Link
            to="/superadmin/subscriptions"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <span className="mr-2">👥</span>
            Gestionar Suscripciones
          </Link>
          
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <span className="mr-2">📄</span>
            Generar Reporte
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <span className="text-red-400 mr-3">⚠</span>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Lubricentros</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalLubricentros}</p>
              <p className="text-sm text-green-600 mt-1">
                +{stats.newThisMonth} este mes
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <span className="text-blue-600 text-2xl">🏢</span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Suscripciones Activas</p>
              <p className="text-3xl font-bold text-green-600">{stats.activeSubscriptions}</p>
              <p className="text-sm text-gray-500 mt-1">
                {((stats.activeSubscriptions / stats.totalLubricentros) * 100 || 0).toFixed(1)}% del total
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <span className="text-green-600 text-2xl">✓</span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Período de Prueba</p>
              <p className="text-3xl font-bold text-orange-600">{stats.trialSubscriptions}</p>
              <p className="text-sm text-gray-500 mt-1">
                Próximos a convertir
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <span className="text-orange-600 text-2xl">⏱</span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ingresos Mensuales</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.monthlyRevenue)}</p>
              <p className="text-sm text-gray-500 mt-1">
                {formatCurrency(stats.totalRevenue)} total
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <span className="text-green-600 text-2xl">💰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas y Acciones Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lubricentros que necesitan atención */}
        <div className="lg:col-span-2 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Requieren Atención</h3>
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
                {stats.needingAttention}
              </span>
            </div>
          </div>
          <div className="p-6">
            {needingAttention.length > 0 ? (
              <div className="space-y-3">
                {needingAttention.map((lubricentro) => (
                  <div key={lubricentro.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center space-x-3">
                      <span className="text-red-600 text-xl">⚠</span>
                      <div>
                        <p className="font-medium text-gray-900">{lubricentro.fantasyName}</p>
                        <p className="text-sm text-gray-600">{lubricentro.responsable}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-600">
                        {lubricentro.daysUntilExpiration > 0 
                          ? `${lubricentro.daysUntilExpiration} días restantes`
                          : `Vencido hace ${Math.abs(lubricentro.daysUntilExpiration)} días`
                        }
                      </p>
                      <div className="flex space-x-2 mt-1">
                        <button className="px-3 py-1 text-xs border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">
                          👁 Ver
                        </button>
                        <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700">
                          ⚙ Gestionar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="text-green-500 text-6xl">✓</span>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Todo en orden</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No hay lubricentros que requieran atención inmediata.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Acciones Rápidas</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <Link
                to="/superadmin/subscriptions"
                className="w-full flex items-center justify-start px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <span className="mr-2">👥</span>
                Gestionar Suscripciones
              </Link>
              
              <Link
                to="/superadmin/lubricentros"
                className="w-full flex items-center justify-start px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <span className="mr-2">📊</span>
                Ver Todos los Lubricentros
              </Link>
              
              <button className="w-full flex items-center justify-start px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <span className="mr-2">📄</span>
                Generar Reporte Mensual
              </button>
              
              <button className="w-full flex items-center justify-start px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <span className="mr-2">⚙</span>
                Configuración del Sistema
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Actividad Reciente */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Actividad Reciente</h3>
            <Link
              to="/superadmin/subscriptions"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 text-sm"
            >
              Ver Todo
            </Link>
          </div>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-gray-700">Lubricentro</th>
                  <th className="text-left py-2 font-medium text-gray-700">Estado</th>
                  <th className="text-left py-2 font-medium text-gray-700">Plan</th>
                  <th className="text-left py-2 font-medium text-gray-700">Servicios</th>
                  <th className="text-left py-2 font-medium text-gray-700">Vencimiento</th>
                  <th className="text-left py-2 font-medium text-gray-700">Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {recentOverviews.slice(0, 8).map((overview) => (
                  <tr key={overview.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">
                      <div>
                        <p className="font-medium text-gray-900">{overview.fantasyName}</p>
                        <p className="text-sm text-gray-500">{overview.responsable}</p>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(overview.estado)}
                        {getStatusBadge(overview.estado)}
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="capitalize text-sm">{overview.subscriptionPlan}</span>
                    </td>
                    <td className="py-3">
                      <div className="text-sm">
                        {overview.servicesUsedThisMonth} / {overview.servicesLimit === -1 ? '∞' : overview.servicesLimit}
                      </div>
                      <div className="w-16 bg-gray-200 rounded-full h-1 mt-1">
                        <div 
                          className="bg-blue-600 h-1 rounded-full" 
                          style={{ 
                            width: overview.servicesLimit === -1 
                              ? '0%' 
                              : `${Math.min((overview.servicesUsedThisMonth / overview.servicesLimit) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="text-sm">{formatDate(overview.subscriptionEndDate)}</div>
                      <div className={`text-xs ${overview.daysUntilExpiration <= 3 ? 'text-red-600' : 'text-gray-500'}`}>
                        {overview.daysUntilExpiration > 0 
                          ? `${overview.daysUntilExpiration} días`
                          : `Vencido`
                        }
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="text-sm font-medium">
                        {formatCurrency(overview.monthlyRevenue)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {recentOverviews.length === 0 && (
              <div className="text-center py-8">
                <span className="text-gray-400 text-6xl">📊</span>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Sin actividad</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No hay actividad reciente para mostrar.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
