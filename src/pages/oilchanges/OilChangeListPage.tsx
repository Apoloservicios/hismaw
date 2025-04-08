// src/pages/oilchanges/OilChangeListPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageContainer, Card, CardHeader, CardBody, Button, Alert, Spinner, Input } from '../../components/ui';
import { getOilChangesByLubricentro, searchOilChanges } from '../../services/oilChangeService';
import { OilChange } from '../../types';

// Iconos
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  ArrowPathIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

const OilChangeListPage: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [oilChanges, setOilChanges] = useState<OilChange[]>([]);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  
  // Estados para búsqueda y filtrado
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'cliente' | 'dominio'>('dominio');
  const [isSearching, setIsSearching] = useState(false);
  
  // Datos para paginación
  const pageSize = 20;
  
  // Cargar datos iniciales
  useEffect(() => {
    if (userProfile?.lubricentroId) {
      loadInitialData();
    }
  }, [userProfile]);
  
  // Cargar datos iniciales
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!userProfile?.lubricentroId) {
        setError('No se encontró información del lubricentro');
        return;
      }
      
      const result = await getOilChangesByLubricentro(userProfile.lubricentroId, pageSize);
      setOilChanges(result.oilChanges);
      setLastVisible(result.lastVisible);
      setHasMore(result.oilChanges.length === pageSize);
      
    } catch (err) {
      console.error('Error al cargar cambios de aceite:', err);
      setError('Error al cargar los datos. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Cargar más datos (paginación)
  const loadMoreData = async () => {
    if (!lastVisible || !hasMore || !userProfile?.lubricentroId) return;
    
    try {
      setLoading(true);
      
      const result = await getOilChangesByLubricentro(
        userProfile.lubricentroId,
        pageSize,
        lastVisible
      );
      
      setOilChanges([...oilChanges, ...result.oilChanges]);
      setLastVisible(result.lastVisible);
      setHasMore(result.oilChanges.length === pageSize);
      
    } catch (err) {
      console.error('Error al cargar más cambios de aceite:', err);
      setError('Error al cargar más datos. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Realizar búsqueda
  const handleSearch = async () => {
    if (!searchTerm.trim() || !userProfile?.lubricentroId) return;
    
    try {
      setIsSearching(true);
      setLoading(true);
      setError(null);
      
      const results = await searchOilChanges(
        userProfile.lubricentroId,
        searchType,
        searchTerm.trim(),
        50 // Límite más alto para búsquedas
      );
      
      setOilChanges(results);
      setHasMore(false); // No implementamos paginación en búsquedas por ahora
      
    } catch (err) {
      console.error('Error al buscar cambios de aceite:', err);
      setError('Error al realizar la búsqueda. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Limpiar búsqueda y volver a cargar datos iniciales
  const clearSearch = () => {
    setSearchTerm('');
    setIsSearching(false);
    loadInitialData();
  };
  
  // Formatear fecha
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  if (loading && oilChanges.length === 0) {
    return (
      <div className="flex justify-center items-center h-80">
        <Spinner size="lg" />
      </div>
    );
  }
  
  return (
    <PageContainer
      title="Historial de Cambios de Aceite"
      subtitle="Gestión y consulta de cambios de aceite"
      action={
        <Button
          color="primary"
          icon={<PlusIcon className="h-5 w-5" />}
          onClick={() => navigate('/cambios-aceite/nuevo')}
        >
          Nuevo Cambio
        </Button>
      }
    >
      {error && (
        <Alert type="error" className="mb-6" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Barra de búsqueda */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <div className="flex space-x-4">
                <div className="w-1/3">
                  <select
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value as 'cliente' | 'dominio')}
                  >
                    <option value="dominio">Patente</option>
                    <option value="cliente">Cliente</option>
                  </select>
                </div>
                <div className="flex-1">
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder={`Buscar por ${searchType === 'dominio' ? 'patente' : 'nombre del cliente'}`}
                      className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                color="primary"
                variant="outline"
                onClick={handleSearch}
                disabled={!searchTerm.trim()}
              >
                Buscar
              </Button>
              {isSearching && (
                <Button
                  color="secondary"
                  variant="outline"
                  onClick={clearSearch}
                >
                  Limpiar
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
      
      {/* Tabla de cambios de aceite */}
      <Card>
        <CardHeader
          title={isSearching ? `Resultados de búsqueda para "${searchTerm}"` : "Cambios de Aceite"}
          subtitle={isSearching ? `${oilChanges.length} resultados encontrados` : `Mostrando ${oilChanges.length} registros`}
          action={
            !isSearching && (
              <Button
                size="sm"
                variant="outline"
                color="primary"
                icon={<ArrowPathIcon className="h-4 w-4" />}
                onClick={loadInitialData}
              >
                Actualizar
              </Button>
            )
          }
        />
        <CardBody>
          {oilChanges.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nº Cambio
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehículo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dominio
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Próximo Cambio
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {oilChanges.map((change) => (
                    <tr key={change.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {change.nroCambio}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(change.fecha)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {change.nombreCliente}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {`${change.marcaVehiculo} ${change.modeloVehiculo}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {change.dominioVehiculo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(change.fechaProximoCambio)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                        <Button
                          size="sm"
                          color="primary"
                          variant="outline"
                          onClick={() => navigate(`/cambios-aceite/${change.id}`)}
                          title="Ver detalle"
                        >
                          Ver
                        </Button>
                        <Button
                          size="sm"
                          color="secondary"
                          variant="outline"
                          onClick={() => navigate(`/cambios-aceite/editar/${change.id}`)}
                          title="Editar"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          color="success"
                          variant="outline"
                          onClick={() => navigate(`/cambios-aceite/nuevo?clone=${change.id}`)}
                          title="Duplicar"
                        >
                          <DocumentDuplicateIcon className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500">
                {isSearching ? 'No se encontraron resultados para la búsqueda.' : 'No hay cambios de aceite registrados.'}
              </p>
              {!isSearching && (
                <Button 
                  color="primary"
                  size="sm"
                  className="mt-4"
                  onClick={() => navigate('/cambios-aceite/nuevo')}
                >
                  Registrar Nuevo Cambio
                </Button>
              )}
            </div>
          )}
          
          {/* Botón para cargar más resultados */}
          {hasMore && !isSearching && (
            <div className="mt-6 text-center">
              <Button
                color="secondary"
                variant="outline"
                onClick={loadMoreData}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Cargando...
                  </>
                ) : (
                  'Cargar Más'
                )}
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </PageContainer>
  );
};

export default OilChangeListPage;