// src/pages/superadmin/SuperAdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageContainer, Card, CardHeader, CardBody, Button, Alert, Spinner } from '../../components/ui';
import { getAllLubricentros } from '../../services/lubricentroService';
import { Lubricentro } from '../../types';
import { SUBSCRIPTION_PLANS } from '../../types/subscription';

// Recharts para gráficos
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

// Iconos específicos para superadmin
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

// Colores para gráficos
const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

// Componente de carga
const LoadingScreen = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
  </div>
);

interface DashboardStats {
  totalLubricentros: number;
  activeLubricentros: number;
  trialLubricentros: number;
  inactiveLubricentros: number;
  totalUsers: number;
  totalRevenue: number;
  monthlyGrowth: number;
  expiringTrials: Lubricentro[];
  recentRegistrations: Lubricentro[];
}

const SuperAdminDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lubricentros, setLubricentros] = useState<Lubricentro[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const allLubricentros = await getAllLubricentros();
        setLubricentros(allLubricentros);
        
        // Calcular estadísticas
        const activeLubricentros = allLubricentros.filter(lub => lub.estado === 'activo');
        const trialLubricentros = allLubricentros.filter(lub => lub.estado === 'trial');
        const inactiveLubricentros = allLubricentros.filter(lub => lub.estado === 'inactivo');
        
        // Calcular trials que expiran pronto (próximos 7 días)
        const today = new Date();
        const in7Days = new Date();
        in7Days.setDate(today.getDate() + 7);
        
        const expiringTrials = trialLubricentros.filter(lub => {
          if (!lub.trialEndDate) return false;
          const endDate = new Date(lub.trialEndDate);
          return endDate >= today && endDate <= in7Days;
        });
        
        // Registros recientes (últimos 30 días)
        const last30Days = new Date();
        last30Days.setDate(today.getDate() - 30);
        
        const recentRegistrations = allLubricentros
          .filter(lub => new Date(lub.createdAt) >= last30Days)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        
        // Simular algunos datos financieros (en una implementación real vendrían de la base de datos)
        const totalRevenue = activeLubricentros.reduce((total, lub) => {
          if (lub.subscriptionPlan && SUBSCRIPTION_PLANS[lub.subscriptionPlan]) {
            return total + SUBSCRIPTION_PLANS[lub.subscriptionPlan].price.monthly;
          }
          return total;
        }, 0);
        
        const dashboardStats: DashboardStats = {
          totalLubricentros: allLubricentros.length,
          activeLubricentros: activeLubricentros.length,
          trialLubricentros: trialLubricentros.length,
          inactiveLubricentros: inactiveLubricentros.length,
          totalUsers: allLubricentros.reduce((total, lub) => total + (lub.activeUserCount || 1), 0),
          totalRevenue,
          monthlyGrowth: recentRegistrations.length, // Simplificado
          expiringTrials,
          recentRegistrations
        };
        
        setStats(dashboardStats);
        
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
        setError('Error al cargar los datos. Por favor, intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (error || !stats) {
    return (
      <div className="p-4">
        <Alert type="error">
          {error || 'No se pudo cargar la información del dashboard.'}
        </Alert>
        <div className="mt-4">
          <Button color="primary" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }
  
  // Datos para gráficos
  const statusData = [
    { name: 'Activos', value: stats.activeLubricentros, color: '#10b981' },
    { name: 'En Prueba', value: stats.trialLubricentros, color: '#f59e0b' },
    { name: 'Inactivos', value: stats.inactiveLubricentros, color: '#ef4444' },
  ];
  
  const planDistribution = Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => {
    const count = lubricentros.filter(lub => lub.subscriptionPlan === key).length;
    return {
      name: plan.name,
      value: count,
      revenue: count * plan.price.monthly
    };
  }).filter(item => item.value > 0);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };
  
  const formatDate = (date: any): string => {
    if (!date) return 'No disponible';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('es-ES');
  };
  
  return (
    <PageContainer
      title="Dashboard de Super Administración"
      subtitle={`Bienvenido, ${userProfile?.nombre} ${userProfile?.apellido}`}
    >
      {/* Alertas importantes */}
      {stats.expiringTrials.length > 0 && (
        <Alert type="warning" className="mb-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
            <span>
              Hay {stats.expiringTrials.length} lubricentro{stats.expiringTrials.length !== 1 ? 's' : ''} con 
              período de prueba expirando en los próximos 7 días.
            </span>
            <Button 
              size="sm" 
              color="warning" 
              className="ml-4"
              onClick={() => navigate('/superadmin/lubricentros?filter=expiring')}
            >
              Ver Detalles
            </Button>
          </div>
        </Alert>
      )}
      
      {/* Métricas principales */}
      <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="rounded-full p-3 bg-blue-100 mr-4">
                <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Lubricentros</p>
                <p className="text-2xl font-semibold text-gray-800">{stats.totalLubricentros}</p>
                <div className="flex items-center mt-1">
                  <ArrowUpIcon className="h-4 w-4 text-green-500" />
                  <span className="text-xs font-medium text-green-500">
                    +{stats.monthlyGrowth} este mes
                  </span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="rounded-full p-3 bg-green-100 mr-4">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Suscripciones Activas</p>
                <p className="text-2xl font-semibold text-gray-800">{stats.activeLubricentros}</p>
                <p className="text-xs text-gray-500">
                  {((stats.activeLubricentros / stats.totalLubricentros) * 100).toFixed(1)}% del total
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="rounded-full p-3 bg-yellow-100 mr-4">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">En Período de Prueba</p>
                <p className="text-2xl font-semibold text-gray-800">{stats.trialLubricentros}</p>
                <p className="text-xs text-yellow-600">
                  {stats.expiringTrials.length} expiran pronto
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="rounded-full p-3 bg-green-100 mr-4">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Mensuales</p>
                <p className="text-2xl font-semibold text-gray-800">
                  {formatCurrency(stats.totalRevenue)}
                </p>
                <p className="text-xs text-green-600">Ingresos recurrentes</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      
      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Distribución por Estado" subtitle="Estado actual de los lubricentros" />
          <CardBody>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} lubricentros`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardHeader title="Distribución por Planes" subtitle="Ingresos por tipo de suscripción" />
          <CardBody>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={planDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [
                    name === 'value' ? `${value} suscripciones` : formatCurrency(value as number),
                    name === 'value' ? 'Cantidad' : 'Ingresos Mensuales'
                  ]} />
                  <Legend />
                  <Bar dataKey="value" name="Cantidad" fill="#3b82f6" />
                  <Bar dataKey="revenue" name="Ingresos" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>
      
      {/* Tablas de información */}
      <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-2">
        {/* Trials expirando */}
        <Card>
          <CardHeader
            title="Períodos de Prueba por Vencer"
            subtitle="Lubricentros que requieren atención"
            action={
              <Button 
                size="sm" 
                variant="outline" 
                color="warning" 
                onClick={() => navigate('/superadmin/lubricentros?filter=expiring')}
              >
                Ver Todos
              </Button>
            }
          />
          <CardBody>
            {stats.expiringTrials.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lubricentro
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expira
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.expiringTrials.slice(0, 5).map((lub) => {
                      const daysRemaining = Math.ceil(
                        (new Date(lub.trialEndDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                      );
                      return (
                        <tr key={lub.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {lub.fantasyName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              daysRemaining <= 2 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {daysRemaining} día{daysRemaining !== 1 ? 's' : ''}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex space-x-2">
                              <Button 
                                size="xs" 
                                color="primary"
                                onClick={() => navigate(`/superadmin/lubricentros/${lub.id}`)}
                              >
                                <EyeIcon className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="xs" 
                                color="success"
                                onClick={() => navigate(`/superadmin/suscripciones/${lub.id}`)}
                              >
                                Activar
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex justify-center items-center py-8">
                <div className="text-center">
                  <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-500">No hay períodos de prueba expirando pronto</p>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
        
        {/* Registros recientes */}
        <Card>
          <CardHeader
            title="Registros Recientes"
            subtitle="Últimos lubricentros registrados"
            action={
              <Button 
                size="sm" 
                variant="outline" 
                color="primary" 
                onClick={() => navigate('/superadmin/lubricentros?filter=recent')}
              >
                Ver Todos
              </Button>
            }
          />
          <CardBody>
            {stats.recentRegistrations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lubricentro
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registro
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.recentRegistrations.map((lub) => (
                      <tr key={lub.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {lub.fantasyName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            lub.estado === 'activo' 
                              ? 'bg-green-100 text-green-800'
                              : lub.estado === 'trial'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {lub.estado === 'activo' ? 'Activo' : 
                             lub.estado === 'trial' ? 'Prueba' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(lub.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <Button 
                            size="xs" 
                            color="primary"
                            onClick={() => navigate(`/superadmin/lubricentros/${lub.id}`)}
                          >
                            <EyeIcon className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex justify-center items-center py-8">
                <p className="text-gray-500">No hay registros recientes</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
      
      {/* Acciones rápidas */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Button 
          color="primary" 
          size="lg" 
          fullWidth 
          icon={<PlusIcon className="h-5 w-5" />} 
          onClick={() => navigate('/superadmin/lubricentros/nuevo')}
        >
          Nuevo Lubricentro
        </Button>
        
        <Button 
          color="secondary" 
          size="lg" 
          fullWidth 
          icon={<UserGroupIcon className="h-5 w-5" />} 
          onClick={() => navigate('/superadmin/usuarios')}
        >
          Gestionar Usuarios
        </Button>
        
        <Button 
          color="success" 
          size="lg" 
          fullWidth 
          icon={<CurrencyDollarIcon className="h-5 w-5" />} 
          onClick={() => navigate('/superadmin/suscripciones')}
        >
          Control Suscripciones
        </Button>
        
        <Button 
          color="info" 
          size="lg" 
          fullWidth 
          icon={<ChartBarIcon className="h-5 w-5" />} 
          onClick={() => navigate('/superadmin/reportes')}
        >
          Reportes Globales
        </Button>
      </div>
    </PageContainer>
  );
};

export default SuperAdminDashboard;