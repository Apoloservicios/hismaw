// src/pages/reports/VehicleReportPage.tsx
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
import { getOilChangesByVehicle } from '../../services/oilChangeService';
import { OilChange } from '../../types';
import { DocumentArrowDownIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import reportService from '../../services/reportService';

const VehicleReportPage: React.FC = () => {
  const { dominio } = useParams<{ dominio: string }>();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [oilChanges, setOilChanges] = useState<OilChange[]>([]);
  const [vehicleInfo, setVehicleInfo] = useState<{
    marca: string;
    modelo: string;
    tipo: string;
    año?: number;
    cliente: string;
  } | null>(null);
  
  // Cargar datos
  useEffect(() => {
    if (dominio) {
      loadVehicleData();
    }
  }, [dominio]);
  
  // Cargar datos del vehículo y sus cambios de aceite
  const loadVehicleData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!dominio) {
        setError('Dominio del vehículo no proporcionado');
        return;
      }
      
      // Obtener cambios de aceite del vehículo
      const changes = await getOilChangesByVehicle(dominio);
      setOilChanges(changes);
      
      // Extraer información del vehículo del primer cambio de aceite
      if (changes.length > 0) {
        const latestChange = changes[0]; // El más reciente
        setVehicleInfo({
          marca: latestChange.marcaVehiculo,
          modelo: latestChange.modeloVehiculo,
          tipo: latestChange.tipoVehiculo,
          año: latestChange.añoVehiculo,
          cliente: latestChange.nombreCliente
        });
      }
      
    } catch (err) {
      console.error('Error al cargar datos del vehículo:', err);
      setError('Error al cargar los datos. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Generar informe en PDF
  const generatePdfReport = async () => {
    if (!vehicleInfo || oilChanges.length === 0) return;
    
    try {
      alert(`Generando reporte del vehículo ${dominio}`);
      
      // En una implementación real, generaríamos un PDF específico para el vehículo
      // Usando el código apropiado del servicio de reportes
    } catch (err) {
      console.error('Error al generar reporte:', err);
      setError('Error al generar el reporte. Por favor, intente nuevamente.');
    }
  };
  
  // Exportar a Excel
  const exportToExcel = () => {
    if (!vehicleInfo || oilChanges.length === 0) return;
    
    try {
      alert(`Exportando datos del vehículo ${dominio} a Excel`);
      
      // En una implementación real, exportaríamos los datos a Excel
      // Usando el código apropiado del servicio de reportes
    } catch (err) {
      console.error('Error al exportar a Excel:', err);
      setError('Error al exportar a Excel. Por favor, intente nuevamente.');
    }
  };
  
  // Calcular estadísticas
  const calculateStats = () => {
    if (oilChanges.length === 0) {
      return {
        totalServices: 0,
        averageKmBetweenServices: 0,
        oilTypes: [],
        totalFilters: 0,
        totalAdditives: 0
      };
    }
    
    // Total de cambios
    const totalServices = oilChanges.length;
    
    // Promedio de kilómetros entre cambios
    let kmDifferences = 0;
    let differencesCount = 0;
    
    for (let i = 0; i < oilChanges.length - 1; i++) {
      const currentKm = oilChanges[i].kmActuales;
      const nextKm = oilChanges[i + 1].kmActuales;
      if (currentKm > nextKm) {
        kmDifferences += (currentKm - nextKm);
        differencesCount++;
      }
    }
    
    const averageKmBetweenServices = differencesCount > 0 
      ? Math.round(kmDifferences / differencesCount) 
      : 0;
    
    // Tipos de aceite usados
    const oilTypesMap = new Map<string, number>();
    
    oilChanges.forEach(change => {
      const oilType = `${change.marcaAceite} ${change.tipoAceite} ${change.sae}`;
      oilTypesMap.set(oilType, (oilTypesMap.get(oilType) || 0) + 1);
    });
    
    const oilTypes = Array.from(oilTypesMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
    
    // Total de filtros y aditivos
    const totalFilters = oilChanges.filter(
      c => c.filtroAceite || c.filtroAire || c.filtroHabitaculo || c.filtroCombustible
    ).length;
    
    const totalAdditives = oilChanges.filter(
      c => c.aditivo || c.refrigerante || c.diferencial || c.caja || c.engrase
    ).length;
    
    return {
      totalServices,
      averageKmBetweenServices,
      oilTypes,
      totalFilters,
      totalAdditives
    };
  };
  
  // Obtener estadísticas
  const stats = calculateStats();
  
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
  
  if (error) {
    return (
      <PageContainer title="Reporte de Vehículo">
        <Alert type="error" className="mb-4">
          {error}
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
  
  if (oilChanges.length === 0 || !vehicleInfo) {
    return (
      <PageContainer title={`Reporte del Vehículo: ${dominio}`}>
        <Alert type="warning" className="mb-4">
          No se encontraron cambios de aceite para este vehículo.
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
      title={`Reporte del Vehículo: ${dominio}`}
      subtitle={`${vehicleInfo.marca} ${vehicleInfo.modelo} - Cliente: ${vehicleInfo.cliente}`}
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
      
      {/* Información del vehículo */}
      <Card className="mb-6">
        <CardHeader title="Información del Vehículo" />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500">Marca</p>
              <p className="text-base font-medium">{vehicleInfo.marca}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Modelo</p>
              <p className="text-base font-medium">{vehicleInfo.modelo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tipo</p>
              <p className="text-base font-medium">{vehicleInfo.tipo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Año</p>
              <p className="text-base font-medium">{vehicleInfo.año || 'No especificado'}</p>
            </div>
          </div>
          
          <div className="mt-6">
            <p className="text-sm text-gray-500">Cliente</p>
            <p className="text-base font-medium">{vehicleInfo.cliente}</p>
          </div>
          
          <div className="mt-6">
            <p className="text-sm text-gray-500">Kilometraje Actual</p>
            <p className="text-2xl font-semibold text-primary-600">
              {oilChanges[0].kmActuales.toLocaleString()} km
            </p>
          </div>
        </CardBody>
      </Card>
      
      {/* Resumen de estadísticas */}
      <Card className="mb-6">
        <CardHeader title="Resumen de Mantenimiento" />
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-green-700">Total de Servicios</p>
              <p className="text-3xl font-bold text-green-700 mt-2">{stats.totalServices}</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-700">Promedio entre Cambios</p>
              <p className="text-3xl font-bold text-blue-700 mt-2">
                {stats.averageKmBetweenServices.toLocaleString()} km
              </p>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-yellow-700">Servicios con Filtros</p>
              <p className="text-3xl font-bold text-yellow-700 mt-2">
                {stats.totalFilters}
                <span className="text-base ml-2">
                  ({Math.round((stats.totalFilters / stats.totalServices) * 100)}%)
                </span>
              </p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-purple-700">Servicios con Aditivos</p>
              <p className="text-3xl font-bold text-purple-700 mt-2">
                {stats.totalAdditives}
                <span className="text-base ml-2">
                  ({Math.round((stats.totalAdditives / stats.totalServices) * 100)}%)
                </span>
              </p>
            </div>
          </div>
          
          {/* Tipos de aceite más usados */}
          <div className="mt-6">
            <h3 className="text-base font-medium text-gray-900 mb-3">Tipos de Aceite Utilizados</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.oilTypes.slice(0, 3).map((oil, index) => (
                <div key={index} className="border border-gray-200 rounded-md p-3">
                  <p className="font-medium">{oil.type}</p>
                  <p className="text-sm text-gray-500">
                    {oil.count} {oil.count === 1 ? 'vez' : 'veces'} (
                    {Math.round((oil.count / stats.totalServices) * 100)}%)
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>
      
      {/* Historial de cambios */}
      <Card>
        <CardHeader
          title="Historial de Cambios de Aceite"
          subtitle={`Total: ${oilChanges.length} cambios`}
        />
        <CardBody>
          <Table
            headers={['Fecha', 'Km', 'Próx. Cambio', 'Aceite', 'Servicios', 'Operario']}
          >
            {oilChanges.map((change) => (
              <TableRow key={change.id}>
                <TableCell>{formatDate(change.fecha)}</TableCell>
                <TableCell>{change.kmActuales.toLocaleString()}</TableCell>
                <TableCell>
                  {change.kmProximo.toLocaleString()} / {formatDate(change.fechaProximoCambio)}
                </TableCell>
                <TableCell>{`${change.marcaAceite} ${change.tipoAceite} ${change.sae}`}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {change.filtroAceite && <Badge color="info" text="F.Aceite" />}
                    {change.filtroAire && <Badge color="info" text="F.Aire" />}
                    {change.aditivo && <Badge color="warning" text="Aditivo" />}
                    {/* Más servicios según sea necesario */}
                  </div>
                </TableCell>
                <TableCell>{change.nombreOperario}</TableCell>
              </TableRow>
            ))}
          </Table>
        </CardBody>
      </Card>
    </PageContainer>
  );
};

export default VehicleReportPage;