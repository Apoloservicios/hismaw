// src/components/forms/EnhancedOilChangeForm.tsx
import React, { useState, useEffect } from 'react';
import { OilChange } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { validationMiddleware } from '../../middleware/validationMiddleware';
import ValidationGuard from '../common/ValidationGuard';

// Interfaz coherente con el tipo OilChange real del proyecto
interface OilChangeFormData {
  nombreCliente: string;
  celular: string;
  dominioVehiculo: string;
  marcaVehiculo: string;
  modeloVehiculo: string;
  tipoVehiculo: string;
  añoVehiculo: number;
  kmActuales: number;
  kmProximo: number;
  perioricidad_servicio: number; // En meses
  fechaProximoCambio: Date | null;
  marcaAceite: string;
  tipoAceite: string;
  sae: string;
  cantidadAceite: number;
  
  // Filtros y extras
  filtroAceite: boolean;
  filtroAceiteNota: string;
  filtroAire: boolean;
  filtroAireNota: string;
  filtroHabitaculo: boolean;
  filtroHabitaculoNota: string;
  filtroCombustible: boolean;
  filtroCombustibleNota: string;
  aditivo: boolean;
  aditivoNota: string;
  refrigerante: boolean;
  refrigeranteNota: string;
  diferencial: boolean;
  diferencialNota: string;
  caja: boolean;
  cajaNota: string;
  engrase: boolean;
  engraseNota: string;
  
  observaciones: string;
}

interface EnhancedOilChangeFormProps {
  onSubmit: (data: OilChangeFormData) => Promise<void>;
  initialData?: Partial<OilChangeFormData>;
  isLoading?: boolean;
  className?: string;
}

const VEHICLE_TYPES = [
  'Auto',
  'Camioneta',
  'Utilitario',
  'Camión',
  'Moto',
  'Otro'
];

const OIL_BRANDS = [
  'Mobil',
  'Shell',
  'Castrol',
  'Valvoline',
  'Total',
  'YPF',
  'Otro'
];

const OIL_TYPES = [
  'Mineral',
  'Semi-sintético',
  'Sintético'
];

const SAE_TYPES = [
  '5W-30',
  '10W-40',
  '15W-40',
  '20W-50',
  '0W-20',
  '5W-40'
];

export const EnhancedOilChangeForm: React.FC<EnhancedOilChangeFormProps> = ({
  onSubmit,
  initialData,
  isLoading = false,
  className = ''
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<OilChangeFormData>({
    nombreCliente: '',
    celular: '',
    dominioVehiculo: '',
    marcaVehiculo: '',
    modeloVehiculo: '',
    tipoVehiculo: 'Auto',
    añoVehiculo: new Date().getFullYear(),
    kmActuales: 0,
    kmProximo: 0,
    perioricidad_servicio: 6,
    fechaProximoCambio: null,
    marcaAceite: '',
    tipoAceite: '',
    sae: '',
    cantidadAceite: 4,
    filtroAceite: true,
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
    observaciones: '',
    ...initialData
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Calcular próximo servicio automáticamente
  useEffect(() => {
    if (formData.kmActuales > 0) {
      setFormData(prev => ({
        ...prev,
        kmProximo: prev.kmActuales + 10000
      }));
    }
  }, [formData.kmActuales]);

  // Calcular próxima fecha automáticamente
  useEffect(() => {
    if (formData.perioricidad_servicio > 0) {
      const nextDate = new Date();
      nextDate.setMonth(nextDate.getMonth() + formData.perioricidad_servicio);
      setFormData(prev => ({
        ...prev,
        fechaProximoCambio: nextDate
      }));
    }
  }, [formData.perioricidad_servicio]);

  // Validar formulario cuando cambian datos críticos
  useEffect(() => {
    if (formData.nombreCliente && formData.dominioVehiculo && user?.lubricentroId) {
      validateForm();
    }
  }, [formData.nombreCliente, formData.dominioVehiculo, user?.lubricentroId]);

  const validateForm = async () => {
    if (!user?.lubricentroId) return;
    
    setIsValidating(true);
    setErrors({});

    try {
      const validation = await validationMiddleware.validateServiceCreation({
        lubricentroId: user.lubricentroId,
        serviceType: 'oil_change',
        clientName: formData.nombreCliente,
        vehicleDomain: formData.dominioVehiculo
      });

      setValidationResult(validation);

      if (!validation.isValid) {
        const newErrors: Record<string, string> = {};
        validation.errors.forEach((error, index) => {
          newErrors[`validation_${index}`] = error;
        });
        setErrors(newErrors);
      }

    } catch (error) {
      console.error('Error validating form:', error);
      setErrors({ general: 'Error al validar formulario' });
    } finally {
      setIsValidating(false);
    }
  };

  const handleInputChange = (field: keyof OilChangeFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpiar error específico del campo
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateLocalForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombreCliente.trim()) {
      newErrors.nombreCliente = 'Nombre del cliente es requerido';
    }

    if (!formData.dominioVehiculo.trim()) {
      newErrors.dominioVehiculo = 'Dominio del vehículo es requerido';
    }

    if (!formData.marcaVehiculo.trim()) {
      newErrors.marcaVehiculo = 'Marca del vehículo es requerida';
    }

    if (!formData.modeloVehiculo.trim()) {
      newErrors.modeloVehiculo = 'Modelo del vehículo es requerido';
    }

    if (formData.añoVehiculo < 1900 || formData.añoVehiculo > new Date().getFullYear() + 1) {
      newErrors.añoVehiculo = 'Año del vehículo no válido';
    }

    if (formData.kmActuales < 0) {
      newErrors.kmActuales = 'Kilometraje no puede ser negativo';
    }

    if (!formData.marcaAceite) {
      newErrors.marcaAceite = 'Marca de aceite es requerida';
    }

    if (!formData.tipoAceite) {
      newErrors.tipoAceite = 'Tipo de aceite es requerido';
    }

    if (!formData.sae) {
      newErrors.sae = 'SAE es requerido';
    }

    if (formData.cantidadAceite <= 0 || formData.cantidadAceite > 20) {
      newErrors.cantidadAceite = 'Cantidad de aceite debe estar entre 1 y 20 litros';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateLocalForm()) {
      return;
    }

    if (!validationResult?.isValid) {
      await validateForm();
      if (!validationResult?.isValid) {
        return;
      }
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ general: 'Error al guardar el cambio de aceite' });
    }
  };

  return (
    <ValidationGuard 
      lubricentroId={user?.lubricentroId || undefined}
      action="create_service"
      className={className}
    >
      <div className="w-full max-w-6xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              Nuevo Cambio de Aceite
            </h2>
            <p className="text-gray-600 mt-1">
              Complete los datos del servicio realizado
            </p>
          </div>

          <div className="p-6">
            {/* Mostrar errores de validación */}
            {Object.keys(errors).length > 0 && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Errores de validación:
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <ul className="list-disc list-inside">
                        {Object.values(errors).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Datos del Cliente */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Datos del Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Cliente *
                    </label>
                    <input
                      type="text"
                      value={formData.nombreCliente}
                      onChange={(e) => handleInputChange('nombreCliente', e.target.value)}
                      placeholder="Nombre completo del cliente"
                      disabled={isLoading}
                      className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.nombreCliente ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Celular
                    </label>
                    <input
                      type="text"
                      value={formData.celular}
                      onChange={(e) => handleInputChange('celular', e.target.value)}
                      placeholder="Número de celular"
                      disabled={isLoading}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Datos del Vehículo */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Datos del Vehículo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dominio *
                    </label>
                    <input
                      type="text"
                      value={formData.dominioVehiculo}
                      onChange={(e) => handleInputChange('dominioVehiculo', e.target.value.toUpperCase())}
                      placeholder="ABC123"
                      disabled={isLoading}
                      className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.dominioVehiculo ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Marca *
                    </label>
                    <input
                      type="text"
                      value={formData.marcaVehiculo}
                      onChange={(e) => handleInputChange('marcaVehiculo', e.target.value)}
                      placeholder="Ford, Chevrolet, Toyota, etc."
                      disabled={isLoading}
                      className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.marcaVehiculo ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Modelo *
                    </label>
                    <input
                      type="text"
                      value={formData.modeloVehiculo}
                      onChange={(e) => handleInputChange('modeloVehiculo', e.target.value)}
                      placeholder="Focus, Onix, Corolla, etc."
                      disabled={isLoading}
                      className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.modeloVehiculo ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Vehículo
                    </label>
                    <select
                      value={formData.tipoVehiculo}
                      onChange={(e) => handleInputChange('tipoVehiculo', e.target.value)}
                      disabled={isLoading}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {VEHICLE_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Año *
                    </label>
                    <input
                      type="number"
                      value={formData.añoVehiculo}
                      onChange={(e) => handleInputChange('añoVehiculo', parseInt(e.target.value))}
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      disabled={isLoading}
                      className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.añoVehiculo ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Km Actuales *
                    </label>
                    <input
                      type="number"
                      value={formData.kmActuales}
                      onChange={(e) => handleInputChange('kmActuales', parseInt(e.target.value) || 0)}
                      min="0"
                      disabled={isLoading}
                      className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.kmActuales ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Datos del Aceite */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Datos del Aceite</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Marca de Aceite *
                    </label>
                    <select
                      value={formData.marcaAceite}
                      onChange={(e) => handleInputChange('marcaAceite', e.target.value)}
                      disabled={isLoading}
                      className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.marcaAceite ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Seleccionar marca</option>
                      {OIL_BRANDS.map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Aceite *
                    </label>
                    <select
                      value={formData.tipoAceite}
                      onChange={(e) => handleInputChange('tipoAceite', e.target.value)}
                      disabled={isLoading}
                      className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.tipoAceite ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Seleccionar tipo</option>
                      {OIL_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SAE *
                    </label>
                    <select
                      value={formData.sae}
                      onChange={(e) => handleInputChange('sae', e.target.value)}
                      disabled={isLoading}
                      className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.sae ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Seleccionar SAE</option>
                      {SAE_TYPES.map(sae => (
                        <option key={sae} value={sae}>{sae}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantidad (Litros) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.cantidadAceite}
                      onChange={(e) => handleInputChange('cantidadAceite', parseFloat(e.target.value) || 0)}
                      min="0.5"
                      max="20"
                      disabled={isLoading}
                      className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.cantidadAceite ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Próximo Servicio */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Próximo Servicio</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Km Próximo Servicio
                    </label>
                    <input
                      type="number"
                      value={formData.kmProximo}
                      onChange={(e) => handleInputChange('kmProximo', parseInt(e.target.value) || 0)}
                      min={formData.kmActuales}
                      disabled={isLoading}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Periodicidad (Meses)
                    </label>
                    <select
                      value={formData.perioricidad_servicio}
                      onChange={(e) => handleInputChange('perioricidad_servicio', parseInt(e.target.value))}
                      disabled={isLoading}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {[3, 4, 5, 6, 9, 12, 18, 24].map(months => (
                        <option key={months} value={months}>
                          {months} {months === 1 ? 'mes' : 'meses'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha Próximo Cambio
                    </label>
                    <input
                      type="date"
                      value={formData.fechaProximoCambio ? formData.fechaProximoCambio.toISOString().split('T')[0] : ''}
                      onChange={(e) => handleInputChange('fechaProximoCambio', e.target.value ? new Date(e.target.value) : null)}
                      disabled={isLoading}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Filtros y Servicios */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros y Servicios Adicionales</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Filtro de Aceite */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.filtroAceite}
                      onChange={(e) => handleInputChange('filtroAceite', e.target.checked)}
                      disabled={isLoading}
                      className="rounded border-gray-300"
                    />
                    <label className="text-sm font-medium text-gray-700">Filtro de Aceite</label>
                    {formData.filtroAceite && (
                      <input
                        type="text"
                        value={formData.filtroAceiteNota}
                        onChange={(e) => handleInputChange('filtroAceiteNota', e.target.value)}
                        placeholder="Nota..."
                        className="ml-2 p-1 border border-gray-300 rounded text-sm flex-1"
                        disabled={isLoading}
                      />
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.filtroAire}
                      onChange={(e) => handleInputChange('filtroAire', e.target.checked)}
                      disabled={isLoading}
                      className="rounded border-gray-300"
                    />
                    <label className="text-sm font-medium text-gray-700">Filtro de Aire</label>
                    {formData.filtroAire && (
                      <input
                        type="text"
                        value={formData.filtroAireNota}
                        onChange={(e) => handleInputChange('filtroAireNota', e.target.value)}
                        placeholder="Nota..."
                        className="ml-2 p-1 border border-gray-300 rounded text-sm flex-1"
                        disabled={isLoading}
                      />
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.filtroHabitaculo}
                      onChange={(e) => handleInputChange('filtroHabitaculo', e.target.checked)}
                      disabled={isLoading}
                      className="rounded border-gray-300"
                    />
                    <label className="text-sm font-medium text-gray-700">Filtro Habitáculo</label>
                    {formData.filtroHabitaculo && (
                      <input
                        type="text"
                        value={formData.filtroHabitaculoNota}
                        onChange={(e) => handleInputChange('filtroHabitaculoNota', e.target.value)}
                        placeholder="Nota..."
                        className="ml-2 p-1 border border-gray-300 rounded text-sm flex-1"
                        disabled={isLoading}
                      />
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.filtroCombustible}
                      onChange={(e) => handleInputChange('filtroCombustible', e.target.checked)}
                      disabled={isLoading}
                      className="rounded border-gray-300"
                    />
                    <label className="text-sm font-medium text-gray-700">Filtro Combustible</label>
                    {formData.filtroCombustible && (
                      <input
                        type="text"
                        value={formData.filtroCombustibleNota}
                        onChange={(e) => handleInputChange('filtroCombustibleNota', e.target.value)}
                        placeholder="Nota..."
                        className="ml-2 p-1 border border-gray-300 rounded text-sm flex-1"
                        disabled={isLoading}
                      />
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.aditivo}
                      onChange={(e) => handleInputChange('aditivo', e.target.checked)}
                      disabled={isLoading}
                      className="rounded border-gray-300"
                    />
                    <label className="text-sm font-medium text-gray-700">Aditivo</label>
                    {formData.aditivo && (
                      <input
                        type="text"
                        value={formData.aditivoNota}
                        onChange={(e) => handleInputChange('aditivoNota', e.target.value)}
                        placeholder="Nota..."
                        className="ml-2 p-1 border border-gray-300 rounded text-sm flex-1"
                        disabled={isLoading}
                      />
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.engrase}
                      onChange={(e) => handleInputChange('engrase', e.target.checked)}
                      disabled={isLoading}
                      className="rounded border-gray-300"
                    />
                    <label className="text-sm font-medium text-gray-700">Engrase</label>
                    {formData.engrase && (
                      <input
                        type="text"
                        value={formData.engraseNota}
                        onChange={(e) => handleInputChange('engraseNota', e.target.value)}
                        placeholder="Nota..."
                        className="ml-2 p-1 border border-gray-300 rounded text-sm flex-1"
                        disabled={isLoading}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => handleInputChange('observaciones', e.target.value)}
                  placeholder="Observaciones adicionales sobre el servicio..."
                  rows={3}
                  disabled={isLoading}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => window.history.back()}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                
                <button
                  type="submit"
                  disabled={isLoading || isValidating || !validationResult?.isValid}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Cambio'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ValidationGuard>
  );
};