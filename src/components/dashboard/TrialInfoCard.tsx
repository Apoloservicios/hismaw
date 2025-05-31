// src/components/dashboard/TrialInfoCard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, Button } from '../ui';
import { Lubricentro, OilChangeStats } from '../../types';
// ✅ USAR SERVICIO UNIFICADO
import { getSubscriptionLimits, SubscriptionLimits } from '../../services/unifiedSubscriptionService';

import {
  ClockIcon,
  WrenchIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface TrialInfoCardProps {
  lubricentro: Lubricentro;
  stats: OilChangeStats;
}

const TrialInfoCard: React.FC<TrialInfoCardProps> = ({ lubricentro, stats }) => {
  // ✅ NUEVO ESTADO: Usar límites unificados
  const [subscriptionLimits, setSubscriptionLimits] = useState<SubscriptionLimits | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ EFECTO: Cargar límites de suscripción
  useEffect(() => {
    const loadSubscriptionLimits = async () => {
      try {
        setLoading(true);
        const limits = await getSubscriptionLimits(lubricentro.id);
        setSubscriptionLimits(limits);
        console.log('📊 Límites de suscripción cargados:', limits);
      } catch (error) {
        console.error('Error al cargar límites de suscripción:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSubscriptionLimits();
  }, [lubricentro.id]);

  // No mostrar el componente si no es trial o si está cargando
  if (loading) {
    return (
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardBody>
          <div className="animate-pulse">
            <div className="h-4 bg-blue-200 rounded w-1/4 mb-2"></div>
            <div className="h-8 bg-blue-200 rounded w-3/4"></div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (lubricentro.estado !== 'trial' || !subscriptionLimits) {
    return null;
  }

  // ✅ USAR DATOS UNIFICADOS
  const daysRemaining = subscriptionLimits.daysRemaining || 0;
  const servicesUsed = subscriptionLimits.currentServices;
  const servicesLimit = subscriptionLimits.maxServices || 10;
  const servicesRemaining = Math.max(0, servicesLimit - servicesUsed);
  const progressPercentage = Math.min(100, (servicesUsed / servicesLimit) * 100);
  
  const isExpiring = daysRemaining <= 2;
  const isLimitReached = !subscriptionLimits.canAddServices;

  return (
    <Card className={`mb-6 ${isExpiring || isLimitReached ? 'border-orange-200 bg-orange-50' : 'border-blue-200 bg-blue-50'}`}>
      <CardHeader 
        title="Período de Prueba Gratuita" 
        subtitle="Información sobre tu período de evaluación"
      />
      <CardBody>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Días restantes */}
          <div className={`p-4 rounded-lg ${isExpiring ? 'bg-orange-100' : 'bg-blue-100'}`}>
            <div className="flex items-center">
              <ClockIcon className={`h-6 w-6 mr-2 ${isExpiring ? 'text-orange-600' : 'text-blue-600'}`} />
              <div>
                <h3 className={`font-medium ${isExpiring ? 'text-orange-700' : 'text-blue-700'}`}>
                  Días Restantes
                </h3>
                <p className={`text-2xl font-bold ${isExpiring ? 'text-orange-800' : 'text-blue-800'}`}>
                  {daysRemaining}
                </p>
                {isExpiring && daysRemaining > 0 && (
                  <p className="text-sm text-orange-600 mt-1">¡Tu prueba expira pronto!</p>
                )}
                {daysRemaining === 0 && (
                  <p className="text-sm text-red-600 mt-1">¡Período de prueba expirado!</p>
                )}
              </div>
            </div>
          </div>

          {/* Servicios disponibles */}
          <div className={`p-4 rounded-lg ${isLimitReached ? 'bg-orange-100' : 'bg-green-100'}`}>
            <div className="flex items-center">
              <WrenchIcon className={`h-6 w-6 mr-2 ${isLimitReached ? 'text-orange-600' : 'text-green-600'}`} />
              <div>
                <h3 className={`font-medium ${isLimitReached ? 'text-orange-700' : 'text-green-700'}`}>
                  Servicios Disponibles
                </h3>
                <p className={`text-2xl font-bold ${isLimitReached ? 'text-orange-800' : 'text-green-800'}`}>
                  {servicesRemaining}
                </p>
                <p className={`text-sm ${isLimitReached ? 'text-orange-600' : 'text-green-600'} mt-1`}>
                  de {servicesLimit} en total
                </p>
              </div>
            </div>
          </div>

          {/* Progreso de uso */}
          <div className="p-4 rounded-lg bg-gray-100">
            <div className="flex items-center mb-2">
              <ChartBarIcon className="h-6 w-6 mr-2 text-gray-600" />
              <div>
                <h3 className="font-medium text-gray-700">Servicios Utilizados</h3>
                <p className="text-2xl font-bold text-gray-800">{servicesUsed}</p>
                <p className="text-xs text-gray-600 mt-1">de {servicesLimit} servicios</p>
              </div>
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  progressPercentage >= 80 ? 'bg-orange-500' : 
                  progressPercentage >= 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 mt-1">{progressPercentage.toFixed(0)}% utilizado</p>
          </div>
        </div>

        {/* Alertas y mensajes */}
        {(isExpiring || isLimitReached) && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-yellow-800">
                  {isLimitReached ? 'Límite de Servicios Alcanzado' : 'Período de Prueba por Vencer'}
                </h4>
                <div className="mt-2 text-sm text-yellow-700">
                  {isLimitReached && (
                    <p className="mb-2">
                      Has utilizado los {servicesLimit} servicios disponibles durante tu período de prueba. 
                      Para continuar registrando cambios de aceite, necesitas activar tu suscripción.
                    </p>
                  )}
                  {isExpiring && !isLimitReached && (
                    <p className="mb-2">
                      Tu período de prueba vence en {daysRemaining} día{daysRemaining !== 1 ? 's' : ''}. 
                      Te quedan {servicesRemaining} servicios disponibles.
                    </p>
                  )}
                  <p>Nuestro equipo está listo para ayudarte.</p>
                </div>
                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <Button
                    size="sm"
                    color="warning"
                    onClick={() => window.location.href = 'mailto:soporte@hisma.com.ar?subject=Activar%20suscripción%20-%20' + encodeURIComponent(lubricentro.fantasyName)}
                  >
                    Contactar Soporte
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    color="warning"
                    onClick={() => window.open('https://wa.me/5491112345678?text=' + encodeURIComponent(`Hola, necesito activar la suscripción para ${lubricentro.fantasyName}`))}
                  >
                    WhatsApp
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Información positiva cuando todo está bien */}
        {!isExpiring && !isLimitReached && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">¡Aprovecha tu Período de Prueba!</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Explora todas las funcionalidades del sistema</li>
              <li>• Registra hasta {servicesLimit} cambios de aceite sin costo</li>
              <li>• Genera reportes y estadísticas de tu lubricentro</li>
              <li>• Contacta a soporte si tienes alguna pregunta</li>
            </ul>
            <div className="mt-3 p-3 bg-blue-100 rounded-md">
              <p className="text-xs text-blue-800">
                <strong>Resumen:</strong> {servicesUsed} servicios utilizados de {servicesLimit} disponibles • {daysRemaining} días restantes
              </p>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default TrialInfoCard;