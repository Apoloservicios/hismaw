// src/pages/admin/SubscriptionPlansPage.tsx - ARCHIVO COMPLETO
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
  Modal,
  Input,
  Textarea,
  Checkbox
} from '../../components/ui';

import { 
  getAllLubricentros
} from '../../services/lubricentroService';

import { getSubscriptionStats } from '../../services/subscriptionService';
import { Lubricentro } from '../../types';
import { SUBSCRIPTION_PLANS, SubscriptionPlanType, SubscriptionPlan } from '../../types/subscription';

import { 
  CreditCardIcon,
  ChevronLeftIcon,
  PlusIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  UserGroupIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  StarIcon,
  ClockIcon,
  TrashIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

// Modal para editar/crear plan
const EditPlanModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (planData: any) => Promise<void>;
  plan: SubscriptionPlan | null;
  isCreating: boolean;
  loading: boolean;
}> = ({ isOpen, onClose, onSave, plan, isCreating, loading }) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    monthlyPrice: 0,
    semiannualPrice: 0,
    maxUsers: 1,
    maxMonthlyServices: 0,
    isUnlimitedServices: false,
    features: [] as string[],
    recommended: false,
    active: true
  });

  const [newFeature, setNewFeature] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (plan && !isCreating) {
      setFormData({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        monthlyPrice: plan.price.monthly,
        semiannualPrice: plan.price.semiannual,
        maxUsers: plan.maxUsers,
        maxMonthlyServices: plan.maxMonthlyServices || 0,
        isUnlimitedServices: plan.maxMonthlyServices === null,
        features: [...plan.features],
        recommended: plan.recommended || false,
        active: true
      });
    } else if (isCreating) {
      setFormData({
        id: '',
        name: '',
        description: '',
        monthlyPrice: 0,
        semiannualPrice: 0,
        maxUsers: 1,
        maxMonthlyServices: 0,
        isUnlimitedServices: false,
        features: [],
        recommended: false,
        active: true
      });
    }
    setErrors({});
  }, [plan, isCreating]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del plan es obligatorio';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es obligatoria';
    }

    if (formData.monthlyPrice <= 0) {
      newErrors.monthlyPrice = 'El precio mensual debe ser mayor a 0';
    }

    if (formData.semiannualPrice <= 0) {
      newErrors.semiannualPrice = 'El precio semestral debe ser mayor a 0';
    }

    if (formData.maxUsers <= 0) {
      newErrors.maxUsers = 'Debe permitir al menos 1 usuario';
    }

    if (!formData.isUnlimitedServices && formData.maxMonthlyServices <= 0) {
      newErrors.maxMonthlyServices = 'Debe permitir al menos 1 servicio por mes';
    }

    if (formData.features.length === 0) {
      newErrors.features = 'Debe incluir al menos una característica';
    }

    if (isCreating && !formData.id.trim()) {
      newErrors.id = 'El ID del plan es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const planData = {
      id: formData.id,
      name: formData.name,
      description: formData.description,
      price: {
        monthly: formData.monthlyPrice,
        semiannual: formData.semiannualPrice
      },
      maxUsers: formData.maxUsers,
      maxMonthlyServices: formData.isUnlimitedServices ? null : formData.maxMonthlyServices,
      features: formData.features,
      recommended: formData.recommended
    };

    await onSave(planData);
  };

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()]
      });
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

  const calculateSavings = () => {
    const monthlyTotal = formData.monthlyPrice * 6;
    const savings = monthlyTotal - formData.semiannualPrice;
    const percentage = monthlyTotal > 0 ? (savings / monthlyTotal) * 100 : 0;
    return { savings, percentage };
  };

  const { savings, percentage } = calculateSavings();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCreating ? 'Crear Nuevo Plan' : `Editar Plan: ${plan?.name}`}
      size="xl"
      footer={
        <div className="flex justify-end space-x-2">
          <Button color="secondary" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button color="primary" onClick={handleSave} disabled={loading}>
            {loading ? (
              <><Spinner size="sm" color="white" className="mr-2" />{isCreating ? 'Creando...' : 'Guardando...'}</>
            ) : (
              isCreating ? 'Crear Plan' : 'Guardar Cambios'
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-6 max-h-96 overflow-y-auto">
        <Alert type={isCreating ? "info" : "warning"}>
          <strong>{isCreating ? 'Nuevo Plan:' : 'Editando Plan:'}</strong>{' '}
          {isCreating 
            ? 'Este plan estará disponible para asignar a lubricentros una vez creado.'
            : 'Los cambios afectarán a nuevas asignaciones. Los lubricentros existentes mantendrán su configuración actual.'
          }
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isCreating && (
            <Input
              label="ID del Plan"
              name="id"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
              required
              error={errors.id}
              helperText="Solo letras minúsculas y números (ej: custom_plan_1)"
            />
          )}
          
          <Input
            label="Nombre del Plan"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            error={errors.name}
          />
          
          <Input
            label="Precio Mensual (ARS)"
            name="monthlyPrice"
            type="number"
            value={formData.monthlyPrice.toString()}
            onChange={(e) => setFormData({ ...formData, monthlyPrice: parseInt(e.target.value) || 0 })}
            required
            error={errors.monthlyPrice}
          />
          
          <Input
            label="Precio Semestral (ARS)"
            name="semiannualPrice"
            type="number"
            value={formData.semiannualPrice.toString()}
            onChange={(e) => setFormData({ ...formData, semiannualPrice: parseInt(e.target.value) || 0 })}
            required
            error={errors.semiannualPrice}
          />
          
          <Input
            label="Máximo de Usuarios"
            name="maxUsers"
            type="number"
            value={formData.maxUsers.toString()}
            onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) || 1 })}
            required
            error={errors.maxUsers}
          />
        </div>

        <Textarea
          label="Descripción"
          name="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          required
          error={errors.description}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Servicios Mensuales</label>
            <Checkbox
              label="Servicios ilimitados"
              name="isUnlimitedServices"
              checked={formData.isUnlimitedServices}
              onChange={(e) => setFormData({ ...formData, isUnlimitedServices: e.target.checked })}
            />
          </div>
          
          {!formData.isUnlimitedServices && (
            <Input
              label="Máximo de Servicios por Mes"
              name="maxMonthlyServices"
              type="number"
              value={formData.maxMonthlyServices.toString()}
              onChange={(e) => setFormData({ ...formData, maxMonthlyServices: parseInt(e.target.value) || 0 })}
              error={errors.maxMonthlyServices}
            />
          )}
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Características del Plan</label>
          
          <div className="flex space-x-2">
            <Input
              label=""
              name="newFeature"
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              placeholder="Añadir nueva característica"
            />
            <Button type="button" color="primary" onClick={addFeature} disabled={!newFeature.trim()}>
              <PlusIcon className="h-4 w-4" />
            </Button>
          </div>
          
          {errors.features && <p className="text-sm text-red-600">{errors.features}</p>}
          
          <div className="border border-gray-300 rounded-md p-3 min-h-[100px] max-h-32 overflow-y-auto">
            {formData.features.length > 0 ? (
              <ul className="space-y-2">
                {formData.features.map((feature, index) => (
                  <li key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                    <span className="flex items-center">
                      <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                      {feature}
                    </span>
                    <Button size="sm" color="error" variant="outline" onClick={() => removeFeature(index)}>
                      <XMarkIcon className="h-3 w-3" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">No hay características añadidas</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Checkbox
            label="Marcar como plan recomendado"
            name="recommended"
            checked={formData.recommended}
            onChange={(e) => setFormData({ ...formData, recommended: e.target.checked })}
          />
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Vista Previa del Plan</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Nombre:</span>
              <span className="ml-2 font-medium">{formData.name || 'Sin nombre'}</span>
            </div>
            <div>
              <span className="text-gray-600">Usuarios:</span>
              <span className="ml-2 font-medium">{formData.maxUsers}</span>
            </div>
            <div>
              <span className="text-gray-600">Servicios:</span>
              <span className="ml-2 font-medium">
                {formData.isUnlimitedServices ? 'Ilimitados' : formData.maxMonthlyServices}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Precio Mensual:</span>
              <span className="ml-2 font-medium">${formData.monthlyPrice.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-600">Precio Semestral:</span>
              <span className="ml-2 font-medium">${formData.semiannualPrice.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-600">Ahorro Semestral:</span>
              <span className="ml-2 font-medium text-green-600">
                ${savings.toLocaleString()} ({percentage.toFixed(1)}%)
              </span>
            </div>
          </div>
          
          {formData.recommended && (
            <div className="mt-2">
              <Badge color="info" text="Plan Recomendado" />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

// Componente para mostrar tarjeta de plan
const PlanCard: React.FC<{
  plan: SubscriptionPlan;
  lubricentrosCount: number;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  isRecommended?: boolean;
}> = ({ plan, lubricentrosCount, onEdit, onDuplicate, onDelete, isRecommended = false }) => {
  return (
    <Card className={`relative ${isRecommended ? 'border-primary-500 bg-primary-50' : ''}`}>
      {isRecommended && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center bg-primary-500 text-white px-3 py-1 rounded-full text-xs font-medium">
            <StarIcon className="h-3 w-3 mr-1" />
            Recomendado
          </div>
        </div>
      )}
      
      <CardHeader 
        title={plan.name}
        subtitle={plan.description}
        action={
          <div className="flex space-x-1">
            <Button
              size="sm"
              color="secondary"
              variant="outline"
              onClick={onEdit}
              icon={<PencilIcon className="h-4 w-4" />}
              title="Editar plan"
            >
              Editar
            </Button>
            <Button
              size="sm"
              color="info"
              variant="outline"
              onClick={onDuplicate}
              icon={<DocumentDuplicateIcon className="h-4 w-4" />}
              title="Duplicar plan"
            >
              Duplicar
            </Button>
            <Button
              size="sm"
              color="error"
              variant="outline"
              onClick={onDelete}
              icon={<TrashIcon className="h-4 w-4" />}
              title="Eliminar plan"
              disabled={lubricentrosCount > 0}
            >
              Eliminar
            </Button>
          </div>
        }
      />
      
      <CardBody>
        <div className="space-y-4">
          <div className="text-center">
            <div className="flex items-baseline justify-center">
              <span className="text-3xl font-bold text-gray-900">
                ${plan.price.monthly.toLocaleString()}
              </span>
              <span className="text-gray-500 ml-1">/mes</span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              o ${plan.price.semiannual.toLocaleString()} cada 6 meses
            </div>
            <div className="text-xs text-green-600 mt-1">
              Ahorro: ${((plan.price.monthly * 6) - plan.price.semiannual).toLocaleString()} al pagar semestral
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <div className="flex items-center justify-center mb-1">
                <UserGroupIcon className="h-4 w-4 text-gray-500 mr-1" />
                <span className="text-xs text-gray-500">Usuarios</span>
              </div>
              <div className="font-semibold text-gray-900">
                {plan.maxUsers === 999 ? 'Ilimitados' : plan.maxUsers}
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <div className="flex items-center justify-center mb-1">
                <ChartBarIcon className="h-4 w-4 text-gray-500 mr-1" />
                <span className="text-xs text-gray-500">Servicios/mes</span>
              </div>
              <div className="font-semibold text-gray-900">
                {plan.maxMonthlyServices === null ? 'Ilimitados' : plan.maxMonthlyServices}
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Características incluidas:</h4>
            <ul className="space-y-1 max-h-24 overflow-y-auto">
              {plan.features.slice(0, 4).map((feature, index) => (
                <li key={index} className="flex items-center text-sm text-gray-600">
                  <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  {feature}
                </li>
              ))}
              {plan.features.length > 4 && (
                <li className="text-xs text-gray-400 italic">
                  +{plan.features.length - 4} características más...
                </li>
              )}
            </ul>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Lubricentros activos:</span>
              <div className="flex items-center space-x-2">
                <Badge 
                  color={lubricentrosCount > 0 ? 'success' : 'default'} 
                  text={lubricentrosCount.toString()} 
                />
                {lubricentrosCount > 0 && (
                  <span className="text-xs text-gray-500">
                    (${(lubricentrosCount * plan.price.monthly).toLocaleString()}/mes)
                  </span>
                )}
              </div>
            </div>
            
            {lubricentrosCount === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Este plan puede ser eliminado sin afectar ningún lubricentro
              </p>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

// Componente principal
const SubscriptionPlansPage: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lubricentros, setLubricentros] = useState<Lubricentro[]>([]);
  const [subscriptionStats, setSubscriptionStats] = useState<any>(null);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  useEffect(() => {
    loadData();
  }, []);
  
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
  
  const getLubricentrosCountByPlan = (planId: SubscriptionPlanType): number => {
    return lubricentros.filter(l => 
      l.subscriptionPlan === planId && l.estado === 'activo'
    ).length;
  };
  
  const handleEditPlan = (planId: SubscriptionPlanType) => {
    const plan = SUBSCRIPTION_PLANS[planId];
    setEditingPlan(plan);
    setIsCreating(false);
    setIsEditModalOpen(true);
  };
  
  const handleCreatePlan = () => {
    setEditingPlan(null);
    setIsCreating(true);
    setIsEditModalOpen(true);
  };
  
  const handleDuplicatePlan = (planId: SubscriptionPlanType) => {
    const plan = SUBSCRIPTION_PLANS[planId];
    const duplicatedPlan: SubscriptionPlan = {
      ...plan,
      id: `${plan.id}_copy` as SubscriptionPlanType,
      name: `${plan.name} (Copia)`,
      recommended: false
    };
    setEditingPlan(duplicatedPlan);
    setIsCreating(true);
    setIsEditModalOpen(true);
  };
  
  const handleDeletePlan = async (planId: SubscriptionPlanType) => {
    const count = getLubricentrosCountByPlan(planId);
    
    if (count > 0) {
      setError(`No se puede eliminar el plan. Hay ${count} lubricentros activos utilizándolo.`);
      return;
    }
    
    if (window.confirm(`¿Está seguro de que desea eliminar el plan "${SUBSCRIPTION_PLANS[planId].name}"?`)) {
      setSuccess(`Plan "${SUBSCRIPTION_PLANS[planId].name}" eliminado correctamente (simulación)`);
    }
  };
  
  const handleSavePlan = async (planData: any) => {
    try {
      setProcessing(true);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsEditModalOpen(false);
      setSuccess(
        isCreating 
          ? `Plan "${planData.name}" creado correctamente` 
          : `Plan "${planData.name}" actualizado correctamente`
      );
      
      await loadData();
      
    } catch (err: any) {
      setError(`Error al ${isCreating ? 'crear' : 'actualizar'} el plan: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };
  
  const calculateTotalRevenue = () => {
    let totalMonthly = 0;
    let totalSemiannual = 0;
    
    Object.entries(SUBSCRIPTION_PLANS).forEach(([planId, plan]) => {
      const count = getLubricentrosCountByPlan(planId as SubscriptionPlanType);
      totalMonthly += count * plan.price.monthly;
      totalSemiannual += count * plan.price.semiannual;
    });
    
    return { totalMonthly, totalSemiannual };
  };
  
  const revenue = calculateTotalRevenue();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-80">
        <Spinner size="lg" />
      </div>
    );
  }
  
  return (
    <PageContainer
      title="Gestión de Planes de Suscripción"
      subtitle="Crear, editar y administrar planes disponibles para lubricentros"
      action={
        <div className="flex space-x-2">
          <Button
            color="success"
            onClick={handleCreatePlan}
            icon={<PlusIcon className="h-5 w-5" />}
          >
            Crear Nuevo Plan
          </Button>
          <Button
            color="secondary"
            variant="outline"
            onClick={() => navigate('/superadmin/suscripciones/estadisticas')}
            icon={<ChartBarIcon className="h-5 w-5" />}
          >
            Ver Estadísticas
          </Button>
          <Button
            color="primary"
            onClick={() => navigate('/superadmin/lubricentros')}
            icon={<ChevronLeftIcon className="h-5 w-5" />}
          >
            Volver a Lubricentros
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
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="rounded-full p-3 bg-green-100 mr-4">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Mensuales</p>
                <p className="text-2xl font-semibold text-gray-800">
                  ${revenue.totalMonthly.toLocaleString()}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="rounded-full p-3 bg-blue-100 mr-4">
                <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Semestrales</p>
                <p className="text-2xl font-semibold text-gray-800">
                  ${revenue.totalSemiannual.toLocaleString()}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="rounded-full p-3 bg-purple-100 mr-4">
                <UserGroupIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Planes Disponibles</p>
                <p className="text-2xl font-semibold text-gray-800">
                  {Object.keys(SUBSCRIPTION_PLANS).length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="rounded-full p-3 bg-orange-100 mr-4">
                <ClockIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Suscripciones Activas</p>
                <p className="text-2xl font-semibold text-gray-800">
                  {subscriptionStats?.active || 0}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Planes Disponibles</h2>
          <Button
            color="success"
            onClick={handleCreatePlan}
            icon={<PlusIcon className="h-5 w-5" />}
          >
            Crear Nuevo Plan
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(SUBSCRIPTION_PLANS).map(([planId, plan]) => (
            <PlanCard
              key={planId}
              plan={plan}
              lubricentrosCount={getLubricentrosCountByPlan(planId as SubscriptionPlanType)}
              onEdit={() => handleEditPlan(planId as SubscriptionPlanType)}
              onDuplicate={() => handleDuplicatePlan(planId as SubscriptionPlanType)}
              onDelete={() => handleDeletePlan(planId as SubscriptionPlanType)}
              isRecommended={plan.recommended}
            />
          ))}
        </div>
      </div>
      
      <Card>
        <CardHeader title="Guía de Gestión de Planes" />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Crear y Editar Planes</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start">
                  <CheckIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span><strong>Crear:</strong> Defina un nuevo plan con ID único, precios y características personalizadas.</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span><strong>Editar:</strong> Modifique planes existentes. Los cambios afectan solo a nuevas asignaciones.</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span><strong>Duplicar:</strong> Cree variaciones de planes existentes rápidamente.</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span><strong>Eliminar:</strong> Solo planes sin lubricentros activos pueden ser eliminados.</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Mejores Prácticas</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start">
                  <StarIcon className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Marque como "recomendado" el plan que quiera promocionar más.</span>
                </li>
                <li className="flex items-start">
                  <CurrencyDollarIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Configure descuentos semestrales atractivos para aumentar el compromiso.</span>
                </li>
                <li className="flex items-start">
                  <UserGroupIcon className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Ofrezca escalabilidad clara entre planes (usuarios y servicios).</span>
                </li>
                <li className="flex items-start">
                  <ClockIcon className="h-4 w-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Revise regularmente el uso de cada plan para optimizar la oferta.</span>
                </li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>
      
      <EditPlanModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPlan(null);
        }}
        onSave={handleSavePlan}
        plan={editingPlan}
        isCreating={isCreating}
        loading={processing}
      />
    </PageContainer>
  );
};

export default SubscriptionPlansPage;