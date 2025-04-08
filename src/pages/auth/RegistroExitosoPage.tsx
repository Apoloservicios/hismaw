// src/pages/auth/RegistroExitosoPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';

// Iconos
import { CheckCircleIcon, ArrowRightIcon, ChartBarIcon, CalendarIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

const RegistroExitosoPage: React.FC = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);
  
  // Redirigir al dashboard después de 10 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [navigate]);
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-lg font-semibold text-gray-900">Sistema de Gestión de Cambios de Aceite</h1>
        </div>
      </header>
      
      {/* Contenido principal */}
      <main className="flex-grow">
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:p-6 text-center">
              <div className="flex justify-center">
                <CheckCircleIcon className="h-20 w-20 text-green-500 mb-4" />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-2">¡Registro Exitoso!</h2>
              <p className="text-lg text-gray-600 mb-6">
                Su cuenta ha sido creada correctamente. ¡Bienvenido a nuestro sistema de gestión de cambios de aceite!
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-8">
                <p className="text-sm text-green-800">
                  Será redirigido al panel de control en <span className="font-bold">{countdown}</span> segundos...
                </p>
              </div>
              
              <Button
                color="primary"
                size="lg"
                onClick={() => navigate('/dashboard')}
                icon={<ArrowRightIcon className="h-5 w-5" />}
              >
                Ir al Panel de Control
              </Button>
              
              {/* Sección de próximos pasos */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="text-xl font-semibold text-primary-700 mb-6">Próximos Pasos</h3>
                
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex justify-center mb-3">
                      <ChartBarIcon className="h-12 w-12 text-primary-600" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Configura tu Perfil</h4>
                    <p className="text-sm text-gray-600">
                      Completa la información de tu lubricentro para personalizar tu experiencia.
                    </p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex justify-center mb-3">
                      <CalendarIcon className="h-12 w-12 text-primary-600" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Registra tu Primer Cambio</h4>
                    <p className="text-sm text-gray-600">
                      Comienza a utilizar el sistema registrando tu primer cambio de aceite.
                    </p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex justify-center mb-3">
                      <EnvelopeIcon className="h-12 w-12 text-primary-600" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Verifica tu Email</h4>
                    <p className="text-sm text-gray-600">
                      Revisa tu bandeja de entrada y confirma tu dirección de correo electrónico.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Información sobre período de prueba */}
              <div className="mt-12 px-6 py-5 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
                <h4 className="text-lg font-medium text-yellow-800 mb-2">Período de Prueba</h4>
                <p className="text-sm text-yellow-700 mb-2">
                  Recuerda que tienes 7 días de prueba gratuita para explorar todas las funcionalidades del sistema.
                </p>
                <p className="text-xs text-yellow-600">
                  Para cualquier consulta o asistencia, no dudes en contactar a nuestro equipo de soporte.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Sistema de Gestión de Cambios de Aceite. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default RegistroExitosoPage;