// src/pages/superadmin/SubscriptionManagementPage.tsx - VERSIÓN COMPLETA
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer, Card, CardHeader, CardBody, Button, Alert } from '../../components/ui';
import {
  getAllSubscriptionsOverview,
  getGlobalSubscriptionStats,
  activateSubscriptionForLubricentro,
  deactivateSubscriptionForLubricentro,
  extendTrialForLubricentro,
  SuperAdminSubscriptionOverview,
  GlobalSubscriptionStats
} from '../../services/superAdminSubscriptionService';
import { SUBSCRIPTION_PLANS, SubscriptionPlanType } from '../../types/subscription';

// Iconos
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

// Tipos para filtros
type FilterType = 'all' | 'active' | 'trial' | 'inactive' | 'expiring' | 'needs_attention';
type SortType = 'name' | 'status' | 'created' | 'expiry' | 'revenue';

const SubscriptionManagementPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Estados principales
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<SuperAdminSubscriptionOverview[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<SuperAdminSubscriptionOverview[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalSubscriptionStats | null>(null);
  
  // Estados de interfaz
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [currentSort, setCurrentSort] = useState<SortType>('name');
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<Set<string>>(new Set());
  const [showBatchActions, setShowBatchActions] = useState(false);
  
  // Estados de acciones
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  
  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [subscriptionsData, statsData] = await Promise.all([
          getAllSubscriptionsOverview(),
          getGlobalSubscriptionStats()
        ]);
        
        setSubscriptions(subscriptionsData);
        setGlobalStats(statsData);
        
      } catch (err) {
        console.error('Error al cargar datos de suscripciones:', err);
        setError('Error al cargar los datos. Por favor, intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Aplicar filtros y búsqueda
  useEffect(() => {
    let filtered = subscriptions;
    
    // Aplicar filtros
    switch (currentFilter) {
      case 'active':
        filtered = filtered.filter(sub => sub.estado === 'activo');
        break;
      case 'trial':
        filtered = filtered.filter(sub => sub.estado === 'trial');
        break;
      case 'inactive':
        filtered = filtered.filter(sub => sub.estado === 'inactivo');
        break;
      case 'expiring':
        filtered = filtered.filter(sub => sub.isExpiring);
        break;
      case 'needs_attention':
        filtered = filtered.filter(sub => sub.needsAttention);
        break;
      default:
        break;
    }
    
    // Aplicar búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(sub =>
        sub.fantasyName.toLowerCase().includes(term) ||
        sub.responsable.toLowerCase().includes(term) ||
        sub.email.toLowerCase().includes(term)
      );
    }
    
    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      switch (currentSort) {
        case 'name':
          return a.fantasyName.localeCompare(b.fantasyName);
        case 'status':
          return a.estado.localeCompare(b.estado);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'expiry':
          if (!a.daysRemaining && !b.daysRemaining) return 0;
          if (!a.daysRemaining) return 1;
          if (!b.daysRemaining) return -1;
          return a.daysRemaining - b.daysRemaining;
        case 'revenue':
          return b.monthlyRevenue - a.monthlyRevenue;
        default:
          return 0;
      }
    });
    
    setFilteredSubscriptions(filtered);
  }, [subscriptions, searchTerm, currentFilter, currentSort]);
  
  // Manejar selección de suscripciones
  const handleSelectSubscription = (lubricentroId: string) => {
    const newSelected = new Set(selectedSubscriptions);
    if (newSelected.has(lubricentroId)) {
      newSelected.delete(lubricentroId);
    } else {
      newSelected.add(lubricentroId);
    }
    setSelectedSubscriptions(newSelected);
    setShowBatchActions(newSelected.size > 0);
  };
  
  const handleSelectAll = () => {
    if (selectedSubscriptions.size === filteredSubscriptions.length) {
      setSelectedSubscriptions(new Set());
      setShowBatchActions(false);
    } else {
      setSelectedSubscriptions(new Set(filteredSubscriptions.map(sub => sub.lubricentroId)));
      setShowBatchActions(true);
    }
  };
  
  // Función para recargar datos
  const reloadData = async () => {
    try {
      const updatedData = await getAllSubscriptionsOverview();
      setSubscriptions(updatedData);
    } catch (error) {
      console.error('Error al recargar datos:', error);
    }
  };
  
  // Acciones individuales
  const handleActivateSubscription = async (lubricentroId: string, plan: SubscriptionPlanType) => {
    try {
      setProcessingAction(`activate-${lubricentroId}`);
      await activateSubscriptionForLubricentro(lubricentroId, plan);
      setActionSuccess(`Suscripción activada exitosamente`);
      await reloadData();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al activar suscripción');
    } finally {
      setProcessingAction(null);
      setTimeout(() => setActionSuccess(null), 3000);
    }
  };
  
  const handleDeactivateSubscription = async (lubricentroId: string, reason?: string) => {
    try {
      setProcessingAction(`deactivate-${lubricentroId}`);
      await deactivateSubscriptionForLubricentro(lubricentroId, reason);
      setActionSuccess(`Suscripción desactivada exitosamente`);
      await reloadData();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al desactivar suscripción');
    } finally {
      setProcessingAction(null);
      setTimeout(() => setActionSuccess(null), 3000);
    }
  };
  
  const handleExtendTrial = async (lubricentroId: string, days: number) => {
    try {
      setProcessingAction(`extend-${lubricentroId}`);
      await extendTrialForLubricentro(lubricentroId, days, 'Extensión manual por SuperAdmin');
      setActionSuccess(`Período de prueba extendido por ${days} días`);
      await reloadData();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al extender período de prueba');
    } finally {
      setProcessingAction(null);
      setTimeout(() => setActionSuccess(null), 3000);
    }
  };
  
  // Funciones de utilidad
  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'activo': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-yellow-100 text-yellow-800';
      case 'inactivo': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'activo': return <CheckCircleIcon className="h-4 w-4" />;
      case 'trial': return <ClockIcon className="h-4 w-4" />;
      case 'inactivo': return <XCircleIcon className="h-4 w-4" />;
      default: return <ExclamationTriangleIcon className="h-4 w-4" />;
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (error && !subscriptions.length) {
    return (
      <PageContainer title="Gestión de Suscripciones">
        <Alert type="error">{error}</Alert>
        <div className="mt-4">
          <Button color="primary" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer
      title="Gestión de Suscripciones"
      subtitle="Control centralizado de todas las suscripciones del sistema"
    >
      {/* Alertas */}
      {error && (
        <Alert type="error" className="mb-6" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {actionSuccess && (
        <Alert type="success" className="mb-6" onClose={() => setActionSuccess(null)}>
          {actionSuccess}
        </Alert>
      )}
      
      {/* Estadísticas globales */}
      {globalStats && (
        <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardBody>
              <div className="flex items-center">
                <div className="rounded-full p-3 bg-blue-100 mr-4">
                  <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Lubricentros</p>
                  <p className="text-2xl font-semibold text-gray-800">{globalStats.totalLubricentros}</p>
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
                  <p className="text-2xl font-semibold text-gray-800">{globalStats.activeSubscriptions}</p>
                  <p className="text-xs text-gray-500">
                    Tasa de conversión: {globalStats.conversionRate.toFixed(1)}%
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
                  <p className="text-sm font-medium text-gray-600">En Prueba</p>
                  <p className="text-2xl font-semibold text-gray-800">{globalStats.trialSubscriptions}</p>
                  <p className="text-xs text-yellow-600">
                    {globalStats.expiringTrialsCount} expiran pronto
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
                    {formatCurrency(globalStats.totalMonthlyRevenue)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Promedio: {formatCurrency(globalStats.averageRevenuePerUser)}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
      
      {/* Controles de filtrado y búsqueda */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Búsqueda */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, responsable o email..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            {/* Filtros */}
            <div className="flex flex-wrap gap-2">
              <select
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={currentFilter}
                onChange={(e) => setCurrentFilter(e.target.value as FilterType)}
              >
                <option value="all">Todos los estados</option>
                <option value="active">Solo activos</option>
                <option value="trial">En prueba</option>
                <option value="inactive">Inactivos</option>
                <option value="expiring">Expirando pronto</option>
                <option value="needs_attention">Necesitan atención</option>
              </select>
              
              <select
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={currentSort}
                onChange={(e) => setCurrentSort(e.target.value as SortType)}
              >
                <option value="name">Ordenar por nombre</option>
                <option value="status">Ordenar por estado</option>
                <option value="created">Ordenar por fecha de registro</option>
                <option value="expiry">Ordenar por vencimiento</option>
                <option value="revenue">Ordenar por ingresos</option>
              </select>
            </div>
          </div>
          
          {/* Información de resultados */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              Mostrando {filteredSubscriptions.length} de {subscriptions.length} lubricentros
            </span>
            {selectedSubscriptions.size > 0 && (
              <span className="text-blue-600 font-medium">
                {selectedSubscriptions.size} seleccionados
              </span>
            )}
          </div>
        </CardBody>
      </Card>
      
      {/* Tabla de suscripciones */}
      <Card>
        <CardHeader 
          title={`Suscripciones (${filteredSubscriptions.length})`}
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/superadmin/reportes')}
              icon={<ChartBarIcon className="h-4 w-4" />}
            >
              Ver Reportes
            </Button>
          }
        />
        <CardBody>
          {filteredSubscriptions.length > 0 ? (
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
                      Plan / Vencimiento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ingresos
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubscriptions.map((subscription) => (
                    <tr 
                      key={subscription.lubricentroId} 
                      className={`hover:bg-gray-50 ${subscription.needsAttention ? 'bg-orange-50' : ''}`}
                    >
                      {/* Información del lubricentro */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            {subscription.fantasyName}
                            {subscription.needsAttention && (
                              <ExclamationTriangleIcon className="h-4 w-4 text-orange-500 ml-2" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{subscription.responsable}</div>
                          <div className="text-xs text-gray-400">{subscription.email}</div>
                        </div>
                      </td>
                      
                      {/* Estado */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(subscription.estado)}`}>
                          {getStatusIcon(subscription.estado)}
                          <span className="ml-1 capitalize">{subscription.estado}</span>
                        </span>
                      </td>
                      
                      {/* Plan / Vencimiento */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">
                            {subscription.subscriptionPlan 
                              ? SUBSCRIPTION_PLANS[subscription.subscriptionPlan].name
                              : subscription.estado === 'trial' 
                                ? 'Período de Prueba'
                                : 'Sin plan'
                            }
                          </div>
                          {subscription.daysRemaining !== undefined && (
                            <div className={`text-xs ${subscription.isExpiring ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                              {subscription.daysRemaining > 0 
                                ? `${subscription.daysRemaining} días restantes`
                                : 'Expirado'
                              }
                            </div>
                          )}
                        </div>
                      </td>
                      
                      {/* Uso */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>{subscription.servicesUsedThisMonth} servicios</div>
                          <div className="text-xs text-gray-500">{subscription.activeUserCount} usuarios</div>
                        </div>
                      </td>
                      
                      {/* Ingresos */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium">
                          {subscription.monthlyRevenue > 0 
                            ? formatCurrency(subscription.monthlyRevenue)
                            : '-'
                          }
                        </div>
                        <div className="text-xs text-gray-500">mensual</div>
                      </td>
                      
                      {/* Acciones */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {/* Ver detalles */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/superadmin/lubricentros/${subscription.lubricentroId}`)}
                            icon={<EyeIcon className="h-3 w-3" />}
                          >
                            Ver
                          </Button>
                          
                          {/* Acciones según estado */}
                          {subscription.estado === 'trial' && (
                            <>
                              <Button
                                size="sm"
                                color="success"
                                onClick={() => handleActivateSubscription(subscription.lubricentroId, 'basic')}
                                disabled={processingAction === `activate-${subscription.lubricentroId}`}
                                icon={processingAction === `activate-${subscription.lubricentroId}` 
                                  ? <ArrowPathIcon className="h-3 w-3 animate-spin" />
                                  : <PlayIcon className="h-3 w-3" />
                                }
                              >
                                Activar
                              </Button>
                              
                              <Button
                                size="sm"
                                color="warning"
                                onClick={() => handleExtendTrial(subscription.lubricentroId, 7)}
                                disabled={processingAction === `extend-${subscription.lubricentroId}`}
                                icon={processingAction === `extend-${subscription.lubricentroId}` 
                                  ? <ArrowPathIcon className="h-3 w-3 animate-spin" />
                                  : <CalendarIcon className="h-3 w-3" />
                                }
                              >
                                +7d
                              </Button>
                            </>
                          )}
                          
                          {subscription.estado === 'activo' && (
                            <Button
                              size="sm"
                              color="error"
                              onClick={() => handleDeactivateSubscription(subscription.lubricentroId, 'Desactivación manual por SuperAdmin')}
                              disabled={processingAction === `deactivate-${subscription.lubricentroId}`}
                              icon={processingAction === `deactivate-${subscription.lubricentroId}` 
                                ? <ArrowPathIcon className="h-3 w-3 animate-spin" />
                                : <StopIcon className="h-3 w-3" />
                              }
                            >
                              Desactivar
                            </Button>
                          )}
                          
                          {subscription.estado === 'inactivo' && (
                            <Button
                              size="sm"
                              color="success"
                              onClick={() => handleActivateSubscription(subscription.lubricentroId, 'basic')}
                              disabled={processingAction === `activate-${subscription.lubricentroId}`}
                              icon={processingAction === `activate-${subscription.lubricentroId}` 
                                ? <ArrowPathIcon className="h-3 w-3 animate-spin" />
                                : <PlayIcon className="h-3 w-3" />
                              }
                            >
                              Reactivar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron suscripciones</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || currentFilter !== 'all' 
                  ? 'Intenta ajustar los filtros de búsqueda.'
                  : 'No hay lubricentros registrados en el sistema.'
                }
              </p>
            </div>
          )}
        </CardBody>
      </Card>
    </PageContainer>
  );
};

export default SubscriptionManagementPage;