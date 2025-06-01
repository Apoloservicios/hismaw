// src/utils/testingHelpers.ts
import { Lubricentro, User, OilChange, SubscriptionPlanType } from '../types';

/**
 * Genera datos de prueba para lubricentros usando los tipos reales del proyecto
 */
export const generateMockLubricentro = (overrides: Partial<Lubricentro> = {}): Lubricentro => {
  const defaultLubricentro: Lubricentro = {
    id: `lubricentro-${Date.now()}`,
    fantasyName: 'Lubricentro Test',
    responsable: 'Juan Pérez',
    domicilio: 'Av. Principal 123, Ciudad Test',
    cuit: '20-12345678-9',
    phone: '+54 9 11 1234-5678',
    email: 'test@lubricentro.com',
    location: {
      lat: -34.6037,
      lng: -58.3816,
      address: 'Buenos Aires, Argentina'
    },
    logoUrl: undefined,
    logoBase64: undefined,
    ownerId: 'owner-test',
    estado: 'activo',
    subscriptionId: undefined,
    ticketPrefix: 'TST',
    createdAt: new Date(),
    trialEndDate: undefined, // Cambiado de null a undefined
    updatedAt: new Date(),
    
    // Campos de suscripción usando los tipos reales
    subscriptionPlan: 'basic',
    subscriptionStartDate: new Date(),
    subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
    subscriptionRenewalType: 'monthly',
    contractEndDate: undefined,
    billingCycleEndDate: undefined,
    lastPaymentDate: new Date(),
    nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    paymentStatus: 'paid',
    servicesUsedThisMonth: 0,
    activeUserCount: 1,
    servicesUsedHistory: {},
    paymentHistory: [],
    autoRenewal: false,
    customSubscriptionConfig: undefined,
    
    ...overrides
  };

  return defaultLubricentro;
};

/**
 * Genera datos de prueba para usuarios usando los tipos reales del proyecto
 */
export const generateMockUser = (overrides: Partial<User> = {}): User => {
  const defaultUser: User = {
    id: `user-${Date.now()}`,
    nombre: 'Usuario', // Usar campo correcto del tipo real
    apellido: 'Test',   // Usar campo correcto del tipo real
    email: 'test@example.com',
    role: 'user',
    estado: 'activo',
    lubricentroId: 'lubricentro-test',
    createdAt: new Date(),
    lastLogin: new Date(),
    updatedAt: new Date(),
    avatar: undefined,
    photoURL: undefined,
    permissions: [],
    ...overrides
  };

  return defaultUser;
};

/**
 * Genera datos de prueba para cambios de aceite usando los tipos reales del proyecto
 */
export const generateMockOilChange = (overrides: Partial<OilChange> = {}): OilChange => {
  const serviceDate = new Date();
  const nextDate = new Date(serviceDate);
  nextDate.setMonth(nextDate.getMonth() + 6); // 6 meses después

  const defaultOilChange: OilChange = {
    id: `oil-change-${Date.now()}`,
    lubricentroId: 'lubricentro-test',
    fecha: serviceDate,
    nroCambio: 'CHG001',
    nombreCliente: 'Cliente Test', // Usar campo correcto del tipo real
    celular: '+54 9 11 9876-5432',
    lubricentroNombre: 'Lubricentro Test',
    
    // Datos del vehículo usando campos reales
    dominioVehiculo: 'ABC123',
    marcaVehiculo: 'Ford',
    modeloVehiculo: 'Focus',
    tipoVehiculo: 'Auto',
    añoVehiculo: 2020,
    kmActuales: 50000,
    kmProximo: 60000,
    perioricidad_servicio: 6,
    fechaProximoCambio: nextDate,
    
    // Datos del servicio usando campos reales
    fechaServicio: serviceDate,
    marcaAceite: 'Mobil',
    tipoAceite: 'Semi-sintético',
    sae: '5W-30',
    cantidadAceite: 4.5,
    
    // Filtros y extras usando campos reales
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
    
    // Observaciones y operario
    observaciones: 'Servicio realizado correctamente',
    nombreOperario: 'Operario Test',
    operatorId: 'operator-test',
    
    // Metadata
    createdAt: new Date(),
    updatedAt: new Date(),
    
    ...overrides
  };

  return defaultOilChange;
};

/**
 * Genera múltiples lubricentros de prueba
 */
export const generateMockLubricentros = (count: number = 5): Lubricentro[] => {
  const estados: Array<'activo' | 'inactivo' | 'trial'> = ['activo', 'trial', 'inactivo'];
  const subscriptionPlans: SubscriptionPlanType[] = ['basic', 'premium', 'enterprise'];
  
  return Array.from({ length: count }, (_, index) => {
    const estado = estados[index % estados.length];
    const plan = subscriptionPlans[index % subscriptionPlans.length];
    
    return generateMockLubricentro({
      id: `lubricentro-${index + 1}`,
      fantasyName: `Lubricentro ${index + 1}`,
      responsable: `Responsable ${index + 1}`,
      email: `lubricentro${index + 1}@test.com`,
      estado: estado,
      subscriptionPlan: plan,
      servicesUsedThisMonth: Math.floor(Math.random() * 50),
      cuit: `20-1234567${index}-9`,
      ticketPrefix: `LUB${index + 1}`
    });
  });
};

/**
 * Genera múltiples usuarios de prueba
 */
export const generateMockUsers = (count: number = 3, lubricentroId?: string): User[] => {
  const roles: Array<'superadmin' | 'admin' | 'user'> = ['admin', 'user', 'user'];
  
  return Array.from({ length: count }, (_, index) => {
    const role = roles[index % roles.length];
    
    return generateMockUser({
      id: `user-${index + 1}`,
      nombre: `Usuario ${index + 1}`,
      apellido: `Apellido ${index + 1}`,
      email: `usuario${index + 1}@test.com`,
      role,
      lubricentroId: role !== 'superadmin' ? (lubricentroId || 'lubricentro-1') : undefined
    });
  });
};

/**
 * Genera múltiples cambios de aceite de prueba
 */
export const generateMockOilChanges = (count: number = 10, lubricentroId?: string): OilChange[] => {
  const marcasVehiculo = ['Ford', 'Chevrolet', 'Toyota', 'Volkswagen', 'Peugeot'];
  const modelosVehiculo = ['Focus', 'Onix', 'Corolla', 'Gol', '208'];
  const tiposVehiculo = ['Auto', 'Camioneta', 'Utilitario'];
  const marcasAceite = ['Mobil', 'Shell', 'Castrol', 'YPF', 'Total'];
  const tiposAceite = ['Mineral', 'Semi-sintético', 'Sintético'];
  const saeTypes = ['5W-30', '10W-40', '15W-40', '20W-50'];
  
  return Array.from({ length: count }, (_, index) => {
    const serviceDate = new Date(Date.now() - (index * 7 * 24 * 60 * 60 * 1000)); // Una semana atrás cada uno
    
    return generateMockOilChange({
      id: `oil-change-${index + 1}`,
      lubricentroId: lubricentroId || 'lubricentro-1',
      nroCambio: `CHG${String(index + 1).padStart(3, '0')}`,
      nombreCliente: `Cliente ${index + 1}`,
      dominioVehiculo: `ABC${100 + index}`,
      marcaVehiculo: marcasVehiculo[index % marcasVehiculo.length],
      modeloVehiculo: modelosVehiculo[index % modelosVehiculo.length],
      tipoVehiculo: tiposVehiculo[index % tiposVehiculo.length],
      añoVehiculo: 2015 + (index % 8),
      kmActuales: 30000 + (index * 5000),
      marcaAceite: marcasAceite[index % marcasAceite.length],
      tipoAceite: tiposAceite[index % tiposAceite.length],
      sae: saeTypes[index % saeTypes.length],
      fechaServicio: serviceDate,
      fecha: serviceDate,
      nombreOperario: `Operario ${(index % 3) + 1}`
    });
  });
};

/**
 * Datos de prueba para planes de suscripción usando los tipos reales
 */
export const mockSubscriptionPlans = {
  basic: {
    id: 'basic',
    name: 'Básico',
    description: 'Plan básico para lubricentros pequeños',
    monthlyPrice: 9900,
    yearlyPrice: 99000,
    servicesLimit: 100,
    features: [
      'Hasta 100 servicios por mes',
      'Gestión básica de clientes',
      'Reportes simples',
      'Soporte por email'
    ],
    isActive: true
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    description: 'Plan premium para lubricentros medianos',
    monthlyPrice: 19900,
    yearlyPrice: 199000,
    servicesLimit: 500,
    features: [
      'Hasta 500 servicios por mes',
      'Gestión avanzada de clientes',
      'Reportes detallados',
      'Recordatorios automáticos',
      'Soporte prioritario',
      'API de integración'
    ],
    isActive: true
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Plan enterprise para grandes lubricentros',
    monthlyPrice: 39900,
    yearlyPrice: 399000,
    servicesLimit: -1, // Sin límite
    features: [
      'Servicios ilimitados',
      'Multi-sucursal',
      'Reportes personalizados',
      'Integración completa',
      'Soporte 24/7',
      'Personalización avanzada',
      'Capacitación incluida'
    ],
    isActive: true
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Plan inicial para nuevos lubricentros',
    monthlyPrice: 4900,
    yearlyPrice: 49000,
    servicesLimit: 50,
    features: [
      'Hasta 50 servicios por mes',
      'Gestión básica',
      'Soporte limitado'
    ],
    isActive: true
  }
};

/**
 * Función helper para limpiar datos de prueba
 */
export const cleanupTestData = () => {
  // En un entorno real, esto eliminaría datos de prueba de la base de datos
  console.log('Limpiando datos de prueba...');
};

/**
 * Función helper para inicializar datos de prueba
 */
export const initializeTestData = () => {
  // En un entorno real, esto inicializaría la base de datos con datos de prueba
  console.log('Inicializando datos de prueba...');
  
  return {
    lubricentros: generateMockLubricentros(5),
    users: generateMockUsers(10),
    oilChanges: generateMockOilChanges(50),
    subscriptionPlans: mockSubscriptionPlans
  };
};

/**
 * Valida que los datos de prueba sean consistentes
 */
export const validateTestData = (data: any): boolean => {
  try {
    // Validar que todos los objetos tengan IDs únicos
    const allIds = [
      ...data.lubricentros.map((l: Lubricentro) => l.id),
      ...data.users.map((u: User) => u.id),
      ...data.oilChanges.map((o: OilChange) => o.id)
    ];
    
    const uniqueIds = new Set(allIds);
    if (allIds.length !== uniqueIds.size) {
      console.error('IDs duplicados encontrados en datos de prueba');
      return false;
    }
    
    // Validar que todos los usuarios estén asociados a lubricentros válidos
    const lubricentroIds = new Set(data.lubricentros.map((l: Lubricentro) => l.id));
    const invalidUsers = data.users.filter((u: User) => 
      u.role !== 'superadmin' && u.lubricentroId && !lubricentroIds.has(u.lubricentroId)
    );
    
    if (invalidUsers.length > 0) {
      console.error('Usuarios con lubricentroId inválido:', invalidUsers);
      return false;
    }
    
    // Validar campos requeridos en lubricentros
    const invalidLubricentros = data.lubricentros.filter((l: Lubricentro) => 
      !l.fantasyName || !l.responsable || !l.cuit || !l.email
    );
    
    if (invalidLubricentros.length > 0) {
      console.error('Lubricentros con datos incompletos:', invalidLubricentros);
      return false;
    }
    
    // Validar campos requeridos en cambios de aceite
    const invalidOilChanges = data.oilChanges.filter((o: OilChange) => 
      !o.nombreCliente || !o.dominioVehiculo || !o.marcaVehiculo
    );
    
    if (invalidOilChanges.length > 0) {
      console.error('Cambios de aceite con datos incompletos:', invalidOilChanges);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error validando datos de prueba:', error);
    return false;
  }
};

/**
 * Genera datos específicos para testing de suscripciones
 */
export const generateSubscriptionTestData = () => {
  const lubricentros = [
    generateMockLubricentro({
      id: 'lub-active-basic',
      fantasyName: 'Lubricentro Activo Básico',
      estado: 'activo',
      subscriptionPlan: 'basic',
      servicesUsedThisMonth: 45,
      paymentStatus: 'paid'
    }),
    generateMockLubricentro({
      id: 'lub-trial-ending',
      fantasyName: 'Lubricentro Trial por Vencer',
      estado: 'trial',
      trialEndDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 días
      servicesUsedThisMonth: 15
    }),
    generateMockLubricentro({
      id: 'lub-premium-overuse',
      fantasyName: 'Lubricentro Premium Sobrepaso',
      estado: 'activo',
      subscriptionPlan: 'premium',
      servicesUsedThisMonth: 550, // Sobre el límite de 500
      paymentStatus: 'paid'
    }),
    generateMockLubricentro({
      id: 'lub-inactive',
      fantasyName: 'Lubricentro Inactivo',
      estado: 'inactivo',
      subscriptionPlan: 'basic',
      servicesUsedThisMonth: 0,
      paymentStatus: 'overdue'
    })
  ];

  const users = [
    generateMockUser({
      id: 'superadmin-1',
      nombre: 'Super',
      apellido: 'Admin',
      email: 'superadmin@hisma.com',
      role: 'superadmin',
      lubricentroId: undefined
    }),
    generateMockUser({
      id: 'admin-basic',
      nombre: 'Admin',
      apellido: 'Básico',
      email: 'admin@lubbasico.com',
      role: 'admin',
      lubricentroId: 'lub-active-basic'
    }),
    generateMockUser({
      id: 'user-premium',
      nombre: 'Usuario',
      apellido: 'Premium',
      email: 'user@lubpremium.com',
      role: 'user',
      lubricentroId: 'lub-premium-overuse'
    })
  ];

  return {
    lubricentros,
    users,
    oilChanges: generateMockOilChanges(20, 'lub-active-basic')
  };
};

/**
 * Genera datos para testing de validaciones
 */
export const generateValidationTestData = () => {
  return {
    validLubricentro: generateMockLubricentro({
      fantasyName: 'Lubricentro Válido',
      responsable: 'Responsable Válido',
      cuit: '20-12345678-9',
      email: 'valido@lubricentro.com',
      phone: '+54911234567',
      domicilio: 'Dirección Válida 123'
    }),
    invalidLubricentro: {
      fantasyName: 'L', // Muy corto
      responsable: '', // Vacío
      cuit: '12345', // Formato inválido
      email: 'email-invalido', // Email inválido
      phone: '123', // Muy corto
      domicilio: 'Dir' // Muy corto
    },
    validOilChange: generateMockOilChange({
      nombreCliente: 'Cliente Válido',
      dominioVehiculo: 'ABC123',
      marcaVehiculo: 'Ford',
      modeloVehiculo: 'Focus',
      kmActuales: 50000
    }),
    invalidOilChange: {
      nombreCliente: 'C', // Muy corto
      dominioVehiculo: '123', // Formato inválido
      marcaVehiculo: '', // Vacío
      modeloVehiculo: '', // Vacío
      kmActuales: -1000 // Negativo
    }
  };
};

// Exportar instancia por defecto para tests
export const defaultTestData = initializeTestData();