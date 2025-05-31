// src/utils/testingHelpers.ts
import { User, Lubricentro, LubricentroStatus } from '../types';
import { SubscriptionPlanType } from '../types/subscription';

// ✅ MOCK DATA PARA TESTING
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'test-user-id',
  email: 'test@example.com',
  nombre: 'Test',
  apellido: 'User',
  role: 'user',
  estado: 'activo',
  lubricentroId: 'test-lubricentro-id',
  createdAt: new Date(),
  lastLogin: new Date(),
  ...overrides
});

export const createMockLubricentro = (overrides: Partial<Lubricentro> = {}): Lubricentro => ({
  id: 'test-lubricentro-id',
  fantasyName: 'Test Lubricentro',
  responsable: 'Test Owner',
  email: 'owner@testlubri.com',
  phone: '+54 9 11 1234-5678',
  domicilio: 'Test Address 123',
  cuit: '20-12345678-9', // ✅ Agregar CUIT requerido
  estado: 'trial' as LubricentroStatus,
  servicesUsedThisMonth: 0,
  activeUserCount: 1,
  trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días desde ahora
  createdAt: new Date(),
  ...overrides
});

// ✅ SCENARIOS PARA TESTING DE VALIDACIONES
export const testScenarios = {
  // Usuario válido con suscripción activa
  validActiveUser: {
    user: createMockUser({ role: 'admin' }),
    lubricentro: createMockLubricentro({
      estado: 'activo' as LubricentroStatus,
      subscriptionPlan: 'basic' as SubscriptionPlanType,
      servicesUsedThisMonth: 5
    })
  },

  // Usuario en período de prueba con límites
  trialUserNearLimit: {
    user: createMockUser({ role: 'admin' }),
    lubricentro: createMockLubricentro({
      estado: 'trial' as LubricentroStatus,
      servicesUsedThisMonth: 9, // Cerca del límite de 10
      trialEndDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 días restantes
    })
  },

  // Usuario con prueba expirada
  expiredTrialUser: {
    user: createMockUser({ role: 'admin' }),
    lubricentro: createMockLubricentro({
      estado: 'trial' as LubricentroStatus,
      servicesUsedThisMonth: 10,
      trialEndDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Expirado ayer
    })
  },

  // Usuario inactivo
  inactiveUser: {
    user: createMockUser({ 
      role: 'user',
      estado: 'inactivo'
    }),
    lubricentro: createMockLubricentro({
      estado: 'inactivo' as LubricentroStatus
    })
  },

  // SuperAdmin
  superAdmin: {
    user: createMockUser({ 
      role: 'superadmin',
      lubricentroId: undefined
    }),
    lubricentro: null
  },

  // Usuario sin permisos suficientes
  limitedUser: {
    user: createMockUser({ role: 'user' }), // Solo 'user', no 'admin'
    lubricentro: createMockLubricentro({
      estado: 'activo' as LubricentroStatus,
      subscriptionPlan: 'basic' as SubscriptionPlanType
    })
  }
};

// ✅ FUNCIONES DE TESTING PARA VALIDACIONES
export const expectValidationSuccess = (result: any) => {
  if (!result.isValid || !result.canProceed) {
    throw new Error(`Expected validation to succeed, but got: ${result.message}`);
  }
};

export const expectValidationFailure = (result: any, expectedMessage?: string) => {
  if (result.isValid || result.canProceed) {
    throw new Error('Expected validation to fail, but it succeeded');
  }
  
  if (expectedMessage && !result.message.includes(expectedMessage)) {
    throw new Error(`Expected message to include "${expectedMessage}", but got: "${result.message}"`);
  }
};

export const expectSpecificErrorType = (result: any, expectedErrorType: string) => {
  if (result.errorType !== expectedErrorType) {
    throw new Error(`Expected error type "${expectedErrorType}", but got: "${result.errorType}"`);
  }
};

// ✅ MOCK PARA SERVICIOS EXTERNOS
export const mockFirebaseServices = {
  // Mock para Firestore
  mockFirestore: {
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    addDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    serverTimestamp: jest.fn(() => new Date())
  },

  // Mock para Authentication
  mockAuth: {
    currentUser: null,
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn()
  }
};

// ✅ FUNCIONES DE SETUP PARA TESTS
export const setupValidationTest = () => {
  // Reset de mocks
  Object.values(mockFirebaseServices.mockFirestore).forEach(mock => {
    if (typeof mock === 'function') {
      mock.mockClear();
    }
  });

  // Setup de respuestas por defecto
  mockFirebaseServices.mockFirestore.getDoc.mockResolvedValue({
    exists: () => true,
    data: () => testScenarios.validActiveUser.lubricentro,
    id: 'test-lubricentro-id'
  });

  mockFirebaseServices.mockFirestore.addDoc.mockResolvedValue({
    id: 'new-document-id'
  });
};

export const setupFailingValidationTest = (errorMessage: string = 'Test error') => {
  setupValidationTest();
  
  mockFirebaseServices.mockFirestore.getDoc.mockRejectedValue(
    new Error(errorMessage)
  );
};

// ✅ HELPERS PARA TESTING DE COMPONENTES
export const createMockValidationHook = (overrides: any = {}) => ({
  isValidating: false,
  canProceed: true,
  error: null,
  details: undefined,
  suggestedAction: undefined,
  validate: jest.fn().mockResolvedValue({
    isValid: true,
    canProceed: true,
    errorType: 'system',
    message: 'Success'
  }),
  resetValidation: jest.fn(),
  ...overrides
});

export const createMockAuthContext = (user?: User) => ({
  currentUser: user ? { uid: user.id, email: user.email } : null,
  userProfile: user || null,
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn()
});

// ✅ UTILIDADES PARA TESTING DE AUDITORÍA
export const expectAuditEvent = (mockAuditService: any, eventType: string, action: string) => {
  const calls = mockAuditService.logEvent.mock.calls;
  const relevantCall = calls.find((call: any[]) => 
    call[0] === eventType && call[1] === action
  );
  
  if (!relevantCall) {
    throw new Error(
      `Expected audit event "${eventType}" with action "${action}", but it was not logged. ` +
      `Actual calls: ${JSON.stringify(calls.map((call: any[]) => [call[0], call[1]]))}`
    );
  }
  
  return relevantCall;
};

export const expectNoAuditEvent = (mockAuditService: any, eventType: string) => {
  const calls = mockAuditService.logEvent.mock.calls;
  const relevantCall = calls.find((call: any[]) => call[0] === eventType);
  
  if (relevantCall) {
    throw new Error(
      `Expected no audit event of type "${eventType}", but found: ${JSON.stringify(relevantCall)}`
    );
  }
};

// ✅ SIMULADORES DE TIEMPO
export const advanceTime = (days: number) => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  // Mock Date.now para simular el avance del tiempo
  jest.spyOn(Date, 'now').mockReturnValue(futureDate.getTime());
  
  return futureDate;
};

export const resetTime = () => {
  jest.restoreAllMocks();
};

// ✅ EJEMPLOS DE TESTS UNITARIOS
export const exampleTests = {
  
  // Test básico de validación exitosa
  testSuccessfulValidation: `
    import { validationMiddleware } from '../middleware/validationMiddleware';
    import { testScenarios, expectValidationSuccess } from '../utils/testingHelpers';

    test('should allow service creation for active user', async () => {
      const { user, lubricentro } = testScenarios.validActiveUser;
      
      const result = await validationMiddleware.validateServiceCreation(
        lubricentro.id, 
        user
      );
      
      expectValidationSuccess(result);
    });
  `,
  
  // Test de validación fallida
  testFailedValidation: `
    import { validationMiddleware } from '../middleware/validationMiddleware';
    import { testScenarios, expectValidationFailure } from '../utils/testingHelpers';

    test('should reject service creation for expired trial', async () => {
      const { user, lubricentro } = testScenarios.expiredTrialUser;
      
      const result = await validationMiddleware.validateServiceCreation(
        lubricentro.id, 
        user
      );
      
      expectValidationFailure(result, 'período de prueba ha expirado');
    });
  `,
  
  // Test de auditoría
  testAuditLogging: `
    import { auditLoggingService } from '../services/auditLoggingService';
    import { testScenarios, expectAuditEvent } from '../utils/testingHelpers';

    test('should log service creation event', async () => {
      const mockAuditService = jest.spyOn(auditLoggingService, 'logEvent');
      const { user, lubricentro } = testScenarios.validActiveUser;
      
      await auditLoggingService.logServiceCreated(
        user,
        lubricentro.id,
        lubricentro.fantasyName,
        'TEST-00001'
      );
      
      expectAuditEvent(mockAuditService, 'service_created', 'CREATE_SERVICE');
    });
  `,
  
  // Test de componente con ValidationGuard
  testValidationGuard: `
    import { render, screen } from '@testing-library/react';
    import ValidationGuard from '../components/common/ValidationGuard';
    import { createMockValidationHook, createMockAuthContext } from '../utils/testingHelpers';

    test('should show content when validation passes', () => {
      const mockValidation = createMockValidationHook({
        canProceed: true,
        error: null
      });
      
      jest.mock('../hooks/useValidation', () => ({
        useValidation: () => mockValidation
      }));
      
      render(
        <ValidationGuard action="create_service">
          <div>Protected Content</div>
        </ValidationGuard>
      );
      
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  `
};

// ✅ CONFIGURACIÓN DE JEST RECOMENDADA
export const jestConfig = `
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*): '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
`;

// ✅ SETUP DE TESTING LIBRARY
export const setupTestsFile = `
// src/setupTests.ts
import '@testing-library/jest-dom';
import { setupValidationTest, mockFirebaseServices } from './utils/testingHelpers';

// Mock Firebase
jest.mock('./lib/firebase', () => ({
  db: mockFirebaseServices.mockFirestore,
  auth: mockFirebaseServices.mockAuth
}));

// Setup global para cada test
beforeEach(() => {
  setupValidationTest();
});
`;

export default {
  createMockUser,
  createMockLubricentro,
  testScenarios,
  expectValidationSuccess,
  expectValidationFailure,
  expectSpecificErrorType,
  mockFirebaseServices,
  setupValidationTest,
  setupFailingValidationTest,
  createMockValidationHook,
  createMockAuthContext,
  expectAuditEvent,
  expectNoAuditEvent,
  advanceTime,
  resetTime,
  exampleTests
};