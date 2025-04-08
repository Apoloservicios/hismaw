// src/pages/public/HomePage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Iconos
import {
  ChevronRightIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  UserIcon,
  ArrowRightIcon,
  ChartBarIcon ,
  TruckIcon 
} from '@heroicons/react/24/outline';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [domain, setDomain] = useState('');
  
  // Manejar búsqueda rápida de dominio
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!domain.trim()) return;
    
    // Redirigir a la página de consulta de historial con el dominio como parámetro
    navigate(`/consulta-historial?dominio=${domain.trim().toUpperCase()}`);
  };
  
  return (
    <div className="bg-white">
      {/* Header */}
      <header className="relative">
        <div className="bg-primary-700 py-6">
          <nav className="relative max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6" aria-label="Global">
            <div className="flex items-center flex-1">
              <div className="flex items-center justify-between w-full md:w-auto">
                <span className="text-white text-2xl font-bold">Lubricentro App</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/consulta-historial" className="text-base font-medium text-white hover:text-gray-300">
                Consultar Historial
              </a>
              <a
                href="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-primary-700 bg-white hover:bg-gray-50"
              >
                Iniciar Sesión
              </a>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero section */}
      <div className="relative">
        {/* Gradient Background */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gray-100" />
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="relative shadow-xl sm:rounded-2xl sm:overflow-hidden">
            <div className="absolute inset-0">
              <img
                className="h-full w-full object-cover"
                src="https://images.unsplash.com/photo-1581337204873-ef36aa186caa?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1350&q=80"
                alt="Persona en un taller cambiando el aceite a un vehículo"
              />
              <div className="absolute inset-0 bg-primary-700 mix-blend-multiply" />
            </div>
            <div className="relative px-4 py-16 sm:px-6 sm:py-24 lg:py-32 lg:px-8">
              <h1 className="text-center text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                <span className="block text-white">Gestión de Cambios de Aceite</span>
                <span className="block text-primary-200">Simple y Eficiente</span>
              </h1>
              <p className="mt-6 max-w-lg mx-auto text-center text-xl text-white sm:max-w-3xl">
                Sistema integral para lubricentros que permite administrar los cambios de aceite, 
                realizar un seguimiento detallado de los vehículos y mantener informados a los clientes.
              </p>
              
              {/* Búsqueda rápida */}
              <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">
                <form onSubmit={handleSearchSubmit} className="w-full sm:max-w-xl">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-grow">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <TruckIcon  className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value.toUpperCase())}
                        className="block w-full pl-10 pr-3 py-3 border border-transparent text-base leading-5 rounded-md shadow-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600"
                        placeholder="Ingrese el dominio (patente)"
                        style={{ textTransform: 'uppercase' }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!domain.trim()}
                      className={`px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                        domain.trim() 
                          ? 'bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600' 
                          : 'bg-primary-300 cursor-not-allowed'
                      }`}
                    >
                      Consultar Historial
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Características principales */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">Características</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Una mejor manera de gestionar su negocio
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Herramientas diseñadas específicamente para lubricentros y talleres mecánicos que 
              facilitan la gestión diaria y mejoran la satisfacción de los clientes.
            </p>
          </div>

          <div className="mt-10">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                    <DocumentTextIcon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Registro Detallado</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Mantenga un registro completo y organizado de cada cambio de aceite, 
                  con información detallada sobre el vehículo, tipo de aceite, filtros y servicios adicionales.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                    <CalendarDaysIcon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Recordatorios Automáticos</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  El sistema calcula automáticamente la fecha y kilometraje del próximo cambio, 
                  permitiéndole contactar proactivamente a sus clientes para programar el servicio.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                    <MagnifyingGlassIcon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Búsqueda Rápida</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Encuentre rápidamente el historial de servicios de cualquier vehículo mediante la búsqueda 
                  por dominio (patente) o por el nombre del cliente.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                    <ChartBarIcon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Estadísticas e Informes</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Genere informes detallados y visualice estadísticas que le ayudarán a entender mejor su negocio, 
                  tomar decisiones informadas y optimizar sus operaciones.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Planes */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">Planes</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Elija el plan que mejor se adapte a sus necesidades
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Ofrecemos diferentes opciones para todo tipo de lubricentros, desde pequeños hasta grandes operaciones.
            </p>
          </div>

          <div className="mt-10 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto">
            {/* Plan Prueba Gratuito */}
            <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200 bg-white">
              <div className="p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Prueba Gratuita</h3>
                <p className="mt-4 text-sm text-gray-500">
                  Ideal para probar el sistema y verificar si cumple con sus necesidades.
                </p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">$0</span>
                  <span className="text-base font-medium text-gray-500">/mes</span>
                </p>
                <a
                  href="/register"
                  className="mt-8 block w-full bg-primary-600 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-primary-700"
                >
                  Comenzar prueba gratuita
                </a>
              </div>
              <div className="px-6 pt-6 pb-8">
                <h4 className="text-sm font-medium text-gray-900">Incluye:</h4>
                <ul className="mt-6 space-y-4">
                  <li className="flex space-x-3">
                    <CheckCircleIcon className="flex-shrink-0 h-5 w-5 text-green-500" aria-hidden="true" />
                    <span className="text-sm text-gray-500">7 días de prueba</span>
                  </li>
                  <li className="flex space-x-3">
                    <CheckCircleIcon className="flex-shrink-0 h-5 w-5 text-green-500" aria-hidden="true" />
                    <span className="text-sm text-gray-500">Registro ilimitado de cambios</span>
                  </li>
                  <li className="flex space-x-3">
                    <CheckCircleIcon className="flex-shrink-0 h-5 w-5 text-green-500" aria-hidden="true" />
                    <span className="text-sm text-gray-500">Funcionalidades básicas</span>
                  </li>
                  <li className="flex space-x-3">
                    <CheckCircleIcon className="flex-shrink-0 h-5 w-5 text-green-500" aria-hidden="true" />
                    <span className="text-sm text-gray-500">Soporte por email</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Plan Premium */}
            <div className="border border-primary-200 rounded-lg shadow-sm divide-y divide-gray-200 bg-white">
              <div className="p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Premium</h3>
                <p className="mt-4 text-sm text-gray-500">
                  Acceso completo a todas las funcionalidades del sistema.
                </p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">$3.500</span>
                  <span className="text-base font-medium text-gray-500">/mes</span>
                </p>
                <a
                  href="/register"
                  className="mt-8 block w-full bg-primary-600 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-primary-700"
                >
                  Comenzar con Premium
                </a>
              </div>
              <div className="px-6 pt-6 pb-8">
                <h4 className="text-sm font-medium text-gray-900">Todo lo del plan gratuito, más:</h4>
                <ul className="mt-6 space-y-4">
                  <li className="flex space-x-3">
                    <CheckCircleIcon className="flex-shrink-0 h-5 w-5 text-green-500" aria-hidden="true" />
                    <span className="text-sm text-gray-500">Reportes avanzados y estadísticas</span>
                  </li>
                  <li className="flex space-x-3">
                    <CheckCircleIcon className="flex-shrink-0 h-5 w-5 text-green-500" aria-hidden="true" />
                    <span className="text-sm text-gray-500">Sistema de notificaciones automáticas</span>
                  </li>
                  <li className="flex space-x-3">
                    <CheckCircleIcon className="flex-shrink-0 h-5 w-5 text-green-500" aria-hidden="true" />
                    <span className="text-sm text-gray-500">Gestión de múltiples empleados</span>
                  </li>
                  <li className="flex space-x-3">
                    <CheckCircleIcon className="flex-shrink-0 h-5 w-5 text-green-500" aria-hidden="true" />
                    <span className="text-sm text-gray-500">Soporte prioritario</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-primary-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">¿Listo para comenzar?</span>
            <span className="block text-primary-200">Registre su lubricentro hoy mismo.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <a
                href="/register"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50"
              >
                Comenzar Ahora
              </a>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <a
                href="/consulta-historial"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                Consultar Historial
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
          <nav className="-mx-5 -my-2 flex flex-wrap justify-center" aria-label="Footer">
            <div className="px-5 py-2">
              <a href="/" className="text-base text-gray-500 hover:text-gray-900">
                Inicio
              </a>
            </div>
            <div className="px-5 py-2">
              <a href="/login" className="text-base text-gray-500 hover:text-gray-900">
                Iniciar Sesión
              </a>
            </div>
            <div className="px-5 py-2">
              <a href="/register" className="text-base text-gray-500 hover:text-gray-900">
                Registrarse
              </a>
            </div>
            <div className="px-5 py-2">
              <a href="/consulta-historial" className="text-base text-gray-500 hover:text-gray-900">
                Consultar Historial
              </a>
            </div>
          </nav>
          <p className="mt-8 text-center text-base text-gray-400">
            &copy; {new Date().getFullYear()} Sistema de Gestión de Cambios de Aceite. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;