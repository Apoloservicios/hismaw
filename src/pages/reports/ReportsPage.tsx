// src/pages/reports/ReportsPage.tsx
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
  Select 
} from '../../components/ui';
import { getOilChangesStats } from '../../services/oilChangeService';
import { getUsersOperatorStats } from '../../services/userService';
import { OilChangeStats, OperatorStats } from '../../types';
import MonthlySalesChart from './components/MonthlySalesChart';
import OperatorPerformanceChart from './components/OperatorPerformanceChart';
import ServicesByTypeChart from './components/ServicesByTypeChart';
import StatsCards from './components/StatsCards';

// Iconos
import { 
  DocumentArrowDownIcon, 
  ArrowPathIcon 
} from '@heroicons/react/24/outline';

const ReportsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<OilChangeStats | null>(null);
  const [operatorStats, setOperatorStats] = useState<OperatorStats[]>([]);
  const [servicesByTypeData, setServicesByTypeData] = useState<{name: string, value: number}[]>([]);
  const [monthlySalesData, setMonthlySalesData] = useState<{name: string, cantidad: number}[]>([]);
  
  // Filtros para los reportes
  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year' | 'all'>('month');
  
  // Efecto para cargar datos iniciales
  useEffect(() => {
    if (userProfile?.lubricentroId) {
      loadReportData();
    }
  }, [userProfile, dateRange]);
  
  // Cargar datos de reportes
  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!userProfile?.lubricentroId) {
        setError('No se encontró información del lubricentro');
        return;
      }
      
      // Obtener estadísticas de cambios de aceite
      const oilChangeStats = await getOilChangesStats(userProfile.lubricentroId);
      setStats(oilChangeStats);
      
      // Obtener estadísticas por operador
      // Calcular fechas según el rango seleccionado
      const today = new Date();
      let startDate = new Date();
      
      switch (dateRange) {
        case 'month':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          break;
        case 'quarter':
          const currentQuarter = Math.floor(today.getMonth() / 3);
          startDate = new Date(today.getFullYear(), currentQuarter * 3, 1);
          break;
        case 'year':
          startDate = new Date(today.getFullYear(), 0, 1);
          break;
        case 'all':
          startDate = new Date(2000, 0, 1); // Una fecha suficientemente lejana
          break;
      }
      
      const operatorData = await getUsersOperatorStats(
        userProfile.lubricentroId,
        startDate,
        today
      );
      setOperatorStats(operatorData);
      
      // Simular datos para gráfico de tipos de servicio
      // En una implementación real, estos datos vendrían de una consulta específica
      setServicesByTypeData([
        { name: 'Cambio de Aceite', value: oilChangeStats.total },
        { name: 'Filtros', value: Math.round(oilChangeStats.total * 0.7) },
        { name: 'Aditivos', value: Math.round(oilChangeStats.total * 0.3) },
        { name: 'Otros', value: Math.round(oilChangeStats.total * 0.2) }
      ]);
      
      // Simular datos de ventas mensuales
      // En una implementación real, vendrían de una consulta o cálculo específico
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const currentMonth = today.getMonth();
      const monthlyData = [];
      
      for (let i = 5; i >= 0; i--) {
        let month = currentMonth - i;
        let year = today.getFullYear();
        
        if (month < 0) {
          month += 12;
          year -= 1;
        }
        
        // Simular cantidad basada en el mes actual y estadísticas
        let cantidad;
        if (i === 0) {
          cantidad = oilChangeStats.thisMonth;
        } else if (i === 1) {
          cantidad = oilChangeStats.lastMonth;
        } else {
          cantidad = Math.round(Math.random() * 50) + 10; // Valores aleatorios para meses anteriores
        }
        
        monthlyData.push({
          name: `${monthNames[month]} ${year}`,
          cantidad
        });
      }
      
      setMonthlySalesData(monthlyData);
      
    } catch (err) {
      console.error('Error al cargar datos de reportes:', err);
      setError('Error al cargar los datos. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Generar informe en PDF
  const generatePdfReport = () => {
    alert('Esta funcionalidad generaría un PDF con los reportes actuales');
    // En una implementación real, aquí se generaría un PDF con todos los reportes
  };
  
  // Exportar datos a Excel
  const exportToExcel = () => {
    alert('Esta funcionalidad exportaría los datos a Excel');
    // En una implementación real, aquí se generaría un archivo Excel con los datos
  };
  
  if (loading && !stats) {
    return (
      <div className="flex justify-center items-center h-80">
        <Spinner size="lg" />
      </div>
    );
  }
  
  return (
    <PageContainer
      title="Reportes y Estadísticas"
      subtitle="Análisis detallado de las operaciones del lubricentro"
      action={
        <div className="flex space-x-2">
          <Button
            color="secondary"
            variant="outline"
            icon={<DocumentArrowDownIcon className="h-5 w-5" />}
            onClick={exportToExcel}
          >
            Exportar a Excel
          </Button>
          <Button
            color="primary"
            icon={<DocumentArrowDownIcon className="h-5 w-5" />}
            onClick={generatePdfReport}
          >
            Generar PDF
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
            <div className="flex items-center space-x-4">
              <div className="w-48">
                <Select
                  label="Período"
                  name="dateRange"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as 'month' | 'quarter' | 'year' | 'all')}
                  options={[
                    { value: 'month', label: 'Este mes' },
                    { value: 'quarter', label: 'Este trimestre' },
                    { value: 'year', label: 'Este año' },
                    { value: 'all', label: 'Todo el historial' }
                  ]}
                />
              </div>
            </div>
            <Button
              color="primary"
              variant="outline"
              icon={<ArrowPathIcon className="h-4 w-4" />}
              onClick={loadReportData}
            >
              Actualizar
            </Button>
          </div>
        </CardBody>
      </Card>
      
      {/* Tarjetas de estadísticas */}
      {stats && <StatsCards stats={stats} />}
      
      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Ventas mensuales */}
        <Card>
          <CardHeader
            title="Cambios de Aceite por Mes"
            subtitle="Últimos 6 meses"
          />
          <CardBody>
            <div className="h-80">
              <MonthlySalesChart data={monthlySalesData} />
            </div>
          </CardBody>
        </Card>
        
        {/* Rendimiento por operador */}
        <Card>
          <CardHeader
            title="Rendimiento por Operador"
            subtitle={`Período: ${
              dateRange === 'month' ? 'Este mes' : 
              dateRange === 'quarter' ? 'Este trimestre' : 
              dateRange === 'year' ? 'Este año' : 
              'Todo el historial'
            }`}
          />
          <CardBody>
            <div className="h-80">
              <OperatorPerformanceChart data={operatorStats} />
            </div>
          </CardBody>
        </Card>
      </div>
      
      {/* Gráfico de servicios por tipo */}
      <Card className="mb-6">
        <CardHeader
          title="Distribución de Servicios"
          subtitle="Por tipo de servicio"
        />
        <CardBody>
          <div className="h-80">
            <ServicesByTypeChart data={servicesByTypeData} />
          </div>
        </CardBody>
      </Card>
      
      {/* Sección de indicadores clave */}
      <Card>
        <CardHeader
          title="Indicadores Clave"
          subtitle="Métricas importantes para el negocio"
        />
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Tasa de Retorno</h3>
              <p className="text-3xl font-bold text-primary-600">
                {stats ? `${Math.round((stats.upcoming30Days / stats.total) * 100)}%` : '0%'}
              </p>
              <p className="text-sm text-gray-500">
                Clientes que regresan para el próximo servicio
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900">Promedio Diario</h3>
              <p className="text-3xl font-bold text-primary-600">
                {stats ? Math.round(stats.thisMonth / 30) : '0'}
              </p>
              <p className="text-sm text-gray-500">
                Cambios de aceite por día este mes
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900">Crecimiento</h3>
              <p className="text-3xl font-bold text-primary-600">
                {stats && stats.lastMonth > 0
                  ? `${Math.round(((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100)}%`
                  : 'N/A'}
              </p>
              <p className="text-sm text-gray-500">
                Respecto al mes anterior
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900">Próximos Servicios</h3>
              <p className="text-3xl font-bold text-primary-600">
                {stats ? stats.upcoming30Days : '0'}
              </p>
              <p className="text-sm text-gray-500">
                Programados para los próximos 30 días
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </PageContainer>
  );
};

export default ReportsPage;