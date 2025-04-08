// src/pages/support/SupportPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageContainer, Card, CardHeader, CardBody, Button, Alert } from '../../components/ui';
import { getLubricentroById } from '../../services/lubricentroService';

// Iconos
import {
  EnvelopeIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  DocumentTextIcon,
  ClockIcon,
  ShieldCheckIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

const SupportPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('question');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Preguntas frecuentes
  const faqs = [
    {
      question: '¿Cómo puedo actualizar la información de mi lubricentro?',
      answer: 'Para actualizar la información de tu lubricentro, dirígete a la sección de "Mi Perfil" y selecciona la opción "Editar Información de Lubricentro". Allí podrás modificar los datos como nombre, dirección, teléfono, etc.'
    },
    {
      question: '¿Cómo puedo agregar un nuevo usuario/empleado?',
      answer: 'Si tienes rol de administrador, puedes agregar nuevos usuarios yendo a la sección "Usuarios" y haciendo clic en el botón "Agregar Usuario". Los usuarios nuevos recibirán un correo de invitación y deberán completar su registro.'
    },
    {
      question: '¿Qué hago si mi período de prueba expiró?',
      answer: 'Si tu período de prueba ha expirado, contacta a nuestro equipo de soporte a través del formulario en esta página o enviando un correo a soporte@lubricentro-app.com para activar un plan de pago.'
    },
    {
      question: '¿Cómo puedo exportar mis datos a PDF?',
      answer: 'En la vista de detalle de cada cambio de aceite, encontrarás un botón "Imprimir" que te permitirá imprimir o guardar el registro como PDF. También puedes exportar informes completos desde la sección "Reportes".'
    },
    {
      question: '¿Cómo funciona el sistema de recordatorios?',
      answer: 'El sistema calcula automáticamente la fecha del próximo cambio en base a la periodicidad seleccionada (meses) y al kilometraje actual. En la sección "Próximos Servicios" podrás ver todos los vehículos que necesitan servicio próximamente y enviar recordatorios vía WhatsApp.'
    }
  ];
  
  // Manejar envío del formulario de contacto
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Por favor, ingresa un mensaje');
      return;
    }
    
    // Aquí iría la lógica para enviar el mensaje al soporte
    // En una implementación real, esto podría enviar un email o crear un ticket en un sistema de soporte
    
    // Simulamos éxito
    setSubmitted(true);
    setError(null);
    
    // Reset form
    setMessage('');
    setMessageType('question');
  };
  
  return (
    <PageContainer
      title="Soporte"
      subtitle="Centro de ayuda y soporte técnico"
    >
      {/* Mensaje de bienvenida */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col md:flex-row items-center">
            <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
              <div className="bg-primary-100 p-3 rounded-full">
                <QuestionMarkCircleIcon className="h-12 w-12 text-primary-600" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900">¿Necesitas ayuda?</h2>
              <p className="mt-1 text-sm text-gray-500">
                Estamos aquí para asistirte con cualquier consulta, problema técnico o sugerencia que tengas sobre el sistema.
                Explora nuestras preguntas frecuentes o contáctanos directamente utilizando uno de los métodos disponibles.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Columna izquierda: Preguntas frecuentes y recursos */}
        <div className="space-y-6">
          {/* Preguntas frecuentes */}
          <Card>
            <CardHeader
              title="Preguntas Frecuentes"
              subtitle="Respuestas a las consultas más comunes"
            />
            <CardBody>
              <div className="divide-y divide-gray-200">
                {faqs.map((faq, index) => (
                  <div key={index} className={`${index === 0 ? '' : 'pt-4'} ${index === faqs.length - 1 ? '' : 'pb-4'}`}>
                    <h3 className="text-base font-medium text-gray-900">{faq.question}</h3>
                    <p className="mt-1 text-sm text-gray-500">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
          
          {/* Recursos adicionales */}
          <Card>
            <CardHeader title="Recursos Útiles" />
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-6 w-6 text-primary-500 mr-3" />
                    <h3 className="text-sm font-medium text-gray-900">Guías y Tutoriales</h3>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Accede a nuestras guías y tutoriales detallados para aprovechar al máximo el sistema.
                  </p>
                </div>
                
                <div className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <ClockIcon className="h-6 w-6 text-primary-500 mr-3" />
                    <h3 className="text-sm font-medium text-gray-900">Historial de Cambios</h3>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Consulta las actualizaciones recientes y nuevas funcionalidades agregadas al sistema.
                  </p>
                </div>
                
                <div className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <ShieldCheckIcon className="h-6 w-6 text-primary-500 mr-3" />
                    <h3 className="text-sm font-medium text-gray-900">Política de Privacidad</h3>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Información sobre cómo protegemos tus datos y respetamos tu privacidad.
                  </p>
                </div>
                
                <div className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-primary-500 mr-3" />
                    <h3 className="text-sm font-medium text-gray-900">Comunidad</h3>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Únete a nuestra comunidad de usuarios para compartir experiencias y consejos.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
        
        {/* Columna derecha: Contacto y formulario */}
        <div className="space-y-6">
          {/* Información de contacto */}
          <Card>
            <CardHeader
              title="Contacto Directo"
              subtitle="Nuestros canales de atención al cliente"
            />
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <EnvelopeIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Email</h4>
                    <p className="text-sm text-gray-500">soporte@lubricentro-app.com</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Respondemos en un plazo de 24-48 horas hábiles
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <PhoneIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Teléfono</h4>
                    <p className="text-sm text-gray-500">+54 (11) 1234-5678</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Lun-Vie: 9am a 6pm (GMT-3)
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Chat en vivo</h4>
                    <p className="text-sm text-gray-500">Disponible para clientes premium</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Atención inmediata en horario laboral
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
          
          {/* Formulario de contacto */}
          <Card>
            <CardHeader
              title="Envíanos un mensaje"
              subtitle="Completa el formulario y te responderemos a la brevedad"
            />
            <CardBody>
              {submitted ? (
                <div className="text-center py-6">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
                  </div>
                  <h3 className="mt-3 text-lg font-medium text-gray-900">¡Mensaje enviado!</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Hemos recibido tu consulta y te responderemos a la brevedad posible.
                  </p>
                  <div className="mt-6">
                    <Button
                      color="primary"
                      onClick={() => setSubmitted(false)}
                    >
                      Enviar otro mensaje
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert type="error" dismissible onDismiss={() => setError(null)}>
                      {error}
                    </Alert>
                  )}
                  
                  <div>
                    <label htmlFor="messageType" className="block text-sm font-medium text-gray-700">
                      Tipo de mensaje
                    </label>
                    <select
                      id="messageType"
                      name="messageType"
                      value={messageType}
                      onChange={(e) => setMessageType(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    >
                      <option value="question">Pregunta</option>
                      <option value="problem">Problema técnico</option>
                      <option value="suggestion">Sugerencia</option>
                      <option value="billing">Facturación</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                      Mensaje
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="message"
                        name="message"
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Describe tu consulta o problema en detalle..."
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Button
                      type="submit"
                      color="primary"
                      fullWidth
                    >
                      Enviar mensaje
                    </Button>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Al enviar este formulario, aceptas que utilicemos la información proporcionada 
                    para responder a tu consulta y mejorar nuestro servicio.
                  </p>
                </form>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
      
      {/* Membresía expirada (condicional) */}
      {userProfile?.lubricentroId && userProfile.role !== 'superadmin' && (
        <Card className="mt-6 bg-yellow-50 border-yellow-200">
          <CardHeader
            title="Información de Membresía"
            subtitle="Estado actual de tu suscripción"
          />
          <CardBody>
            <div className="flex flex-col sm:flex-row items-start">
              <div className="flex-grow">
                <h3 className="text-lg font-medium text-gray-900">Período de prueba</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Tu cuenta se encuentra actualmente en un período de prueba gratuito. 
                  Para continuar utilizando todas las funcionalidades del sistema después de este período, 
                  deberás activar un plan de pago.
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <Button
                  color="primary"
                  onClick={() => window.open('mailto:ventas@lubricentro-app.com', '_blank')}
                >
                  Activar Plan Premium
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </PageContainer>
  );
};

export default SupportPage;