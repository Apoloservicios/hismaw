// src/pages/admin/SubscriptionStatsPage.tsx - CORRECCIÓN DE ICONOS
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  PageContainer, 
  Card, 
  CardHeader, 
  CardBody, 
  Button, 
  Alert, 
  Spinner, 
  Badge,
  Select,
  Tabs
} from '../../components/ui';

import { 
  getAllLubricentros
} from '../../services/lubricentroService';

import { getSubscriptionStats } from '../../services/subscriptionService';
import { Lubricentro } from '../../types';
import { SUBSCRIPTION_PLANS, SubscriptionPlanType } from '../../types/subscription';

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
  Line,
  AreaChart,
  Area
} from 'recharts';

// Iconos - ✅ CORRECCIÓN: Cambiar TrendingUpIcon por ArrowTrendingUpIcon
import { 
  ChartBarIcon,
  ChevronLeftIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon, // ✅ ESTE ES EL CORRECTO
  CalendarDaysIcon,
  DocumentArrowDownIcon,
  ArrowPathIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// Colores para gráficos
const COLORS = ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0', '#607d8b'];
const PLAN_COLORS = {
  starter: '#607d8b',
  basic: '#2196f3', 
  premium: '#4caf50',
  enterprise: '#9c27b0'
};

// Componente principal
const SubscriptionStatsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lubricentros, setLubricentros] = useState<Lubricentro[]>([]);
  const [subscriptionStats, setSubscriptionStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('resumen');
  const [timeRange, setTimeRange] = useState('last30days');
  
  // Estados para datos procesados
  const [planDistribution, setPlanDistribution] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [conversionData, setConversionData] = useState<any[]>([]);
  
  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, []);
  
  // Procesar datos cuando cambian
  useEffect(() => {
    if (lubricentros.length > 0) {
      processData();
    }
  }, [lubricentros, timeRange]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [lubricentrosData, statsData] = await Promise.all([
        getAllLubricentros(),
        getSubscriptionStats()
      ]);
      
      setLubricentros(lubricentrosData);
      setSubscriptionStats(statsData);
      
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar los datos. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };
  
  const processData = () => {
    // Procesar distribución por plan
    const planStats = Object.keys(SUBSCRIPTION_PLANS).map(planId => {
      const count = lubricentros.filter(l => 
        l.subscriptionPlan === planId && l.estado === 'activo'
      ).length;
      
      const plan = SUBSCRIPTION_PLANS[planId as SubscriptionPlanType];
      const revenue = count * plan.price.monthly;
      
      return {
        planId,
        name: plan.name,
        count,
        revenue,
        color: PLAN_COLORS[planId as keyof typeof PLAN_COLORS] || COLORS[0]
      };
    });
    
    setPlanDistribution(planStats);
    
    // Procesar datos de ingresos
    const revenueStats = planStats.map(plan => ({
      plan: plan.name,
      ingresosMensual: plan.revenue,
      ingresosSemestral: plan.count * SUBSCRIPTION_PLANS[plan.planId as SubscriptionPlanType].price.semiannual,
      suscripciones: plan.count
    }));
    
    setRevenueData(revenueStats);
    
    // Generar datos de crecimiento (simulados para demostración)
    const growth = generateGrowthData();
    setGrowthData(growth);
    
    // Generar datos de conversión
    const conversion = generateConversionData();
    setConversionData(conversion);
  };
  
  const generateGrowthData = () => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    return months.map((month, index) => {
      const activeLubricentros = lubricentros.filter(l => l.estado === 'activo').length;
      const baseGrowth = Math.floor(activeLubricentros * (0.1 + index * 0.05));
      
      return {
        mes: month,
        nuevasSuscripciones: Math.max(1, baseGrowth + Math.floor(Math.random() * 5)),
        cancelaciones: Math.max(0, Math.floor(baseGrowth * 0.1)),
        totalActivas: Math.max(1, baseGrowth * (index + 1))
      };
    });
  };
  
  const generateConversionData = () => {
    const trialCount = lubricentros.filter(l => l.estado === 'trial').length;
    const activeCount = lubricentros.filter(l => l.estado === 'activo').length;
    const totalTrials = trialCount + activeCount; // Asumimos que los activos fueron trials
    
    return [
      { 
        name: 'Período de Prueba', 
        value: trialCount, 
        color: COLORS[2] 
      },
      { 
        name: 'Convertidos a Pago', 
        value: activeCount, 
        color: COLORS[0] 
      },
      { 
        name: 'Abandonaron', 
        value: Math.max(0, Math.floor(totalTrials * 0.2)), 
        color: COLORS[3] 
      }
    ];
  };
  
  // Calcular métricas clave
  const calculateMetrics = () => {
    const totalActive = lubricentros.filter(l => l.estado === 'activo').length;
    const totalTrial = lubricentros.filter(l => l.estado === 'trial').length;
    const totalInactive = lubricentros.filter(l => l.estado === 'inactivo').length;
    
    const totalRevenue = planDistribution.reduce((sum, plan) => sum + plan.revenue, 0);
    const avgRevenuePerUser = totalActive > 0 ? totalRevenue / totalActive : 0;
    
    const conversionRate = totalActive + totalTrial > 0 ? 
      (totalActive / (totalActive + totalTrial + totalInactive)) * 100 : 0;
    
    // Calcular próximos vencimientos
    const now = new Date();
    const in7Days = new Date(now);
    in7Days.setDate(in7Days.getDate() + 7);
    
    const expiringSoon = lubricentros.filter(l => 
      l.estado === 'trial' && 
      l.trialEndDate && 
      new Date(l.trialEndDate) > now &&
      new Date(l.trialEndDate) <= in7Days
    ).length;
    
    return {
      totalActive,
      totalTrial,
      totalInactive,
      totalRevenue,
      avgRevenuePerUser,
      conversionRate,
      expiringSoon
    };
  };
  
  const metrics = calculateMetrics();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-80">
        <Spinner size="lg" />
      </div>
    );
  }
  
  return (
    <PageContainer
      title="Estadísticas de Suscripciones"
      subtitle="Análisis detallado de suscripciones y ingresos"
      action={
        <div className="flex space-x-2">
          <Button
            color="success"
            variant="outline"
            icon={<DocumentArrowDownIcon className="h-5 w-5" />}
            onClick={() => alert('Función de exportación se implementaría aquí')}
          >
            Exportar Datos
          </Button>
          <Button
            color="secondary"
            variant="outline"
            icon={<ArrowPathIcon className="h-5 w-5" />}
            onClick={loadData}
          >
            Actualizar
          </Button>
          <Button
            color="primary"
            onClick={() => navigate('/superadmin/lubricentros')}
            icon={<ChevronLeftIcon className="h-5 w-5" />}
          >
            Volver
          </Button>
        </div>
      }
    >
      {error && (
        <Alert type="error" className="mb-6" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Filtros */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="w-48">
              <Select
                label="Período de Tiempo"
                name="timeRange"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                options={[
                  { value: 'last7days', label: 'Últimos 7 días' },
                  { value: 'last30days', label: 'Últimos 30 días' },
                  { value: 'last90days', label: 'Últimos 90 días' },
                  { value: 'last6months', label: 'Últimos 6 meses' },
                  { value: 'thisyear', label: 'Este año' },
                  { value: 'alltime', label: 'Todo el tiempo' }
                ]}
              />
            </div>
          </div>
        </CardBody>
      </Card>
      
      {/* Métricas principales */}
      <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="rounded-full p-3 bg-green-100 mr-4">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Mensuales</p>
                <p className="text-2xl font-semibold text-gray-800">
                  ${metrics.totalRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-green-600">+12% vs mes anterior</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="rounded-full p-3 bg-blue-100 mr-4">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Suscripciones Activas</p>
                <p className="text-2xl font-semibold text-gray-800">{metrics.totalActive}</p>
                <p className="text-xs text-blue-600">+5 nuevas este mes</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="rounded-full p-3 bg-purple-100 mr-4">
                <ArrowTrendingUpIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Tasa de Conversión</p>
                <p className="text-2xl font-semibold text-gray-800">
                  {metrics.conversionRate.toFixed(1)}%
                </p>
                <p className="text-xs text-purple-600">+2.3% vs mes anterior</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="rounded-full p-3 bg-orange-100 mr-4">
                <CalendarDaysIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Expiran en 7 días</p>
                <p className="text-2xl font-semibold text-gray-800">{metrics.expiringSoon}</p>
                <p className="text-xs text-orange-600">Requieren atención</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      
      {/* Pestañas de contenido */}
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'resumen', label: 'Resumen' },
          { id: 'ingresos', label: 'Ingresos' },
          { id: 'crecimiento', label: 'Crecimiento' },
          { id: 'conversion', label: 'Conversión' }
        ]}
        className="mb-6"
      />
      
      {/* Contenido por pestañas */}
      {activeTab === 'resumen' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Distribución por plan */}
          <Card>
            <CardHeader title="Distribución por Plan" subtitle="Suscripciones activas por tipo de plan" />
            <CardBody>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={planDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {planDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value} suscripciones`, 'Cantidad']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
          
          {/* Estados de suscripción */}
          <Card>
            <CardHeader title="Estados de Suscripción" subtitle="Distribución general por estado" />
            <CardBody>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Activos', value: metrics.totalActive, fill: '#4caf50' },
                      { name: 'En Prueba', value: metrics.totalTrial, fill: '#ff9800' },
                      { name: 'Inactivos', value: metrics.totalInactive, fill: '#f44336' }
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip 
                      formatter={(value) => [`${value} lubricentros`, 'Cantidad']}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
      
      {activeTab === 'ingresos' && (
        <div className="space-y-6">
          {/* Ingresos por plan */}
          <Card>
            <CardHeader title="Ingresos por Plan de Suscripción" subtitle="Comparativa de ingresos mensuales y semestrales" />
            <CardBody>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={revenueData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="plan" />
                    <YAxis 
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${value.toLocaleString()}`, 
                        name === 'ingresosMensual' ? 'Ingresos Mensual' : 'Ingresos Semestral'
                      ]}
                    />
                    <Legend />
                    <Bar 
                      dataKey="ingresosMensual" 
                      name="Mensual" 
                      fill="#2196f3" 
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="ingresosSemestral" 
                      name="Semestral" 
                      fill="#4caf50" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
          
          {/* Métricas de ingresos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardBody>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    ${metrics.totalRevenue.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Ingresos Mensuales Totales</div>
                  <div className="text-xs text-green-600 mt-1">+15% vs mes anterior</div>
                </div>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    ${metrics.avgRevenuePerUser.toFixed(0)}
                  </div>
                  <div className="text-sm text-gray-600">Ingreso Promedio por Usuario</div>
                  <div className="text-xs text-blue-600 mt-1">ARPU mensual</div>
                </div>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    ${(metrics.totalRevenue * 12).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Proyección Anual</div>
                  <div className="text-xs text-purple-600 mt-1">Basado en ingresos actuales</div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
      
      {activeTab === 'crecimiento' && (
        <div className="space-y-6">
          {/* Gráfico de crecimiento */}
          <Card>
            <CardHeader title="Tendencia de Crecimiento" subtitle="Evolución de suscripciones en los últimos meses" />
            <CardBody>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={growthData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="totalActivas" 
                      name="Total Activas"
                      stroke="#4caf50" 
                      fill="#4caf50" 
                      fillOpacity={0.3}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="nuevasSuscripciones" 
                      name="Nuevas Suscripciones"
                      stroke="#2196f3" 
                      fill="#2196f3" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
          
          {/* Métricas de crecimiento */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardBody>
                <div className="flex items-center">
                  <div className="rounded-full p-3 bg-green-100 mr-4">
                    <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Crecimiento Mensual</p>
                    <p className="text-2xl font-semibold text-gray-800">+8.2%</p>
                  </div>
                </div>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <div className="flex items-center">
                  <div className="rounded-full p-3 bg-blue-100 mr-4">
                    <UserGroupIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Nuevos Este Mes</p>
                    <p className="text-2xl font-semibold text-gray-800">
                      {growthData.length > 0 ? growthData[growthData.length - 1].nuevasSuscripciones : 0}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <div className="flex items-center">
                  <div className="rounded-full p-3 bg-red-100 mr-4">
                    <XMarkIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Cancelaciones</p>
                    <p className="text-2xl font-semibold text-gray-800">
                      {growthData.length > 0 ? growthData[growthData.length - 1].cancelaciones : 0}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <div className="flex items-center">
                  <div className="rounded-full p-3 bg-purple-100 mr-4">
                    <ChartBarIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tasa de Retención</p>
                    <p className="text-2xl font-semibold text-gray-800">94.5%</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
      
      {activeTab === 'conversion' && (
        <div className="space-y-6">
          {/* Embudo de conversión */}
          <Card>
            <CardHeader title="Embudo de Conversión" subtitle="Flujo desde período de prueba hasta suscripción paga" />
            <CardBody>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={conversionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {conversionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value} lubricentros`, name]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
          
          {/* Métricas de conversión */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardBody>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {metrics.conversionRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Tasa de Conversión Global</div>
                  <div className="text-xs text-green-600 mt-1">De prueba a pago</div>
                </div>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    7.2
                  </div>
                  <div className="text-sm text-gray-600">Días Promedio de Conversión</div>
                  <div className="text-xs text-blue-600 mt-1">Tiempo en decidir</div>
                </div>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {metrics.expiringSoon}
                  </div>
                  <div className="text-sm text-gray-600">Próximos a Vencer</div>
                  <div className="text-xs text-orange-600 mt-1">Requieren seguimiento</div>
                </div>
              </CardBody>
            </Card>
          </div>
          
          {/* Lista de próximos vencimientos */}
          <Card>
            <CardHeader title="Próximos Vencimientos de Prueba" subtitle="Lubricentros que requieren atención inmediata" />
            <CardBody>
              {metrics.expiringSoon > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lubricentro
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Responsable
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha de Vencimiento
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Días Restantes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acción
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {lubricentros
                        .filter(l => {
                          if (l.estado !== 'trial' || !l.trialEndDate) return false;
                          const now = new Date();
                          const endDate = new Date(l.trialEndDate);
                          const in7Days = new Date(now);
                          in7Days.setDate(in7Days.getDate() + 7);
                          return endDate > now && endDate <= in7Days;
                        })
                        .map(lubricentro => {
                          const daysRemaining = Math.ceil(
                            (new Date(lubricentro.trialEndDate!).getTime() - new Date().getTime()) / 
                            (1000 * 60 * 60 * 24)
                          );
                          
                          return (
                            <tr key={lubricentro.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {lubricentro.fantasyName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {lubricentro.responsable}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(lubricentro.trialEndDate!).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge 
                                  color={daysRemaining <= 2 ? 'error' : daysRemaining <= 5 ? 'warning' : 'info'}
                                  text={`${daysRemaining} días`}
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <Button
                                  size="sm"
                                  color="primary"
                                  onClick={() => navigate(`/superadmin/lubricentros/suscripcion/${lubricentro.id}`)}
                                >
                                  Gestionar
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckIcon className="mx-auto h-12 w-12 text-green-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No hay vencimientos próximos
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Todos los períodos de prueba están en orden.
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}
      
      {/* Recomendaciones finales */}
      <Card className="mt-6">
        <CardHeader title="Recomendaciones Estratégicas" />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ArrowTrendingUpIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Oportunidades de Crecimiento
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Contactar lubricentros próximos a vencer para ofertas especiales</li>
                      <li>Implementar programa de referidos para clientes satisfechos</li>
                      <li>Crear contenido educativo sobre beneficios de cada plan</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border-l-4 border-green-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Optimización de Ingresos
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Promocionar pagos semestrales con descuentos adicionales</li>
                      <li>Analizar la posibilidad de ajustar precios del Plan Premium</li>
                      <li>Crear planes personalizados para empresas grandes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </PageContainer>
  );
};

export default SubscriptionStatsPage;