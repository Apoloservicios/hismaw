// src/pages/reports/OperatorReportPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  PageContainer, 
  Card, 
  CardHeader, 
  CardBody, 
  Button, 
  Alert, 
  Spinner, 
  Table,
  TableRow,
  TableCell,
  Badge
} from '../../components/ui';
import { getUserById } from '../../services/userService';
import { getOilChangesByOperator } from '../../services/oilChangeService';
import { OilChange, User } from '../../types';
import { DocumentArrowDownIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import reportService from '../../services/reportService';

// Componente para mostrar el reporte detallado de un operador específico
const OperatorReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [operator, setOperator] = useState<User | null>(null);
  const [oilChanges, setOilChanges] = useState<OilChange[]>([]);
  const [dateRange, setDateRange] = useState<{start: Date, end: Date}>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Primer día del mes
    end: new Date() // Hoy
  });
  
  // Estadísticas calculadas
  const [stats, setStats] = useState({
    total: 0,
    averagePerDay: 0,
    withFilters: 0,
    withAdditives: 0
  });
  
  // Cargar datos
  useEffect(() => {
    if (id && userProfile?.lubricentroId) {
      loadOperatorData();
    }
  }, [id, userProfile, dateRange]);
  
  // Cargar datos del operador y sus cambios de aceite
  const loadOperatorData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!id) {
        setError('ID de operador no proporcionado');
        return;
      }
      
      // Obtener datos del operador
      const operatorData = await getUserById(id);
      setOperator(operatorData);
      
      // Obtener cambios de aceite realizados por el operador
      const changes = await getOilChangesByOperator(
        id, 
        userProfile?.lubricentroId || '', 
        dateRange.start, 
        dateRange.end
      );
      setOilChanges(changes);
      
      // Calcular estadísticas
      if (changes.length > 0) {
        // Total de días en el período
        const days = Math.max(1, Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)));
        
        // Contar cambios con filtros y aditivos
        const withFilters = changes.filter(
          c => c.filtroAceite || c.filtroAire || c.filtroHabitaculo || c.filtroCombustible
        ).length;
        
        const withAdditives = changes.filter(
          c => c.aditivo || c.refrigerante || c.diferencial || c.caja || c.engrase
        ).length;
        
        setStats({
          total: changes.length,
          averagePerDay: parseFloat((changes.length / days).toFixed(1)),
          withFilters,
          withAdditives
        });
      }
      
    } catch (err) {
      console.error('Error al cargar datos del operador:', err);
      setError('Error al cargar los datos. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Generar informe en PDF
  const generatePdfReport = async () => {
    if (!operator) return;
    
    try {
      // Esta función debería generar un PDF específico para el operador
      // Usando el servicio de reportes
      alert(`Generando reporte de ${operator.nombre} ${operator.apellido}`);
      
      // Implementación mock - en un caso real, usaríamos el servicio adecuadamente
      const mockStats = {
        total: stats.total,
        thisMonth: stats.total,
        lastMonth: 0,
        upcoming30Days: 0
      };
      
      const mockOperatorStats = [{
        operatorId: operator.id,
        operatorName: `${operator.nombre} ${operator.apellido}`,
        count: stats.total
      }];
      
      await reportService.generatePdfReport(
        mockStats,
        mockOperatorStats,
        `Reporte de Operador: ${operator.nombre} ${operator.apellido}`,
        `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`
      );
      
    } catch (err) {
      console.error('Error al generar reporte:', err);
      setError('Error al generar el reporte. Por favor, intente nuevamente.');
    }
  };
  
  // Exportar a Excel
  const exportToExcel = () => {
    if (!operator || oilChanges.length === 0) return;
    
    try {
      // Implementación mock - en un caso real, prepararíamos los datos y usaríamos el servicio
      alert(`Exportando datos de ${operator.nombre} ${operator.apellido} a Excel`);
      
      // Preparar datos para Excel
      const data = oilChanges.map(change => ({
        Numero: change.nroCambio,
        Fecha: new Date(change.fecha).toLocaleDateString(),
        Cliente: change.nombreCliente,
        Vehiculo: `${change.marcaVehiculo} ${change.modeloVehiculo}`,
        Dominio: change.dominioVehiculo,
        Aceite: `${change.marcaAceite} ${change.tipoAceite} ${change.sae}`,
        Filtros: change.filtroAceite || change.filtroAire || change.filtroHabitaculo || change.filtroCombustible ? 'Sí' : 'No',
        Aditivos: change.aditivo || change.refrigerante || change.diferencial || change.caja || change.engrase ? 'Sí' : 'No'
      }));
      
      reportService.exportToExcel(data, `Cambios_${operator.nombre}_${operator.apellido}`);
      
    } catch (err) {
      console.error('Error al exportar a Excel:', err);
      setError('Error al exportar a Excel. Por favor, intente nuevamente.');
    }
  };
  
  // Cambiar rango de fechas
  const changeDateRange = (range: 'month' | 'quarter' | 'year' | 'all') => {
    const today = new Date();
    let start = new Date();
    
    switch (range) {
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        start = new Date(today.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        start = new Date(today.getFullYear(), 0, 1);
        break;
      case 'all':
        start = new Date(2000, 0, 1); // Una fecha suficientemente lejana
        break;
    }
    
    setDateRange({ start, end: today });
  };
  
  // Formatear fecha
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-80">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (error || !operator) {
    return (
      <PageContainer title="Reporte de Operador">
        <Alert type="error" className="mb-4">
          {error || 'No se encontró información del operador'}
        </Alert>
        <Button
          color="primary"
          onClick={() => navigate('/reportes')}
          icon={<ChevronLeftIcon className="h-5 w-5" />}
        >
          Volver a Reportes
        </Button>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer
      title={`Reporte de Operador: ${operator.nombre} ${operator.apellido}`}
      subtitle={`Período: ${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`}
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
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Período
              </label>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  color={dateRange.start.getMonth() === new Date().getMonth() ? 'primary' : 'secondary'}
                  variant="outline"
                  onClick={() => changeDateRange('month')}
                >
                  Este mes
                </Button>
                <Button
                  size="sm"
                  color="secondary"
                  variant="outline"
                  onClick={() => changeDateRange('quarter')}
                >
                  Este trimestre
                </Button>
                <Button
                  size="sm"
                  color="secondary"
                  variant="outline"
                  onClick={() => changeDateRange('year')}
                >
                  Este año
                </Button>
                <Button
                  size="sm"
                  color="secondary"
                  variant="outline"
                  onClick={() => changeDateRange('all')}
                >
                  Todo
                </Button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
      
      {/* Datos del operador */}
      <Card className="mb-6">
        <CardHeader title="Información del Operador" />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <p className="text-sm text-gray-500">Nombre</p>
                <p className="text-base font-medium">{operator.nombre} {operator.apellido}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-base font-medium">{operator.email}</p>
              </div>
            </div>
            <div>
              <div className="mb-4">
                <p className="text-sm text-gray-500">Rol</p>
                <p className="text-base font-medium capitalize">
                  {operator.role === 'admin' ? 'Administrador' : 'Usuario'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Estado</p>
                <Badge 
                  color={operator.estado === 'activo' ? 'success' : 'warning'} 
                  text={operator.estado}
                />
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
      
      {/* Resumen de rendimiento */}
      <Card className="mb-6">
        <CardHeader title="Resumen de Rendimiento" />
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-green-700">Cambios Realizados</p>
              <p className="text-3xl font-bold text-green-700 mt-2">{stats.total}</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-700">Promedio Diario</p>
              <p className="text-3xl font-bold text-blue-700 mt-2">{stats.averagePerDay}</p>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-yellow-700">Con Filtros</p>
              <p className="text-3xl font-bold text-yellow-700 mt-2">
                {stats.withFilters} 
                <span className="text-base ml-2">
                  ({Math.round((stats.withFilters / stats.total) * 100) || 0}%)
                </span>
              </p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-purple-700">Con Aditivos</p>
              <p className="text-3xl font-bold text-purple-700 mt-2">
                {stats.withAdditives}
                <span className="text-base ml-2">
                  ({Math.round((stats.withAdditives / stats.total) * 100) || 0}%)
                </span>
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
      
      {/* Listado de cambios de aceite */}
      <Card>
        <CardHeader
          title="Cambios de Aceite Realizados"
          subtitle={`Total: ${oilChanges.length} cambios`}
        />
        <CardBody>
          {oilChanges.length > 0 ? (
            <Table
              headers={['Nº', 'Fecha', 'Cliente', 'Vehículo', 'Dominio', 'Servicios']}
            >
              {oilChanges.map((change) => (
                <TableRow key={change.id}>
                  <TableCell className="font-medium">{change.nroCambio}</TableCell>
                  <TableCell>{formatDate(change.fecha)}</TableCell>
                  <TableCell>{change.nombreCliente}</TableCell>
                  <TableCell>{`${change.marcaVehiculo} ${change.modeloVehiculo}`}</TableCell>
                  <TableCell>{change.dominioVehiculo}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {change.filtroAceite && <Badge color="info" text="Filtro Aceite" />}
                      {change.filtroAire && <Badge color="info" text="Filtro Aire" />}
                      {change.aditivo && <Badge color="warning" text="Aditivo" />}
                      {/* Otros servicios pueden agregarse según sea necesario */}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500">
                No hay cambios de aceite registrados para este operador en el período seleccionado.
              </p>
            </div>
          )}
        </CardBody>
      </Card>
    </PageContainer>
  );
};

export default OperatorReportPage;