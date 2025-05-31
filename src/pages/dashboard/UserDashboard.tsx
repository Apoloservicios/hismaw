// src/pages/dashboard/UserDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageContainer, Card, CardHeader, CardBody, Button, Alert, Spinner } from '../../components/ui';
import { getLubricentroById } from '../../services/lubricentroService';
import { getOilChangesStats, getUpcomingOilChanges, getOilChangesByLubricentro } from '../../services/oilChangeService';
import { getUsersByLubricentro, getUsersOperatorStats } from '../../services/userService';
import { Lubricentro, OilChangeStats, User, OilChange, OperatorStats } from '../../types';
// ✅ USAR SERVICIO UNIFICADO
import { getSubscriptionLimits, SubscriptionLimits } from '../../services/unifiedSubscriptionService';
import { SUBSCRIPTION_PLANS } from '../../types/subscription';

// Recharts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Iconos
import {
  PlusIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CalendarDaysIcon,
  WrenchIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// Importar el componente actualizado
import TrialInfoCard from '../../components/dashboard/TrialInfoCard';

// Componente de carga
const LoadingScreen = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
  </div>
);

// Dashboard Selector
const UserDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  
  if (!userProfile) {
    return <LoadingScreen />;
  }
  
  switch (userProfile.role) {
    case 'admin':
      return <OwnerDashboard />;
    case 'user':
      return <EmployeeDashboard />;
    default:
      return <EmployeeDashboard />;
  }
};

// Dashboard para el dueño del lubricentro (admin)
const OwnerDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lubricentro, setLubricentro] = useState<Lubricentro | null>(null);
  const [stats, setStats] = useState<OilChangeStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [upcomingOilChanges, setUpcomingOilChanges] = useState<OilChange[]>([]);
  const [operatorStats, setOperatorStats] = useState<OperatorStats[]>([]);
  const [subscriptionLimits, setSubscriptionLimits] = useState<SubscriptionLimits | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!userProfile?.lubricentroId) {
          setError('No se encontró información del lubricentro asociado a su cuenta.');
          return;
        }
        
        const lubricentroId = userProfile.lubricentroId;
        
        // Cargar datos en paralelo
        const [
          lubricentroData,
          oilChangeStats,
          usersData,
          upcomingChanges,
          subscriptionLimitsData
        ] = await Promise.all([
          getLubricentroById(lubricentroId),
          getOilChangesStats(lubricentroId),
          getUsersByLubricentro(lubricentroId),
          getUpcomingOilChanges(lubricentroId, 30),
          getSubscriptionLimits(lubricentroId)
        ]);
        
        setLubricentro(lubricentroData);
        setStats(oilChangeStats);
        setUsers(usersData);
        setUpcomingOilChanges(upcomingChanges.slice(0, 5));
        setSubscriptionLimits(subscriptionLimitsData);
        
        // Cargar estadísticas de operadores
        const today = new Date();
        const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        const operatorData = await getUsersOperatorStats(lubricentroId, firstDayThisMonth, lastDayThisMonth);
        setOperatorStats(operatorData);
        
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
        setError('Error al cargar los datos. Por favor, intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [userProfile]);
  
  const formatDate = (date: any): string => {
    if (!date) return 'No disponible';
    
    try {
      const dateObj = typeof date.toDate === 'function' ? date.toDate() : new Date(date);
      
      if (isNaN(dateObj.getTime())) {
        return 'Fecha inválida';
      }
      
      return dateObj.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };
  
  const calculatePercentChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (error || !lubricentro || !stats) {
    return (
      <div className="p-4">
        <Alert type="error">
          {error || 'No se pudo cargar la información del lubricentro.'}
        </Alert>
        <div className="mt-4">
          <Button color="primary" onClick={() => navigate('/login')}>
            Volver a iniciar sesión
          </Button>
        </div>
      </div>
    );
  }
  
  const monthlyChange = calculatePercentChange(stats.thisMonth, stats.lastMonth);
  
  return (
    <PageContainer
      title={`Dashboard de ${lubricentro.fantasyName}`}
      subtitle={`Bienvenido, ${userProfile?.nombre} ${userProfile?.apellido}`}
    >
      {/* ✅ USAR COMPONENTE ACTUALIZADO */}
      <TrialInfoCard lubricentro={lubricentro} stats={stats} />

      {/* Métricas principales */}
      <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="rounded-full p-3 bg-green-100 mr-4">
                <WrenchIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Cambios</p>
                <p className="text-2xl font-semibold text-gray-800">{stats.total}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="rounded-full p-3 bg-blue-100 mr-4">
                <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Cambios este Mes</p>
                <p className="text-2xl font-semibold text-gray-800">{stats.thisMonth}</p>
                <div className="flex items-center mt-1">
                  {monthlyChange >= 0 ? (
                    <ArrowUpIcon className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-xs font-medium ${monthlyChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {monthlyChange.toFixed(1)}% vs mes anterior
                  </span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="rounded-full p-3 bg-purple-100 mr-4">
                <UserGroupIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Empleados</p>
                <p className="text-2xl font-semibold text-gray-800">{users.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="rounded-full p-3 bg-yellow-100 mr-4">
                <CalendarDaysIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Próximos 30 días</p>
                <p className="text-2xl font-semibold text-gray-800">{stats.upcoming30Days}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Rendimiento de Operadores (Mes Actual)" />
          <CardBody>
            <div className="h-80">
              {operatorStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={operatorStats} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="operatorName" angle={-45} textAnchor="end" height={70} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Cambios Realizados" fill="#4caf50" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-full">
                  <p className="text-gray-500">No hay datos de operadores para mostrar</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardHeader title="Comparativa Mensual" />
          <CardBody>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Mes Pasado', value: stats.lastMonth },
                    { name: 'Mes Actual', value: stats.thisMonth },
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Cambios de Aceite" fill="#4caf50" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>
      
      {/* Información detallada */}
      <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Próximos Servicios"
            subtitle="Clientes que deberían volver pronto"
            action={
              <Button size="sm" variant="outline" color="primary" onClick={() => navigate('/proximos-servicios')}>
                Ver Todos
              </Button>
            }
          />
          <CardBody>
            {upcomingOilChanges.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehículo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dominio</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Próximo</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {upcomingOilChanges.map((change) => (
                      <tr key={change.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{change.nombreCliente}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{`${change.marcaVehiculo} ${change.modeloVehiculo}`}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{change.dominioVehiculo}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(change.fechaProximoCambio)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex justify-center items-center py-8">
                <p className="text-gray-500">No hay próximos servicios programados</p>
              </div>
            )}
          </CardBody>
        </Card>
        
        <Card>
          <CardHeader title="Mi Suscripción" subtitle="Información de tu plan actual" />
          <CardBody>
            {subscriptionLimits ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-primary-50 p-4 rounded-lg">
                  <h3 className="font-medium text-primary-700">Plan Actual</h3>
                  <p className="text-xl font-bold text-primary-800">
                    {subscriptionLimits.planName}
                  </p>
                  {subscriptionLimits.daysRemaining !== undefined && (
                    <p className="text-sm text-primary-600 mt-1">
                      {subscriptionLimits.daysRemaining > 0 
                        ? `(${subscriptionLimits.daysRemaining} días restantes)` 
                        : '(Expirado)'}
                    </p>
                  )}
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-700">Usuarios</h3>
                  <div className="flex items-baseline">
                    <p className="text-xl font-bold text-blue-800">{subscriptionLimits.currentUsers}</p>
                    <p className="text-sm text-blue-600 ml-1">/ {subscriptionLimits.maxUsers}</p>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min(100, (subscriptionLimits.currentUsers / subscriptionLimits.maxUsers) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg md:col-span-2">
                  <h3 className="font-medium text-green-700">Servicios Mensuales</h3>
                  <div className="flex items-baseline">
                    <p className="text-xl font-bold text-green-800">{subscriptionLimits.currentServices}</p>
                    <p className="text-sm text-green-600 ml-1">
                      / {subscriptionLimits.isUnlimited ? '∞' : subscriptionLimits.maxServices}
                    </p>
                  </div>
                  
                  {!subscriptionLimits.isUnlimited && subscriptionLimits.maxServices && (
                    <div className="mt-2 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full"
                        style={{ 
                          width: `${Math.min(100, (subscriptionLimits.currentServices / subscriptionLimits.maxServices) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  )}
                  
                  <p className="text-xs text-green-600 mt-1">
                    {subscriptionLimits.isUnlimited ? 'Servicios ilimitados' : 'Cambios de aceite registrados este mes'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
      
      {/* Acciones rápidas */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Button color="primary" size="lg" fullWidth icon={<PlusIcon className="h-5 w-5" />} onClick={() => navigate('/cambios-aceite/nuevo')}>
          Nuevo Cambio
        </Button>
        <Button color="secondary" size="lg" fullWidth icon={<ClipboardDocumentListIcon className="h-5 w-5" />} onClick={() => navigate('/cambios-aceite')}>
          Ver Historial
        </Button>
        <Button color="success" size="lg" fullWidth icon={<UserGroupIcon className="h-5 w-5" />} onClick={() => navigate('/usuarios')}>
          Gestionar Empleados
        </Button>
        <Button color="info" size="lg" fullWidth icon={<ChartBarIcon className="h-5 w-5" />} onClick={() => navigate('/reportes')}>
          Generar Reportes
        </Button>
      </div>
    </PageContainer>
  );
};

// Dashboard para empleados
const EmployeeDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lubricentro, setLubricentro] = useState<Lubricentro | null>(null);
  const [recentOilChanges, setRecentOilChanges] = useState<OilChange[]>([]);
  const [userOilChanges, setUserOilChanges] = useState<OilChange[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!userProfile || !userProfile.lubricentroId) {
          setError('No se encontró información del lubricentro asociado a su cuenta.');
          return;
        }
        
        const lubricentroId = userProfile.lubricentroId;
        const lubricentroData = await getLubricentroById(lubricentroId);
        setLubricentro(lubricentroData);
        
        const { oilChanges } = await getOilChangesByLubricentro(lubricentroId, 5);
        setRecentOilChanges(oilChanges);
        
        if (userProfile.id) {
          const userChanges = oilChanges.filter(change => change.operatorId === userProfile.id);
          setUserOilChanges(userChanges);
        }
        
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
        setError('Error al cargar los datos. Por favor, intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [userProfile]);
  
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  if (loading) return <LoadingScreen />;
  
  if (error || !lubricentro) {
    return (
      <div className="p-4">
        <Alert type="error">{error || 'No se pudo cargar la información del lubricentro.'}</Alert>
        <div className="mt-4">
          <Button color="primary" onClick={() => navigate('/login')}>Volver a iniciar sesión</Button>
        </div>
      </div>
    );
  }
  
  return (
    <PageContainer title={`Bienvenido, ${userProfile?.nombre}`} subtitle={`${lubricentro.fantasyName}`}>
      <Card className="mb-6">
        <CardBody>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
          <div className="flex flex-wrap gap-4">
            <Button color="primary" icon={<PlusIcon className="h-5 w-5" />} onClick={() => navigate('/cambios-aceite/nuevo')}>
              Nuevo Cambio
            </Button>
            <Button color="secondary" icon={<ClipboardDocumentListIcon className="h-5 w-5" />} onClick={() => navigate('/cambios-aceite')}>
              Historial
            </Button>
            <Button color="info" icon={<CalendarDaysIcon className="h-5 w-5" />} onClick={() => navigate('/proximos-servicios')}>
              Próximos Servicios
            </Button>
          </div>
        </CardBody>
      </Card>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Mis Últimos Registros" subtitle="Cambios de aceite que has registrado" />
          <CardBody>
            {userOilChanges.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nº</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dominio</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userOilChanges.map((change) => (
                      <tr key={change.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/cambios-aceite/${change.id}`)}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{change.nroCambio}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(change.fecha)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{change.nombreCliente}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{change.dominioVehiculo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-gray-500">No has registrado cambios de aceite recientemente</p>
                <Button color="primary" size="sm" className="mt-4" onClick={() => navigate('/cambios-aceite/nuevo')}>
                  Registrar Nuevo Cambio
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
        
        <Card>
          <CardHeader title="Actividad Reciente" subtitle="Últimos cambios registrados en el lubricentro" />
          <CardBody>
            {recentOilChanges.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nº</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operario</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentOilChanges.map((change) => (
                      <tr key={change.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/cambios-aceite/${change.id}`)}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{change.nroCambio}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(change.fecha)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{change.nombreCliente}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{change.nombreOperario}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex justify-center items-center py-8">
                <p className="text-gray-500">No hay cambios de aceite recientes</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
      
      <div className="mt-6">
        <Card>
          <CardHeader title="Información del Lubricentro" />
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="px-4 py-2 bg-gray-50 rounded">
                <p className="text-xs text-gray-500">Nombre</p>
                <p className="text-sm font-medium text-gray-900">{lubricentro.fantasyName}</p>
              </div>
              <div className="px-4 py-2 bg-gray-50 rounded">
                <p className="text-xs text-gray-500">Dirección</p>
                <p className="text-sm font-medium text-gray-900">{lubricentro.domicilio}</p>
              </div>
              <div className="px-4 py-2 bg-gray-50 rounded">
                <p className="text-xs text-gray-500">Teléfono</p>
                <p className="text-sm font-medium text-gray-900">{lubricentro.phone}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </PageContainer>
  );
};

export default UserDashboard;