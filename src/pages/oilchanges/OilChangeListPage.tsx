// src/pages/oilchanges/OilChangeListPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageContainer, Card, CardHeader, CardBody, Button, Alert, Spinner } from '../../components/ui';
import { getOilChangesByLubricentro, searchOilChanges, getOilChangeById } from '../../services/oilChangeService';
import { getLubricentroById } from '../../services/lubricentroService';
import { OilChange, Lubricentro } from '../../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import pdfService from '../../services/pdfService';

// Iconos
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  ArrowPathIcon,
  DocumentDuplicateIcon,
  PencilIcon,
  PrinterIcon,
  ShareIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

// Debounce function for search
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const OilChangeListPage: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const pdfTemplateRef = useRef<HTMLDivElement>(null);
  
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
  
  // Estado para el PDF y compartir
  const [selectedOilChange, setSelectedOilChange] = useState<OilChange | null>(null);
  const [selectedLubricentro, setSelectedLubricentro] = useState<Lubricentro | null>(null);
  const [showingPdfPreview, setShowingPdfPreview] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  
  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // Datos para paginación
  const pageSize = 20;
  
  // Cargar datos iniciales
  useEffect(() => {
    if (userProfile?.lubricentroId) {
      loadInitialData();
    }
  }, [userProfile]);
  
  // Efecto para búsqueda instantánea
  useEffect(() => {
    if (debouncedSearchTerm) {
      handleSearch();
    } else if (isSearching) {
      clearSearch();
    }
  }, [debouncedSearchTerm, searchType]);
  
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
    if (!debouncedSearchTerm.trim() || !userProfile?.lubricentroId) return;
    
    try {
      setIsSearching(true);
      setLoading(true);
      setError(null);
      
      const results = await searchOilChanges(
        userProfile.lubricentroId,
        searchType,
        debouncedSearchTerm.trim(), // Usar el término debounced
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
  
  // Generar PDF para un cambio de aceite
  const generatePDF = async (oilChangeId: string) => {
    try {
      setError(null);
      setGeneratingPdf(true);
      
      // Obtener los datos del cambio de aceite
      const oilChange = await getOilChangeById(oilChangeId);
      setSelectedOilChange(oilChange);
      
      // Obtener datos del lubricentro
      let lubricentro: Lubricentro | null = null;
      if (oilChange.lubricentroId) {
        lubricentro = await getLubricentroById(oilChange.lubricentroId);
        setSelectedLubricentro(lubricentro);
      }
      
      // Mostrar vista previa
      setShowingPdfPreview(true);
      
      // Esperar a que la vista previa se renderice
      setTimeout(async () => {
        if (pdfTemplateRef.current) {
          try {
            // Usar la versión con html2canvas
            const canvas = await html2canvas(pdfTemplateRef.current, {
              scale: 2, // Mayor escala para mejor calidad
              useCORS: true,
              logging: false,
              backgroundColor: '#FFFFFF'
            });
            
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const ratio = canvas.width / canvas.height;
            const imgWidth = pageWidth;
            const imgHeight = imgWidth / ratio;
            
            pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
            
            // Si el contenido es más largo que la página, agregar más páginas
            if (imgHeight > pageHeight) {
              let remainingHeight = imgHeight;
              let position = 0;
              
              while (remainingHeight > pageHeight) {
                position -= pageHeight;
                remainingHeight -= pageHeight;
                
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
              }
            }
            
            pdf.save(`cambio-aceite-${oilChange.nroCambio}.pdf`);
          } catch (err) {
            console.error("Error con html2canvas:", err);
            
            // Si falla html2canvas, recurrir a generación directa de PDF
            if (oilChange && lubricentro !== null) {
              pdfService.generateDirectPDF(oilChange as OilChange, lubricentro as Lubricentro);
            } else if (oilChange) {
              pdfService.generateDirectPDF(oilChange as OilChange, null);
            }
          }
          
          // Ocultar vista previa
          setShowingPdfPreview(false);
          setGeneratingPdf(false);
        }
      }, 500);
      
    } catch (err) {
      console.error('Error al preparar el PDF:', err);
      setError('Error al preparar el PDF. Por favor, intente nuevamente.');
      setShowingPdfPreview(false);
      setGeneratingPdf(false);
      
      // Intentar con el método de respaldo si falla el principal
      if (selectedOilChange) {
        try {
          pdfService.generateDirectPDF(selectedOilChange, selectedLubricentro);
        } catch (backupError) {
          console.error('Error en método de respaldo:', backupError);
        }
      }
    }
  };
  
  // Compartir por WhatsApp
  const shareViaWhatsApp = async (oilChangeId: string) => {
    try {
      // Obtener los datos del cambio de aceite
      const oilChange = await getOilChangeById(oilChangeId);
      
      // Obtener datos del lubricentro
      let lubricentroName = "Lubricentro";
      if (oilChange.lubricentroId) {
        const lubricentro = await getLubricentroById(oilChange.lubricentroId);
        lubricentroName = lubricentro.fantasyName;
      }
      
      // Usar el servicio para generar el mensaje y URL
      const { whatsappUrl, whatsappUrlWithPhone } = pdfService.generateWhatsAppMessage(oilChange, lubricentroName);
      
      // Abrir en nueva ventana - priorizar URL con teléfono si está disponible
      window.open(whatsappUrlWithPhone || whatsappUrl, '_blank');
      
    } catch (err) {
      console.error('Error al compartir via WhatsApp:', err);
      setError('Error al preparar el mensaje para compartir. Por favor, intente nuevamente.');
    }
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
                      placeholder={`Buscar por ${searchType === 'dominio' ? 'patente' : 'nombre del cliente'}`}
                      className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              {isSearching && (
                <Button
                  color="secondary"
                  variant="outline"
                  onClick={clearSearch}
                >
                  Limpiar
                </Button>
              )}
              {!isSearching && debouncedSearchTerm === '' && (
                <Button
                  color="primary"
                  variant="outline"
                  onClick={loadInitialData}
                  icon={<ArrowPathIcon className="h-4 w-4" />}
                >
                  Actualizar
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
        />
        <CardBody>
          {generatingPdf && (
            <div className="my-4 text-center">
              <Spinner size="md" />
              <p className="mt-2 text-gray-600">Generando PDF, por favor espere...</p>
            </div>
          )}
          
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2 flex">
                        <Button
                          size="sm"
                          color="primary"
                          variant="outline"
                          onClick={() => navigate(`/cambios-aceite/${change.id}`)}
                          title="Ver detalle"
                        >
                          <EyeIcon className="h-4 w-4" />
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
                        <Button
                          size="sm"
                          color="info"
                          variant="outline"
                          onClick={() => generatePDF(change.id)}
                          title="Generar PDF"
                          disabled={generatingPdf}
                        >
                          <PrinterIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          color="warning"
                          variant="outline"
                          onClick={() => shareViaWhatsApp(change.id)}
                          title="Compartir"
                        >
                          <ShareIcon className="h-4 w-4" />
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
      
      {/* Componente oculto para generar PDF */}
      {showingPdfPreview && selectedOilChange && (
        <div className="hidden">
          <div ref={pdfTemplateRef} className="p-8 bg-white" style={{ width: '793px', height: '1122px' }}>
            <div className="border-b border-gray-200 pb-4 mb-6">
              {selectedLubricentro && (
                <div className="text-center mb-4">
                  <h1 className="text-2xl font-bold">{selectedLubricentro.fantasyName}</h1>
                  <p className="text-gray-600">{selectedLubricentro.domicilio}</p>
                  <p className="text-gray-600">CUIT: {selectedLubricentro.cuit} - Tel: {selectedLubricentro.phone}</p>
                  <p className="text-gray-600">{selectedLubricentro.email}</p>
                </div>
              )}
              
              <div className="text-center">
                <h2 className="text-xl font-semibold">COMPROBANTE DE CAMBIO DE ACEITE</h2>
                <p className="text-lg font-bold mt-1">Nº {selectedOilChange.nroCambio}</p>
                <p className="text-gray-600 mt-1">Fecha: {formatDate(selectedOilChange.fecha)}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold border-b border-gray-200 pb-2 mb-3">Datos del Cliente</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p><span className="font-semibold">Nombre:</span> {selectedOilChange.nombreCliente}</p>
                  {selectedOilChange.celular && <p><span className="font-semibold">Teléfono:</span> {selectedOilChange.celular}</p>}
                </div>
                <div>
                  <p><span className="font-semibold">Operador:</span> {selectedOilChange.nombreOperario}</p>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold border-b border-gray-200 pb-2 mb-3">Datos del Vehículo</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p><span className="font-semibold">Dominio:</span> {selectedOilChange.dominioVehiculo}</p>
                  <p><span className="font-semibold">Marca:</span> {selectedOilChange.marcaVehiculo}</p>
                  <p><span className="font-semibold">Modelo:</span> {selectedOilChange.modeloVehiculo}</p>
                </div>
                <div>
                  <p><span className="font-semibold">Tipo:</span> {selectedOilChange.tipoVehiculo}</p>
                  {selectedOilChange.añoVehiculo && <p><span className="font-semibold">Año:</span> {selectedOilChange.añoVehiculo}</p>}
                  <p><span className="font-semibold">Kilometraje Actual:</span> {selectedOilChange.kmActuales.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold border-b border-gray-200 pb-2 mb-3">Datos del Servicio</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p><span className="font-semibold">Aceite:</span> {selectedOilChange.marcaAceite} {selectedOilChange.tipoAceite} {selectedOilChange.sae}</p>
                  <p><span className="font-semibold">Cantidad:</span> {selectedOilChange.cantidadAceite} Litros</p>
                </div>
                <div>
                  <p><span className="font-semibold">Próximo Cambio Km:</span> {selectedOilChange.kmProximo.toLocaleString()}</p>
                  <p><span className="font-semibold">Próximo Cambio Fecha:</span> {formatDate(selectedOilChange.fechaProximoCambio)}</p>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold border-b border-gray-200 pb-2 mb-3">Filtros y Servicios Adicionales</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  {selectedOilChange.filtroAceite && (
                    <p>
                      <span className="font-semibold">Filtro de Aceite:</span> Sí
                      {selectedOilChange.filtroAceiteNota && ` (${selectedOilChange.filtroAceiteNota})`}
                    </p>
                  )}
                  {selectedOilChange.filtroAire && (
                    <p>
                      <span className="font-semibold">Filtro de Aire:</span> Sí
                      {selectedOilChange.filtroAireNota && ` (${selectedOilChange.filtroAireNota})`}
                    </p>
                  )}
                  {selectedOilChange.filtroHabitaculo && (
                    <p>
                      <span className="font-semibold">Filtro de Habitáculo:</span> Sí
                      {selectedOilChange.filtroHabitaculoNota && ` (${selectedOilChange.filtroHabitaculoNota})`}
                    </p>
                  )}
                  {selectedOilChange.filtroCombustible && (
                    <p>
                      <span className="font-semibold">Filtro de Combustible:</span> Sí
                      {selectedOilChange.filtroCombustibleNota && ` (${selectedOilChange.filtroCombustibleNota})`}
                    </p>
                  )}
                </div>
                <div>
                  {selectedOilChange.aditivo && (
                    <p>
                      <span className="font-semibold">Aditivo:</span> Sí
                      {selectedOilChange.aditivoNota && ` (${selectedOilChange.aditivoNota})`}
                    </p>
                  )}
                  {selectedOilChange.refrigerante && (
                    <p>
                      <span className="font-semibold">Refrigerante:</span> Sí
                      {selectedOilChange.refrigeranteNota && ` (${selectedOilChange.refrigeranteNota})`}
                    </p>
                  )}
                  {selectedOilChange.diferencial && (
                    <p>
                      <span className="font-semibold">Diferencial:</span> Sí
                      {selectedOilChange.diferencialNota && ` (${selectedOilChange.diferencialNota})`}
                    </p>
                  )}
                  {selectedOilChange.caja && (
                    <p>
                      <span className="font-semibold">Caja:</span> Sí
                      {selectedOilChange.cajaNota && ` (${selectedOilChange.cajaNota})`}
                    </p>
                  )}
                  {selectedOilChange.engrase && (
                    <p>
                      <span className="font-semibold">Engrase:</span> Sí
                      {selectedOilChange.engraseNota && ` (${selectedOilChange.engraseNota})`}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {selectedOilChange.observaciones && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold border-b border-gray-200 pb-2 mb-3">Observaciones</h3>
                <p className="whitespace-pre-line">{selectedOilChange.observaciones}</p>
              </div>
            )}
            
            <div className="mt-10 border-t border-gray-200 pt-6 text-center">
              <p className="text-sm text-gray-500">Este documento no es válido como factura.</p>
              <p className="text-sm text-gray-500 mt-1">
                Próximo cambio: a los {selectedOilChange.kmProximo.toLocaleString()} km o el {formatDate(selectedOilChange.fechaProximoCambio)}, lo que ocurra primero.
              </p>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
export default OilChangeListPage;