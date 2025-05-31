// src/components/forms/EnhancedOilChangeForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PageContainer, Card, CardHeader, CardBody, Button, Alert } from '../ui';
import ValidationGuard, { ServiceCreationGuard } from '../common/ValidationGuard';
import { useServiceValidation } from '../../hooks/useValidation';
import { createOilChangeWithValidation } from '../../services/enhancedOilChangeService';
import { OilChange } from '../../types';

// Iconos
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  WrenchIcon 
} from '@heroicons/react/24/outline';

const EnhancedOilChangeForm: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  // Estados del formulario
  const [formData, setFormData] = useState<Partial<OilChange>>({
    lubricentroId: userProfile?.lubricentroId || '',
    operatorId: userProfile?.id || '',
    nombreOperario: `${userProfile?.nombre} ${userProfile?.apellido}`,
    fechaServicio: new Date(),
    perioricidad_servicio: 6
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // ✅ USAR HOOK DE VALIDACIÓN ESPECÍFICO
  const validation = useServiceValidation(userProfile?.lubricentroId);
  
  const handleInputChange = (field: keyof OilChange, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userProfile) {
      setSubmitError('Usuario no autenticado');
      return;
    }
    
    // ✅ VALIDAR ANTES DE ENVIAR
    const validationResult = await validation.validate();
    
    if (!validationResult.canProceed) {
      setSubmitError(validationResult.message);
      return;
    }
    
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      
      // ✅ USAR SERVICIO CON VALIDACIONES INTEGRADAS
      const oilChangeId = await createOilChangeWithValidation(
        formData as Omit<OilChange, 'id' | 'createdAt'>,
        userProfile
      );
      
      setSubmitSuccess(true);
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate(`/cambios-aceite/${oilChangeId}`);
      }, 2000);
      
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Error al crear el cambio de aceite');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Mostrar success si se creó exitosamente
  if (submitSuccess) {
    return (
      <PageContainer title="Cambio de Aceite Creado">
        <div className="max-w-md mx-auto">
          <Alert type="success">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              <div>
                <h3 className="font-medium">¡Cambio de aceite registrado exitosamente!</h3>
                <p className="text-sm mt-1">Redirigiendo a los detalles...</p>
              </div>
            </div>
          </Alert>
        </div>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer
      title="Nuevo Cambio de Aceite"
      subtitle="Registrar un nuevo servicio de cambio de aceite"
    >
      {/* ✅ PROTEGER TODO EL FORMULARIO CON VALIDACIONES */}
      <ServiceCreationGuard lubricentroId={userProfile?.lubricentroId}>
        <div className="max-w-4xl mx-auto">
          
          {/* Información de validación en tiempo real */}
          {validation.error && (
            <Alert type="warning" className="mb-6">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium">Restricción Activa</h4>
                  <p className="text-sm mt-1">{validation.error}</p>
                  {validation.details && (
                    <div className="mt-2 text-xs bg-yellow-50 p-2 rounded">
                      <p>Plan: {validation.details.planName}</p>
                      {validation.details.currentServices !== undefined && validation.details.maxServices && (
                        <p>Servicios: {validation.details.currentServices} / {validation.details.maxServices}</p>
                      )}
                      {validation.details.daysRemaining !== undefined && (
                        <p>Días restantes: {validation.details.daysRemaining}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Alert>
          )}
          
          {/* Indicador de estado de validación */}
          <Card className="mb-6 border-l-4 border-l-green-500">
            <CardBody>
              <div className="flex items-center">
                <div className="rounded-full p-2 bg-green-100 mr-3">
                  <WrenchIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-green-800">Validaciones del Sistema</h3>
                  <div className="text-sm text-green-700 mt-1">
                    {validation.isValidating ? (
                      <span>Verificando permisos...</span>
                    ) : validation.canProceed ? (
                      <span>✅ Listo para crear servicios</span>
                    ) : (
                      <span>⚠️ Restricciones activas</span>
                    )}
                  </div>
                  {validation.details && (
                    <div className="text-xs text-green-600 mt-1">
                      Servicios disponibles: {validation.details.maxServices ? 
                        `${Math.max(0, validation.details.maxServices - validation.details.currentServices)}` : 
                        'Ilimitados'
                      }
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
          
          {/* Formulario principal */}
          <Card>
            <CardHeader 
              title="Datos del Servicio"
              subtitle="Complete la información del cambio de aceite"
            />
            <CardBody>
              {submitError && (
                <Alert type="error" className="mb-4">
                  {submitError}
                </Alert>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Información del cliente */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Cliente *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={formData.nombreCliente || ''}
                      onChange={(e) => handleInputChange('nombreCliente', e.target.value)}
                      placeholder="Ej: Juan Pérez"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono del Cliente
                    </label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={formData.telefonoCliente || ''}
                      onChange={(e) => handleInputChange('telefonoCliente', e.target.value)}
                      placeholder="Ej: +54 9 11 1234-5678"
                    />
                  </div>
                </div>
                
                {/* Información del vehículo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dominio del Vehículo *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 uppercase"
                      value={formData.dominioVehiculo || ''}
                      onChange={(e) => handleInputChange('dominioVehiculo', e.target.value.toUpperCase())}
                      placeholder="Ej: ABC123"
                      maxLength={8}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Marca del Vehículo *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={formData.marcaVehiculo || ''}
                      onChange={(e) => handleInputChange('marcaVehiculo', e.target.value)}
                      placeholder="Ej: Toyota"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Modelo del Vehículo *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={formData.modeloVehiculo || ''}
                      onChange={(e) => handleInputChange('modeloVehiculo', e.target.value)}
                      placeholder="Ej: Corolla"
                    />
                  </div>
                </div>
                
                {/* Información del servicio */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha del Servicio *
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={formData.fechaServicio ? 
                        new Date(formData.fechaServicio).toISOString().split('T')[0] : 
                        ''
                      }
                      onChange={(e) => handleInputChange('fechaServicio', new Date(e.target.value))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Periodicidad (meses) *
                    </label>
                    <select
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={formData.perioricidad_servicio || 6}
                      onChange={(e) => handleInputChange('perioricidad_servicio', parseInt(e.target.value))}
                    >
                      <option value={3}>3 meses</option>
                      <option value={6}>6 meses</option>
                      <option value={12}>12 meses</option>
                    </select>
                  </div>
                </div>
                
                {/* Observaciones */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observaciones
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={formData.observaciones || ''}
                    onChange={(e) => handleInputChange('observaciones', e.target.value)}
                    placeholder="Observaciones adicionales sobre el servicio..."
                  />
                </div>
                
                {/* Botones de acción */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/cambios-aceite')}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  
                  <Button
                    type="submit"
                    color="primary"
                    disabled={isSubmitting || !validation.canProceed}
                    icon={isSubmitting ? undefined : <WrenchIcon className="h-4 w-4" />}
                  >
                    {isSubmitting ? 'Guardando...' : 'Registrar Cambio'}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </ServiceCreationGuard>
    </PageContainer>
  );
};

export default EnhancedOilChangeForm;