// src/pages/oilchanges/OilChangeFormPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  PageContainer, 
  Card, 
  CardHeader, 
  CardBody, 
  CardFooter, 
  Button, 
  Input, 
  Select, 
  Textarea, 
  Checkbox,
  Alert, 
  Spinner 
} from '../../components/ui';
import AutocompleteInput from '../../components/common/AutocompleteInput';
import { 
  createOilChange, 
  getOilChangeById, 
  updateOilChange,
  getNextOilChangeNumber
} from '../../services/oilChangeService';
import { getLubricentroById } from '../../services/lubricentroService';
import { 
  autocompleteOptions, 
  tiposVehiculo, 
  isValidDominio, 
  isValidAño, 
  isValidKilometraje 
} from '../../services/validationService';
import { OilChange, Lubricentro } from '../../types';

// Iconos
import { 
  UserIcon, 
  PhoneIcon, 
  TruckIcon, 
  CalendarIcon, 
  WrenchIcon,
  ChevronLeftIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const OilChangeFormPage: React.FC = () => {
  // Código existente para estados y efectos...
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { userProfile } = useAuth();
  const queryParams = new URLSearchParams(location.search);
  const cloneId = queryParams.get('clone');
  
  const isEditing = !!id;
  const isCloning = !!cloneId;
  
  // Estado del formulario
  const [formData, setFormData] = useState<Partial<OilChange>>({
    // Todos los campos existentes...
    lubricentroId: userProfile?.lubricentroId || '',
    lubricentroNombre: '',
    fecha: new Date(),
    fechaServicio: new Date(),
    nroCambio: '',
    nombreCliente: '',
    celular: '',
    
    // Datos del vehículo
    dominioVehiculo: '',
    marcaVehiculo: '',
    modeloVehiculo: '',
    tipoVehiculo: 'Automóvil',
    añoVehiculo: undefined,
    kmActuales: 0,
    kmProximo: 0,
    perioricidad_servicio: 3, // 3 meses por defecto
    fechaProximoCambio: new Date(),
    
    // Datos del servicio
    marcaAceite: '',
    tipoAceite: '',
    sae: '',
    cantidadAceite: 4, // 4 litros por defecto
    
    // Filtros y extras
    filtroAceite: false,
    filtroAceiteNota: '',
    filtroAire: false,
    filtroAireNota: '',
    filtroHabitaculo: false,
    filtroHabitaculoNota: '',
    filtroCombustible: false,
    filtroCombustibleNota: '',
    aditivo: false,
    aditivoNota: '',
    refrigerante: false,
    refrigeranteNota: '',
    diferencial: false,
    diferencialNota: '',
    caja: false,
    cajaNota: '',
    engrase: false,
    engraseNota: '',
    
    // Observaciones
    observaciones: '',
    
    // Datos del operario
    nombreOperario: `${userProfile?.nombre || ''} ${userProfile?.apellido || ''}`,
    operatorId: userProfile?.id || '',
  });
  
  // Estados para la UI
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lubricentro, setLubricentro] = useState<Lubricentro | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Código existente para efectos, manejadores, etc...
  // Obtener datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      if (!userProfile?.lubricentroId) {
        setError('No se encontró información del lubricentro');
        return;
      }
      
      setLoading(true);
      try {
        // Obtener datos del lubricentro
        const lubricentroData = await getLubricentroById(userProfile.lubricentroId);
        setLubricentro(lubricentroData);
        
        // Si estamos editando, obtener datos del cambio
        if (isEditing && id) {
          const oilChangeData = await getOilChangeById(id);
          
          // Convertir las fechas a objetos Date
          setFormData({
            ...oilChangeData,
            fecha: new Date(oilChangeData.fecha),
            fechaServicio: new Date(oilChangeData.fechaServicio),
            fechaProximoCambio: new Date(oilChangeData.fechaProximoCambio)
          });
        } 
        // Si estamos clonando, obtener datos del cambio original
        else if (isCloning && cloneId) {
          const oilChangeData = await getOilChangeById(cloneId);
          
          // Generar próximo número de cambio
          const nextNumber = await getNextOilChangeNumber(
            userProfile.lubricentroId, 
            lubricentroData.ticketPrefix
          );
          
          const today = new Date();
          
          // Actualizar solo los datos que queremos conservar del cambio original
          setFormData({
            ...oilChangeData,
            id: undefined, // Nuevo ID al crear
            nroCambio: nextNumber,
            fecha: today,
            fechaServicio: today,
            // Calcular nueva fecha de próximo cambio
            fechaProximoCambio: new Date(today.setMonth(today.getMonth() + oilChangeData.perioricidad_servicio)),
            nombreOperario: `${userProfile?.nombre || ''} ${userProfile?.apellido || ''}`,
            operatorId: userProfile?.id || '',
          });
        } 
        // Si es un nuevo cambio, obtener próximo número
        else {
          const nextNumber = await getNextOilChangeNumber(
            userProfile.lubricentroId, 
            lubricentroData.ticketPrefix
          );
          
          setFormData(prev => ({
            ...prev,
            lubricentroNombre: lubricentroData.fantasyName,
            nroCambio: nextNumber,
          }));
        }
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar los datos. Por favor, intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [userProfile, id, cloneId, isEditing, isCloning]);
  
  // Manejar cambios en campos de texto
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Limpiar error de validación para este campo
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Actualizar el campo
    setFormData(prev => {
      if (name === 'kmActuales') {
        // Cuando cambia el kilometraje actual, actualizar el próximo km
        const kmValue = parseInt(value, 10) || 0;
        // Por defecto, el próximo cambio es a 10,000 km más
        return { 
          ...prev, 
          [name]: kmValue, 
          kmProximo: kmValue + 10000 
        };
      } 
      
      if (name === 'dominioVehiculo') {
        // Convertir el dominio a mayúsculas
        return { ...prev, [name]: value.toUpperCase() };
      }
      
      if (name === 'perioricidad_servicio') {
        // Cuando cambia la periodicidad, actualizar la fecha del próximo cambio
        const meses = parseInt(value, 10) || 3;
        const nextDate = new Date(prev.fechaServicio || new Date());
        nextDate.setMonth(nextDate.getMonth() + meses);
        
        return { 
          ...prev, 
          [name]: meses, 
          fechaProximoCambio: nextDate 
        };
      }
      
      return { ...prev, [name]: value };
    });
  };
  
  // Manejar cambios en checkboxes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  // Validar formulario
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Validaciones existentes...
    // Validar campos obligatorios
    if (!formData.nombreCliente?.trim()) {
      errors.nombreCliente = 'El nombre del cliente es obligatorio';
    }
    
    if (!formData.dominioVehiculo?.trim()) {
      errors.dominioVehiculo = 'El dominio del vehículo es obligatorio';
    } else if (!isValidDominio(formData.dominioVehiculo)) {
      errors.dominioVehiculo = 'El formato del dominio no es válido (ej: AA123BB, AAA123, A123BCD)';
    }
    
    if (!formData.marcaVehiculo?.trim()) {
      errors.marcaVehiculo = 'La marca del vehículo es obligatoria';
    }
    
    if (!formData.modeloVehiculo?.trim()) {
      errors.modeloVehiculo = 'El modelo del vehículo es obligatorio';
    }
    
    if (formData.añoVehiculo && !isValidAño(formData.añoVehiculo)) {
      errors.añoVehiculo = 'El año debe estar entre 1900 y el año actual';
    }
    
    if (!formData.kmActuales && formData.kmActuales !== 0) {
      errors.kmActuales = 'El kilometraje actual es obligatorio';
    } else if (!isValidKilometraje(formData.kmActuales)) {
      errors.kmActuales = 'El kilometraje debe ser un número positivo';
    }
    
    if (!formData.marcaAceite?.trim()) {
      errors.marcaAceite = 'La marca del aceite es obligatoria';
    }
    
    if (!formData.tipoAceite?.trim()) {
      errors.tipoAceite = 'El tipo de aceite es obligatorio';
    }
    
    if (!formData.sae?.trim()) {
      errors.sae = 'La viscosidad SAE es obligatoria';
    }
    
    if (!formData.cantidadAceite && formData.cantidadAceite !== 0) {
      errors.cantidadAceite = 'La cantidad de aceite es obligatoria';
    } else if (formData.cantidadAceite <= 0) {
      errors.cantidadAceite = 'La cantidad debe ser mayor a 0';
    }
    
    // Actualizar estado de errores
    setValidationErrors(errors);
    
    // Formulario válido si no hay errores
    return Object.keys(errors).length === 0;
  };
  
  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Por favor, corrija los errores en el formulario');
      
      // Hacer scroll al primer error
      const firstErrorField = Object.keys(validationErrors)[0];
      if (firstErrorField) {
        const element = document.getElementsByName(firstErrorField)[0];
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      
      return;
    }
    
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (isEditing && id) {
        // Actualizar cambio existente
        await updateOilChange(id, formData as Partial<OilChange>);
        setSuccess('Cambio de aceite actualizado correctamente');
        
        // Esperar brevemente para mostrar el mensaje de éxito
        setTimeout(() => {
          navigate(`/cambios-aceite/${id}`);
        }, 1000);
      } else {
        // Crear nuevo cambio
        const newId = await createOilChange(formData as Omit<OilChange, 'id' | 'createdAt'>);
        setSuccess('Cambio de aceite registrado correctamente');
        
        // Esperar brevemente para mostrar el mensaje de éxito
        setTimeout(() => {
          navigate(`/cambios-aceite/${newId}`);
        }, 1000);
      }
    } catch (err) {
      console.error('Error al guardar el cambio de aceite:', err);
      setError('Error al guardar los datos. Por favor, intente nuevamente.');
    } finally {
      setSaving(false);
    }
  };
  
  // Formatear fecha para input
  const formatDateForInput = (date: Date | undefined): string => {
    if (!date) return '';
    
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-80">
        <Spinner size="lg" />
      </div>
    );
  }
  
  return (
    <PageContainer
      title={isEditing ? 'Editar Cambio de Aceite' : 'Nuevo Cambio de Aceite'}
      subtitle={isEditing ? `${formData.nroCambio} - ${formData.dominioVehiculo}` : 'Registro de cambio de aceite'}
    >
      {error && (
        <Alert 
          type="error" 
          className="mb-6" 
          dismissible 
          onDismiss={() => setError(null)}
        >
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert 
          type="success" 
          className="mb-6" 
          dismissible 
          onDismiss={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Datos del cliente */}
        <Card className="mb-6">
          <CardHeader title="Datos del Cliente" />
          <CardBody>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <Input
                label="Nombre del Cliente"
                name="nombreCliente"
                value={formData.nombreCliente || ''}
                onChange={handleChange}
                placeholder="Nombre completo del cliente"
                required
                icon={<UserIcon className="h-5 w-5 text-gray-400" />}
                error={validationErrors.nombreCliente}
                className="border-2 border-gray-300 rounded-md focus:border-primary-500 focus:ring focus:ring-primary-100 focus:ring-opacity-50 shadow-sm"
              />
              
              <Input
                label="Teléfono / Celular"
                name="celular"
                value={formData.celular || ''}
                onChange={handleChange}
                placeholder="Número de contacto"
                icon={<PhoneIcon className="h-5 w-5 text-gray-400" />}
                className="border-2 border-gray-300 rounded-md focus:border-primary-500 focus:ring focus:ring-primary-100 focus:ring-opacity-50 shadow-sm"
              />
              
              <Input
                label="Fecha de Servicio"
                name="fechaServicio"
                type="date"
                value={formatDateForInput(formData.fechaServicio)}
                onChange={handleChange}
                required
                icon={<CalendarIcon className="h-5 w-5 text-gray-400" />}
                className="border-2 border-gray-300 rounded-md focus:border-primary-500 focus:ring focus:ring-primary-100 focus:ring-opacity-50 shadow-sm"
              />
              
              <Input
                label="Operador/Mecánico"
                name="nombreOperario"
                value={formData.nombreOperario || ''}
                onChange={handleChange}
                placeholder="Nombre del operador"
                required
                icon={<WrenchIcon className="h-5 w-5 text-gray-400" />}
                className="border-2 border-gray-300 rounded-md focus:border-primary-500 focus:ring focus:ring-primary-100 focus:ring-opacity-50 shadow-sm"
              />
            </div>
          </CardBody>
        </Card>
        
        {/* Datos del vehículo */}
        <Card className="mb-6">
          <CardHeader title="Datos del Vehículo" />
          <CardBody>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <Input
                label="Dominio (Patente)"
                name="dominioVehiculo"
                value={formData.dominioVehiculo || ''}
                onChange={handleChange}
                placeholder="Ej: AA123BB"
                required
                icon={<TruckIcon className="h-5 w-5 text-gray-400" />}
                error={validationErrors.dominioVehiculo}
                helperText="Formatos válidos: AA123BB, AAA123, A123BCD"
                className="border-2 border-gray-300 rounded-md focus:border-primary-500 focus:ring focus:ring-primary-100 focus:ring-opacity-50 shadow-sm uppercase"
              />
              
              <Select
                label="Tipo de Vehículo"
                name="tipoVehiculo"
                value={formData.tipoVehiculo || 'Automóvil'}
                onChange={handleChange}
                options={tiposVehiculo.map(tipo => ({ value: tipo, label: tipo }))}
                required
                className="border-2 border-gray-300 rounded-md focus:border-primary-500 focus:ring focus:ring-primary-100 focus:ring-opacity-50 shadow-sm"
              />
              
              <div className="z-20 relative"> {/* Aumentar z-index para autocompletado */}
                <AutocompleteInput
                  label="Marca"
                  name="marcaVehiculo"
                  value={formData.marcaVehiculo || ''}
                  onChange={handleChange}
                  options={autocompleteOptions.todasMarcasVehiculos}
                  placeholder="Marca del vehículo"
                  required
                  error={validationErrors.marcaVehiculo}
                  className="border-2 border-gray-300 rounded-md focus:border-primary-500 focus:ring focus:ring-primary-100 focus:ring-opacity-50 shadow-sm"
                />
              </div>
              
              <Input
                label="Modelo"
                name="modeloVehiculo"
                value={formData.modeloVehiculo || ''}
                onChange={handleChange}
                placeholder="Modelo del vehículo"
                required
                error={validationErrors.modeloVehiculo}
                className="border-2 border-gray-300 rounded-md focus:border-primary-500 focus:ring focus:ring-primary-100 focus:ring-opacity-50 shadow-sm"
              />
              
              <Input
                label="Año"
                name="añoVehiculo"
                type="number"
                value={formData.añoVehiculo || ''}
                onChange={handleChange}
                placeholder="Año del vehículo"
                helperText={`Entre 1900 y ${new Date().getFullYear() + 1}`}
                error={validationErrors.añoVehiculo}
                className="border-2 border-gray-300 rounded-md focus:border-primary-500 focus:ring focus:ring-primary-100 focus:ring-opacity-50 shadow-sm"
              />
              
              <Input
                label="Kilometraje Actual"
                name="kmActuales"
                type="number"
                value={formData.kmActuales || 0}
                onChange={handleChange}
                placeholder="Km actuales"
                required
                error={validationErrors.kmActuales}
                helperText="Ingrese un valor mayor o igual a 0"
                className="border-2 border-gray-300 rounded-md focus:border-primary-500 focus:ring focus:ring-primary-100 focus:ring-opacity-50 shadow-sm"
              />
              
              <Input
                label="Periodicidad (meses)"
                name="perioricidad_servicio"
                type="number"
                value={formData.perioricidad_servicio || 3}
                onChange={handleChange}
                required
                helperText="Entre 1 y 24 meses"
                className="border-2 border-gray-300 rounded-md focus:border-primary-500 focus:ring focus:ring-primary-100 focus:ring-opacity-50 shadow-sm"
              />
              
              <Input
                label="Km para Próximo Cambio"
                name="kmProximo"
                type="number"
                value={formData.kmProximo || 0}
                onChange={handleChange}
                placeholder="Km para el próximo cambio"
                required
                className="border-2 border-gray-300 rounded-md focus:border-primary-500 focus:ring focus:ring-primary-100 focus:ring-opacity-50 shadow-sm"
                helperText={`Sugerencia: ${(formData.kmActuales || 0) + 10000} km (debe ser mayor que el kilometraje actual)`}
              />
            </div>
          </CardBody>
        </Card>
        
        {/* Datos del aceite */}
        <Card className="mb-6">
          <CardHeader title="Datos del Servicio" />
          <CardBody>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 min-h-500">
              <div className="z-30 relative"> {/* Aumentar z-index para autocompletado */}
                <AutocompleteInput
                  label="Marca de Aceite"
                  name="marcaAceite"
                  value={formData.marcaAceite || ''}
                  onChange={handleChange}
                  options={autocompleteOptions.marcasAceite}
                  placeholder="Marca del aceite"
                  required
                  error={validationErrors.marcaAceite}
                  className="border-2 border-gray-300 rounded-md focus:border-primary-500 focus:ring focus:ring-primary-100 focus:ring-opacity-50 shadow-sm"
                />
              </div>
              
              <div className="z-20 relative"> {/* Aumentar z-index para autocompletado */}
                <AutocompleteInput
                  label="Tipo de Aceite"
                  name="tipoAceite"
                  value={formData.tipoAceite || ''}
                  onChange={handleChange}
                  options={autocompleteOptions.tiposAceite}
                  placeholder="Tipo de aceite"
                  required
                  error={validationErrors.tipoAceite}
                  className="border-2 border-gray-300 rounded-md focus:border-primary-500 focus:ring focus:ring-primary-100 focus:ring-opacity-50 shadow-sm"
                />
              </div>
              
              <div className="z-10 relative"> {/* Aumentar z-index para autocompletado */}
                <AutocompleteInput
                  label="Viscosidad (SAE)"
                  name="sae"
                  value={formData.sae || ''}
                  onChange={handleChange}
                  options={autocompleteOptions.viscosidad}
                  placeholder="Ej: 5W-30"
                  required
                  error={validationErrors.sae}
                  className="border-2 border-gray-300 rounded-md focus:border-primary-500 focus:ring focus:ring-primary-100 focus:ring-opacity-50 shadow-sm"
                />
              </div>
              
              <Input
                label="Cantidad (litros)"
                name="cantidadAceite"
                type="number"
                value={formData.cantidadAceite || 4}
                onChange={handleChange}
                required
                error={validationErrors.cantidadAceite}
                helperText="Ingrese un valor mayor a 0"
                className="border-2 border-gray-300 rounded-md focus:border-primary-500 focus:ring focus:ring-primary-100 focus:ring-opacity-50 shadow-sm"
              />
            </div>
          </CardBody>
        </Card>
        
        {/* Filtros y servicios adicionales */}
        <Card className="mb-6">
          <CardHeader title="Filtros y Servicios Adicionales" />
          <CardBody>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {/* Filtro de aceite */}
              <div className="p-4 border-2 border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition duration-150">
                <div className="flex items-center mb-3">
                  <Checkbox
                    label="Filtro de Aceite"
                    name="filtroAceite"
                    checked={formData.filtroAceite || false}
                    onChange={handleCheckboxChange}
                  />
                </div>
                
                {formData.filtroAceite && (
                  <Input
                    label="Notas (opcional)"
                    name="filtroAceiteNota"
                    value={formData.filtroAceiteNota || ''}
                    onChange={handleChange}
                    placeholder="Marca, tipo, observaciones..."
                    className="border-2 border-gray-300 rounded-md focus:border-primary-500 focus:ring focus:ring-primary-100 focus:ring-opacity-50 shadow-sm"
                  />
                )}
              </div>
              
              {/* Filtro de aire */}
              <div className="p-4 border-2 border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition duration-150">
                <div className="flex items-center mb-3">
                  <Checkbox
                    label="Filtro de Aire"
                    name="filtroAire"
                    checked={formData.filtroAire || false}
                    onChange={handleCheckboxChange}
                  />
                </div>
                
                {formData.filtroAire && (
                  <Input
                    label="Notas (opcional)"
                    name="filtroAireNota"
                    value={formData.filtroAireNota || ''}
                    onChange={handleChange}
                    placeholder="Marca, tipo, observaciones..."
                    className="border-2 border-gray-300 rounded-md focus:border-primary-500 focus:ring focus:ring-primary-100 focus:ring-opacity-50 shadow-sm"
                  />
                )}
              </div>
              
              {/* Filtro de habitáculo */}
              <div className="p-4 border-2 border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition duration-150">
                <div className="flex items-center mb-3">
                  <Checkbox
                    label="Filtro de Habitáculo"
                    name="filtroHabitaculo"
                    checked={formData.filtroHabitaculo || false}
                    onChange={handleCheckboxChange}
                  />
                </div>
                
                {formData.filtroHabitaculo && (
                  <Input
                    label="Notas (opcional)"
                    name="filtroHabitaculoNota"
                    value={formData.filtroHabitaculoNota || ''}
                    onChange={handleChange}
                    placeholder="Marca, tipo, observaciones..."
                    className="border-2 border-gray-300 rounded-md focus:border-primary-500 focus:ring focus:ring-primary-100 focus:ring-opacity-50 shadow-sm"
                  />
                )}
              </div>
              
              {/* Filtro de combustible */}
              <div className="p-4 border-2 border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition duration-150">
                <div className="flex items-center mb-3">
                  <Checkbox
                    label="Filtro de Combustible"
                    name="filtroCombustible"
                    checked={formData.filtroCombustible || false}
                    onChange={handleCheckboxChange}
                  />
                </div>
                
                {formData.filtroCombustible && (
                  <Input
                    label="Notas (opcional)"
                    name="filtroCombustibleNota"
                    value={formData.filtroCombustibleNota || ''}
                    onChange={handleChange}
                    placeholder="Marca, tipo, observaciones..."
                    className="border-2 border-gray-300 rounded-md focus:border-primary-500 focus:ring focus:ring-primary-100 focus:ring-opacity-50 shadow-sm"
                  />
                )}
              </div>
              
              {/* Aditivo */}
           {/* Aditivo */}
           <div className="p-4 border-2 border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition duration-150">
                <div className="flex items-center mb-3">
                  <Checkbox
                    label="Aditivo"
                    name="aditivo"
                    checked={formData.aditivo || false}
                    onChange={handleCheckboxChange}
                  />
                </div>
                
                {formData.aditivo && (
                  <Input
                    label="Notas (opcional)"
                    name="aditivoNota"
                    value={formData.aditivoNota || ''}
                    onChange={handleChange}
                    placeholder="Marca, tipo, observaciones..."
                    className="border-2 border-gray-300 rounded-md focus:border-primary-500 focus:ring focus:ring-primary-100 focus:ring-opacity-50 shadow-sm"
                  />
                )}
              </div>
              
              {/* Refrigerante */}
              <div className="p-4 border-2 border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition duration-150">
                <div className="flex items-center mb-3">
                  <Checkbox
                    label="Refrigerante"
                    name="refrigerante"
                    checked={formData.refrigerante || false}
                    onChange={handleCheckboxChange}
                  />
                </div>
                
                {formData.refrigerante && (
                  <Input
                    label="Notas (opcional)"
                    name="refrigeranteNota"
                    value={formData.refrigeranteNota || ''}
                    onChange={handleChange}
                    placeholder="Marca, tipo, observaciones..."
                    className="border-2 border-gray-300 rounded-md focus:border-primary-500 focus:ring focus:ring-primary-100 focus:ring-opacity-50 shadow-sm"
                  />
                )}
              </div>
              
              {/* Diferencial */}
              <div className="p-4 border-2 border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition duration-150">
                <div className="flex items-center mb-3">
                  <Checkbox
                    label="Diferencial"
                    name="diferencial"
                    checked={formData.diferencial || false}
                    onChange={handleCheckboxChange}
                  />
                </div>
                
                {formData.diferencial && (
                  <Input
                    label="Notas (opcional)"
                    name="diferencialNota"
                    value={formData.diferencialNota || ''}
                    onChange={handleChange}
                    placeholder="Marca, tipo, observaciones..."
                    className="border-2 border-gray-300 rounded-md focus:border-primary-500 focus:ring focus:ring-primary-100 focus:ring-opacity-50 shadow-sm"
                  />
                )}
              </div>
              
              {/* Caja */}
              <div className="p-4 border-2 border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition duration-150">
                <div className="flex items-center mb-3">
                  <Checkbox
                    label="Caja"
                    name="caja"
                    checked={formData.caja || false}
                    onChange={handleCheckboxChange}
                  />
                </div>
                
                {formData.caja && (
                  <Input
                    label="Notas (opcional)"
                    name="cajaNota"
                    value={formData.cajaNota || ''}
                    onChange={handleChange}
                    placeholder="Marca, tipo, observaciones..."
                    className="border-2 border-gray-300 rounded-md focus:border-primary-500 focus:ring focus:ring-primary-100 focus:ring-opacity-50 shadow-sm"
                  />
                )}
              </div>
              
              {/* Engrase */}
              <div className="p-4 border-2 border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition duration-150">
                <div className="flex items-center mb-3">
                  <Checkbox
                    label="Engrase"
                    name="engrase"
                    checked={formData.engrase || false}
                    onChange={handleCheckboxChange}
                  />
                </div>
                
                {formData.engrase && (
                  <Input
                    label="Notas (opcional)"
                    name="engraseNota"
                    value={formData.engraseNota || ''}
                    onChange={handleChange}
                    placeholder="Marca, tipo, observaciones..."
                    className="border-2 border-gray-300 rounded-md focus:border-primary-500 focus:ring focus:ring-primary-100 focus:ring-opacity-50 shadow-sm"
                  />
                )}
              </div>
            </div>
          </CardBody>
        </Card>
        
        {/* Observaciones */}
        <Card className="mb-6">
          <CardHeader title="Observaciones" />
          <CardBody>
            <Textarea
              label="Observaciones (opcional)"
              name="observaciones"
              value={formData.observaciones || ''}
              onChange={handleChange}
              placeholder="Ingrese cualquier observación adicional..."
              rows={4}
              className="border-2 border-gray-300 rounded-md focus:border-primary-500 focus:ring focus:ring-primary-100 focus:ring-opacity-50 shadow-sm"
            />
          </CardBody>
        </Card>
        
        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <Button
            type="button"
            color="secondary"
            variant="outline"
            onClick={() => navigate('/cambios-aceite')}
            icon={<ChevronLeftIcon className="h-5 w-5" />}
          >
            Cancelar
          </Button>
          
          <Button
            type="submit"
            color="primary"
            disabled={saving}
            icon={<PlusIcon className="h-5 w-5" />}
          >
            {saving ? (
              <>
                <Spinner size="sm" color="white" className="mr-2" />
                {isEditing ? 'Guardando cambios...' : 'Registrando cambio...'}
              </>
            ) : (
              isEditing ? 'Guardar Cambios' : 'Registrar Cambio'
            )}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
};

export default OilChangeFormPage;