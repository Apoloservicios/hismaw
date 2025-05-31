// src/pages/admin/LubricentroSubscriptionPage.tsx - CORRECCIONES DE TIPOS
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Tabs,
  Input,
  Select,
  Modal,
  Checkbox
} from '../../components/ui';

import { 
  getLubricentroById,
  updateLubricentroStatus,
  updateLubricentro
} from '../../services/lubricentroService';

import {
  recordPayment
} from '../../services/subscriptionService';

import { Lubricentro, CustomSubscriptionConfig } from '../../types'; // ✅ IMPORTAR CustomSubscriptionConfig
import { SUBSCRIPTION_PLANS, SubscriptionPlanType } from '../../types/subscription';

import { 
  BuildingOfficeIcon,
  CreditCardIcon,
  CalendarDaysIcon,
  ClockIcon,
  ChevronLeftIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  DocumentCheckIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

// Componente para configuración manual
const ManualConfigModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: any) => Promise<void>;
  lubricentro: Lubricentro | null;
  loading: boolean;
}> = ({ isOpen, onClose, onSave, lubricentro, loading }) => {
  const [config, setConfig] = useState({
    maxUsers: 2,
    maxMonthlyServices: 50,
    isUnlimitedServices: false,
    customPrice: 0,
    renewalType: 'monthly' as 'monthly' | 'semiannual',
    autoRenewal: true,
    customPlanName: '',
    estado: 'activo' as 'activo' | 'inactivo' | 'trial'
  });

  useEffect(() => {
    if (lubricentro) {
      setConfig({
        maxUsers: lubricentro.subscriptionPlan 
          ? SUBSCRIPTION_PLANS[lubricentro.subscriptionPlan].maxUsers 
          : lubricentro.activeUserCount || 2,
        maxMonthlyServices: lubricentro.subscriptionPlan 
          ? SUBSCRIPTION_PLANS[lubricentro.subscriptionPlan].maxMonthlyServices || 50
          : 50,
        isUnlimitedServices: lubricentro.subscriptionPlan 
          ? SUBSCRIPTION_PLANS[lubricentro.subscriptionPlan].maxMonthlyServices === null
          : false,
        customPrice: lubricentro.subscriptionPlan 
          ? SUBSCRIPTION_PLANS[lubricentro.subscriptionPlan].price.monthly
          : 0,
        renewalType: lubricentro.subscriptionRenewalType || 'monthly',
        autoRenewal: lubricentro.autoRenewal !== false,
        customPlanName: lubricentro.subscriptionPlan 
          ? `${SUBSCRIPTION_PLANS[lubricentro.subscriptionPlan].name} (Personalizado)`
          : 'Plan Personalizado',
        estado: lubricentro.estado
      });
    }
  }, [lubricentro]);

  const handleSave = async () => {
    await onSave(config);
  };

  if (!lubricentro) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Configuración Manual de Suscripción"
      size="lg"
      footer={
        <div className="flex justify-end space-x-2">
          <Button color="secondary" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button color="primary" onClick={handleSave} disabled={loading}>
            {loading ? <><Spinner size="sm" color="white" className="mr-2" />Guardando...</> : 'Guardar Configuración'}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <Alert type="info">
          <strong>Configuración Manual:</strong> Estos ajustes personalizados tendrán prioridad sobre cualquier plan estándar.
        </Alert>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Estado del Lubricentro</label>
          <Select
            label=""
            name="estado"
            value={config.estado}
            onChange={(e) => setConfig({ ...config, estado: e.target.value as any })}
            options={[
              { value: 'activo', label: 'Activo - Acceso completo' },
              { value: 'trial', label: 'Período de Prueba' },
              { value: 'inactivo', label: 'Inactivo - Sin acceso' }
            ]}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Máximo de Usuarios"
            name="maxUsers"
            type="number"
            value={config.maxUsers.toString()}
            onChange={(e) => setConfig({ ...config, maxUsers: parseInt(e.target.value) || 1 })}
            required
            helperText="Número máximo de usuarios que pueden acceder"
          />
          <Input
            label="Precio Mensual (ARS)"
            name="customPrice"
            type="number"
            value={config.customPrice.toString()}
            onChange={(e) => setConfig({ ...config, customPrice: parseInt(e.target.value) || 0 })}
            helperText="Precio mensual personalizado"
          />
        </div>

        <div className="space-y-4">
          <Checkbox
            label="Servicios mensuales ilimitados"
            name="isUnlimitedServices"
            checked={config.isUnlimitedServices}
            onChange={(e) => setConfig({ ...config, isUnlimitedServices: e.target.checked })}
          />
          
          {!config.isUnlimitedServices && (
            <Input
              label="Máximo de Servicios por Mes"
              name="maxMonthlyServices"
              type="number"
              value={config.maxMonthlyServices.toString()}
              onChange={(e) => setConfig({ ...config, maxMonthlyServices: parseInt(e.target.value) || 1 })}
              helperText="Cantidad máxima de cambios de aceite por mes"
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Ciclo de Facturación"
            name="renewalType"
            value={config.renewalType}
            onChange={(e) => setConfig({ ...config, renewalType: e.target.value as any })}
            options={[
              { value: 'monthly', label: 'Mensual' },
              { value: 'semiannual', label: 'Semestral' }
            ]}
          />
          <div className="flex items-center pt-8">
            <Checkbox
              label="Renovación automática"
              name="autoRenewal"
              checked={config.autoRenewal}
              onChange={(e) => setConfig({ ...config, autoRenewal: e.target.checked })}
            />
          </div>
        </div>

        <Input
          label="Nombre del Plan Personalizado"
          name="customPlanName"
          value={config.customPlanName}
          onChange={(e) => setConfig({ ...config, customPlanName: e.target.value })}
          helperText="Nombre descriptivo para esta configuración personalizada"
        />

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Resumen de Configuración</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Estado:</span>
              <span className="ml-2 font-medium">{config.estado}</span>
            </div>
            <div>
              <span className="text-gray-600">Usuarios:</span>
              <span className="ml-2 font-medium">{config.maxUsers}</span>
            </div>
            <div>
              <span className="text-gray-600">Servicios:</span>
              <span className="ml-2 font-medium">
                {config.isUnlimitedServices ? 'Ilimitados' : config.maxMonthlyServices}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Precio:</span>
              <span className="ml-2 font-medium">${config.customPrice.toLocaleString()}/mes</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// Componente para aplicar plan estándar
const ApplyPlanModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onApply: (planId: SubscriptionPlanType) => Promise<void>;
  lubricentro: Lubricentro | null;
  loading: boolean;
}> = ({ isOpen, onClose, onApply, lubricentro, loading }) => {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanType>('basic');

  const handleApply = async () => {
    await onApply(selectedPlan);
  };

  if (!lubricentro) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Aplicar Plan Estándar"
      size="lg"
      footer={
        <div className="flex justify-end space-x-2">
          <Button color="secondary" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button color="primary" onClick={handleApply} disabled={loading}>
            {loading ? <><Spinner size="sm" color="white" className="mr-2" />Aplicando...</> : 'Aplicar Plan'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Alert type="info">
          <strong>Aplicar Plan Estándar:</strong> Esto configurará automáticamente los límites y precios según el plan seleccionado.
        </Alert>

        <div className="grid grid-cols-1 gap-4">
          {Object.entries(SUBSCRIPTION_PLANS).map(([planId, plan]) => (
            <div 
              key={planId}
              className={`border rounded-lg p-4 cursor-pointer transition-all
                ${selectedPlan === planId ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'}`}
              onClick={() => setSelectedPlan(planId as SubscriptionPlanType)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                    {plan.recommended && <Badge color="info" text="Recomendado" className="ml-2" />}
                    {selectedPlan === planId && <CheckIcon className="h-5 w-5 text-primary-600 ml-2" />}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                  
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Precio:</span>
                      <span className="ml-1 font-medium">${plan.price.monthly.toLocaleString()}/mes</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Usuarios:</span>
                      <span className="ml-1 font-medium">{plan.maxUsers}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Servicios:</span>
                      <span className="ml-1 font-medium">
                        {plan.maxMonthlyServices === null ? 'Ilimitados' : plan.maxMonthlyServices}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Semestral:</span>
                      <span className="ml-1 font-medium">${plan.price.semiannual.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

// Componente para registrar pago
const RecordPaymentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, method: string, reference: string) => Promise<void>;
  lubricentro: Lubricentro | null;
  loading: boolean;
}> = ({ isOpen, onClose, onConfirm, lubricentro, loading }) => {
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState('transferencia');
  const [reference, setReference] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (amount <= 0) {
      setError('El monto debe ser mayor a cero');
      return;
    }

    if (!reference.trim()) {
      setError('La referencia de pago es obligatoria');
      return;
    }

    try {
      await onConfirm(amount, method, reference);
    } catch (err: any) {
      setError(err.message || 'Error al registrar el pago');
    }
  };

  if (!lubricentro) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Registrar Pago"
      size="md"
      footer={
        <div className="flex justify-end space-x-2">
          <Button color="secondary" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button color="success" onClick={handleSubmit} disabled={loading}>
            {loading ? <><Spinner size="sm" color="white" className="mr-2" />Procesando...</> : 'Registrar Pago'}
          </Button>
        </div>
      }
    >
      {error && (
        <Alert type="error" className="mb-4" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className="space-y-4">
        <Input
          label="Monto"
          name="amount"
          type="number"
          value={amount.toString()}
          onChange={(e) => setAmount(Number(e.target.value))}
          required
          helperText="Monto del pago en pesos"
        />

        <Select
          label="Método de Pago"
          name="method"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          options={[
            { value: 'transferencia', label: 'Transferencia Bancaria' },
            { value: 'tarjeta', label: 'Tarjeta de Crédito/Débito' },
            { value: 'efectivo', label: 'Efectivo' },
            { value: 'mercadopago', label: 'MercadoPago' },
            { value: 'otro', label: 'Otro' }
          ]}
        />

        <Input
          label="Referencia"
          name="reference"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          required
          helperText="Número de transacción, últimos 4 dígitos de tarjeta, etc."
        />
      </div>
    </Modal>
  );
};

// Componente principal
const LubricentroSubscriptionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lubricentro, setLubricentro] = useState<Lubricentro | null>(null);
  const [activeTab, setActiveTab] = useState('config');
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isManualConfigModalOpen, setIsManualConfigModalOpen] = useState(false);
  const [isApplyPlanModalOpen, setIsApplyPlanModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);
  
  const loadData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const lubricentroData = await getLubricentroById(id);
      setLubricentro(lubricentroData);
      
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar los datos del lubricentro. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChangeStatus = async (status: 'activo' | 'inactivo') => {
    if (!id) return;
    
    try {
      setProcessing(true);
      await updateLubricentroStatus(id, status);
      await loadData();
      setSuccess(`Estado del lubricentro cambiado a ${status === 'activo' ? 'Activo' : 'Inactivo'}`);
    } catch (err) {
      console.error('Error al cambiar el estado:', err);
      setError('Error al cambiar el estado del lubricentro');
    } finally {
      setProcessing(false);
    }
  };
  
  const handleManualConfig = async (config: any) => {
    if (!lubricentro) return;
    
    try {
      setProcessing(true);
      
      const now = new Date();
      const endDate = new Date(now);
      
      if (config.renewalType === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 6);
      }
      
      await updateLubricentro(lubricentro.id, {
        estado: config.estado,
        subscriptionPlan: undefined, // ✅ CAMBIAR: usar undefined en lugar de null
        customSubscriptionConfig: {
          maxUsers: config.maxUsers,
          maxMonthlyServices: config.isUnlimitedServices ? null : config.maxMonthlyServices,
          price: config.customPrice,
          planName: config.customPlanName
        },
        subscriptionRenewalType: config.renewalType,
        autoRenewal: config.autoRenewal,
        subscriptionEndDate: config.estado === 'activo' ? endDate : undefined, // ✅ CAMBIAR: usar undefined
        nextPaymentDate: config.estado === 'activo' ? endDate : undefined, // ✅ CAMBIAR: usar undefined
        paymentStatus: config.estado === 'activo' ? 'paid' : 'pending'
      });
      
      await loadData();
      setIsManualConfigModalOpen(false);
      setSuccess('Configuración personalizada aplicada correctamente');
    } catch (err: any) {
      console.error('Error al aplicar configuración manual:', err);
      setError(`Error al aplicar la configuración: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };
  
  const handleApplyPlan = async (planId: SubscriptionPlanType) => {
    if (!lubricentro) return;
    
    try {
      setProcessing(true);
      
      const plan = SUBSCRIPTION_PLANS[planId];
      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1);
      
      await updateLubricentro(lubricentro.id, {
        estado: 'activo',
        subscriptionPlan: planId,
        customSubscriptionConfig: undefined, // ✅ CAMBIAR: usar undefined
        subscriptionStartDate: now,
        subscriptionEndDate: endDate,
        subscriptionRenewalType: 'monthly',
        nextPaymentDate: endDate,
        autoRenewal: true,
        paymentStatus: 'paid'
      });
      
      await loadData();
      setIsApplyPlanModalOpen(false);
      setSuccess(`Plan ${plan.name} aplicado correctamente`);
    } catch (err: any) {
      console.error('Error al aplicar plan:', err);
      setError(`Error al aplicar el plan: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };
  
  const handleRecordPayment = async (amount: number, method: string, reference: string) => {
    if (!lubricentro) return;
    
    try {
      setProcessing(true);
      await recordPayment(lubricentro.id, amount, method, reference);
      await loadData();
      setIsPaymentModalOpen(false);
      setSuccess('Pago registrado correctamente');
    } catch (err: any) {
      console.error('Error al registrar el pago:', err);
      setError(`Error al registrar el pago: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };
  
  const formatDate = (date: any): string => {
    if (!date) return 'No disponible';
    
    try {
      const dateObj = typeof date.toDate === 'function' ? date.toDate() : new Date(date);
      
      if (isNaN(dateObj.getTime())) {
        return 'Fecha inválida';
      }
      
      return dateObj.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };
  
  const getCurrentConfig = () => {
    if (!lubricentro) return null;
    
    if (lubricentro.customSubscriptionConfig) {
      return {
        type: 'custom',
        name: lubricentro.customSubscriptionConfig.planName || 'Configuración Personalizada',
        maxUsers: lubricentro.customSubscriptionConfig.maxUsers,
        maxServices: lubricentro.customSubscriptionConfig.maxMonthlyServices,
        price: lubricentro.customSubscriptionConfig.price
      };
    }
    
    if (lubricentro.subscriptionPlan) {
      const plan = SUBSCRIPTION_PLANS[lubricentro.subscriptionPlan];
      return {
        type: 'standard',
        name: plan.name,
        maxUsers: plan.maxUsers,
        maxServices: plan.maxMonthlyServices,
        price: plan.price.monthly
      };
    }
    
    return null;
  };
  
  const currentConfig = getCurrentConfig();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-80">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (error || !lubricentro) {
    return (
      <PageContainer title="Gestión de Suscripción">
        <Alert type="error" className="mb-4">
          {error || 'No se encontró el lubricentro solicitado.'}
        </Alert>
        <Button
          color="primary"
          onClick={() => navigate('/superadmin/lubricentros')}
          icon={<ChevronLeftIcon className="h-5 w-5" />}
        >
          Volver a la lista
        </Button>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer
      title={`Suscripción: ${lubricentro.fantasyName}`}
      subtitle="Configuración flexible de suscripción y límites"
      action={
        <div className="flex space-x-2">
          <Button
            color="info"
            onClick={() => setIsApplyPlanModalOpen(true)}
            icon={<CreditCardIcon className="h-5 w-5" />}
          >
            Aplicar Plan
          </Button>
          <Button
            color="primary"
            onClick={() => setIsManualConfigModalOpen(true)}
            icon={<CogIcon className="h-5 w-5" />}
          >
            Configuración Manual
          </Button>
          <Button
            color="success"
            onClick={() => setIsPaymentModalOpen(true)}
            icon={<CurrencyDollarIcon className="h-5 w-5" />}
          >
            Registrar Pago
          </Button>
        </div>
      }
    >
      {error && (
        <Alert type="error" className="mb-6" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert type="success" className="mb-6" dismissible onDismiss={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      
      {/* Estado actual de la suscripción */}
      <Card className="mb-6">
        <CardHeader title="Estado Actual de la Suscripción" />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center">
              <div className="mr-4">
                {lubricentro.estado === 'activo' ? (
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckIcon className="h-6 w-6 text-green-600" />
                  </div>
                ) : lubricentro.estado === 'trial' ? (
                  <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                    <ClockIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                    <XMarkIcon className="h-6 w-6 text-red-600" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <p className="text-lg font-medium capitalize">{lubricentro.estado}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Configuración</p>
              <p className="text-lg font-medium">
                {currentConfig ? currentConfig.name : 'Sin configurar'}
              </p>
              <p className="text-xs text-gray-500">
                {currentConfig?.type === 'custom' ? 'Personalizada' : 'Plan Estándar'}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Límites Actuales</p>
              <p className="text-sm">
                <span className="font-medium">{currentConfig?.maxUsers || 0}</span> usuarios,{' '}
                <span className="font-medium">
                  {currentConfig?.maxServices === null ? 'ilimitados' : currentConfig?.maxServices || 0}
                </span> servicios
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Precio Mensual</p>
              <p className="text-lg font-medium">
                ${currentConfig?.price?.toLocaleString() || 0}
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex space-x-3">
            {lubricentro.estado !== 'activo' && (
              <Button
                color="success"
                onClick={() => handleChangeStatus('activo')}
                disabled={processing}
                icon={<CheckIcon className="h-5 w-5" />}
              >
                Activar
              </Button>
            )}
            
            {lubricentro.estado === 'activo' && (
              <Button
                color="error"
                onClick={() => handleChangeStatus('inactivo')}
                disabled={processing}
                icon={<XMarkIcon className="h-5 w-5" />}
              >
                Desactivar
              </Button>
            )}
            
            <Button
              color="primary"
              variant="outline"
              onClick={() => setIsManualConfigModalOpen(true)}
              icon={<PencilIcon className="h-5 w-5" />}
            >
              Editar Configuración
            </Button>
          </div>
        </CardBody>
      </Card>
      
      {/* Pestañas */}
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'config', label: 'Configuración' },
          { id: 'payments', label: 'Pagos' },
          { id: 'usage', label: 'Uso' }
        ]}
        className="mb-6"
      />
      
      {/* Configuración */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="Configuración Actual" />
            <CardBody>
              {currentConfig ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Tipo de Configuración:</span>
                    <Badge 
                      color={currentConfig.type === 'custom' ? 'warning' : 'info'} 
                      text={currentConfig.type === 'custom' ? 'Personalizada' : 'Plan Estándar'}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Nombre:</span>
                    <span className="font-medium">{currentConfig.name}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Máximo de Usuarios:</span>
                    <span className="font-medium">{currentConfig.maxUsers}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Servicios Mensuales:</span>
                    <span className="font-medium">
                      {currentConfig.maxServices === null ? 'Ilimitados' : currentConfig.maxServices}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Precio Mensual:</span>
                    <span className="font-medium">${currentConfig.price?.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Ciclo de Facturación:</span>
                    <span className="font-medium">
                      {lubricentro.subscriptionRenewalType === 'semiannual' ? 'Semestral' : 'Mensual'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Renovación Automática:</span>
                    <Badge 
                      color={lubricentro.autoRenewal !== false ? 'success' : 'warning'} 
                      text={lubricentro.autoRenewal !== false ? 'Activada' : 'Desactivada'}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CogIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Sin Configuración</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Este lubricentro no tiene una configuración de suscripción establecida.
                  </p>
                  <div className="mt-6 flex justify-center space-x-3">
                    <Button color="primary" onClick={() => setIsApplyPlanModalOpen(true)}>
                      Aplicar Plan Estándar
                    </Button>
                    <Button color="secondary" variant="outline" onClick={() => setIsManualConfigModalOpen(true)}>
                      Configuración Manual
                    </Button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
          
          <Card>
            <CardHeader title="Acciones Rápidas" />
            <CardBody>
              <div className="space-y-3">
                <Button
                  color="primary"
                  fullWidth
                  onClick={() => setIsManualConfigModalOpen(true)}
                  icon={<CogIcon className="h-5 w-5" />}
                >
                  Configuración Manual
                </Button>
                
                <Button
                  color="info"
                  fullWidth
                  onClick={() => setIsApplyPlanModalOpen(true)}
                  icon={<CreditCardIcon className="h-5 w-5" />}
                >
                  Aplicar Plan Estándar
                </Button>
                
                <Button
                  color="success"
                  fullWidth
                  onClick={() => setIsPaymentModalOpen(true)}
                  icon={<CurrencyDollarIcon className="h-5 w-5" />}
                >
                  Registrar Pago
                </Button>
                
                <hr />
                
                <Button
                  color="secondary"
                  variant="outline"
                  fullWidth
                  onClick={() => navigate('/superadmin/suscripciones/planes')}
                  icon={<DocumentCheckIcon className="h-5 w-5" />}
                >
                  Gestionar Planes
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
      
      {/* Historial de Pagos */}
      {activeTab === 'payments' && (
        <Card>
          <CardHeader 
            title="Historial de Pagos" 
            subtitle="Registro de pagos realizados"
            action={
              <Button
                size="sm"
                color="success"
                onClick={() => setIsPaymentModalOpen(true)}
                icon={<CurrencyDollarIcon className="h-4 w-4" />}
              >
                Registrar Pago
              </Button>
            }
          />
          <CardBody>
            {lubricentro.paymentHistory && lubricentro.paymentHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Método
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Referencia
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[...lubricentro.paymentHistory]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((payment, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(payment.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${payment.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.method === 'transferencia' ? 'Transferencia Bancaria' :
                             payment.method === 'tarjeta' ? 'Tarjeta de Crédito/Débito' :
                             payment.method === 'efectivo' ? 'Efectivo' :
                             payment.method === 'mercadopago' ? 'MercadoPago' :
                             payment.method}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.reference}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay pagos registrados</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Comience registrando un pago para este lubricentro.
                </p>
                <div className="mt-6">
                  <Button color="success" onClick={() => setIsPaymentModalOpen(true)}>
                    Registrar Pago
                  </Button>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}
      
      {/* Uso del Servicio */}
      {activeTab === 'usage' && (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Uso Actual" />
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Usuarios Activos</label>
                  <div className="mt-1 flex items-end">
                    <span className="text-3xl font-bold text-gray-900">
                      {lubricentro.activeUserCount || 0}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">
                      / {currentConfig?.maxUsers || 0}
                    </span>
                  </div>
                  
                  {currentConfig && (
                    <div className="mt-2">
                      <div className="bg-gray-200 rounded-full h-2.5 w-full">
                        <div 
                          className="bg-primary-600 h-2.5 rounded-full" 
                          style={{ 
                            width: `${Math.min(100, ((lubricentro.activeUserCount || 0) / currentConfig.maxUsers) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {Math.max(0, currentConfig.maxUsers - (lubricentro.activeUserCount || 0))} usuarios disponibles
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Servicios Este Mes</label>
                  <div className="mt-1 flex items-end">
                    <span className="text-3xl font-bold text-gray-900">
                      {lubricentro.servicesUsedThisMonth || 0}
                    </span>
                    {currentConfig && currentConfig.maxServices !== null && (
                      <span className="ml-2 text-sm text-gray-500">
                        / {currentConfig.maxServices}
                      </span>
                    )}
                  </div>

                  {currentConfig && currentConfig.maxServices !== null && (
                    <div className="mt-2">
                      <div className="bg-gray-200 rounded-full h-2.5 w-full">
                        <div 
                          className="bg-primary-600 h-2.5 rounded-full" 
                          style={{ 
                            width: `${Math.min(100, ((lubricentro.servicesUsedThisMonth || 0) / currentConfig.maxServices) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {Math.max(0, currentConfig.maxServices - (lubricentro.servicesUsedThisMonth || 0))} servicios disponibles
                      </p>
                    </div>
                  )}
                  
                  {currentConfig && currentConfig.maxServices === null && (
                    <p className="mt-1 text-xs text-green-600">Servicios ilimitados</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado de Límites</label>
                  <div className="mt-1">
                    {currentConfig ? (
                      <div className="space-y-2">
                        <div className="flex items-center">
                          {(lubricentro.activeUserCount || 0) < currentConfig.maxUsers ? (
                            <CheckIcon className="h-4 w-4 text-green-600 mr-1" />
                          ) : (
                            <XMarkIcon className="h-4 w-4 text-red-600 mr-1" />
                          )}
                          <span className="text-sm">Usuarios</span>
                        </div>
                        <div className="flex items-center">
                          {currentConfig.maxServices === null || 
                           (lubricentro.servicesUsedThisMonth || 0) < currentConfig.maxServices ? (
                            <CheckIcon className="h-4 w-4 text-green-600 mr-1" />
                          ) : (
                            <XMarkIcon className="h-4 w-4 text-red-600 mr-1" />
                          )}
                          <span className="text-sm">Servicios</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Sin límites configurados</span>
                    )}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Historial de uso */}
          {lubricentro.servicesUsedHistory && Object.keys(lubricentro.servicesUsedHistory).length > 0 && (
            <Card>
              <CardHeader title="Historial de Uso" subtitle="Servicios utilizados por mes" />
              <CardBody>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Servicios Realizados
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Límite
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Utilización
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(lubricentro.servicesUsedHistory)
                        .sort((a, b) => b[0].localeCompare(a[0]))
                        .map(([month, count]) => {
                          const [year, monthNum] = month.split('-');
                          const monthName = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
                            .toLocaleDateString('es-ES', { month: 'long' });
                          
                          const limit = currentConfig?.maxServices;
                          const utilizationPercent = limit && limit !== null 
                            ? Math.min(100, (count / limit) * 100) 
                            : 0;
                          
                          return (
                            <tr key={month} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {`${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {count}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {limit === null ? 'Ilimitado' : limit || 'No definido'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {limit === null || !limit ? (
                                  <span className="text-sm text-gray-900">N/A</span>
                                ) : (
                                  <div className="flex items-center">
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2 max-w-[100px]">
                                      <div 
                                        className={`h-2.5 rounded-full ${
                                          utilizationPercent > 90 ? 'bg-red-600' : 
                                          utilizationPercent > 75 ? 'bg-yellow-500' : 
                                          'bg-green-500'
                                        }`}
                                        style={{ width: `${utilizationPercent}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-sm text-gray-900">
                                      {utilizationPercent.toFixed(0)}%
                                    </span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}
      
      <div className="mt-6">
        <Button
          color="secondary"
          variant="outline"
          onClick={() => navigate('/superadmin/lubricentros')}
          icon={<ChevronLeftIcon className="h-5 w-5" />}
        >
          Volver a la lista
        </Button>
      </div>
      
      {/* Modales */}
      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onConfirm={handleRecordPayment}
        lubricentro={lubricentro}
        loading={processing}
      />
      
      <ManualConfigModal
        isOpen={isManualConfigModalOpen}
        onClose={() => setIsManualConfigModalOpen(false)}
        onSave={handleManualConfig}
        lubricentro={lubricentro}
        loading={processing}
      />
      
      <ApplyPlanModal
        isOpen={isApplyPlanModalOpen}
        onClose={() => setIsApplyPlanModalOpen(false)}
        onApply={handleApplyPlan}
        lubricentro={lubricentro}
        loading={processing}
      />
    </PageContainer>
  );
};

export default LubricentroSubscriptionPage;