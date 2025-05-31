// src/services/auditLoggingService.ts
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from '../types';

// ✅ TIPOS PARA AUDITORÍA
export type AuditEventType = 
  | 'user_login' 
  | 'user_logout' 
  | 'service_created' 
  | 'service_updated' 
  | 'service_deleted'
  | 'user_created' 
  | 'user_updated' 
  | 'user_deleted'
  | 'subscription_activated' 
  | 'subscription_deactivated' 
  | 'subscription_changed'
  | 'trial_extended'
  | 'admin_action'
  | 'system_error'
  | 'validation_failed'
  | 'permission_denied';

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AuditEvent {
  id?: string;
  type: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  lubricentroId?: string;
  lubricentroName?: string;
  action: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  sessionId?: string;
}

export interface AuditQuery {
  lubricentroId?: string;
  userId?: string;
  type?: AuditEventType;
  severity?: AuditSeverity;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

// ✅ CLASE PRINCIPAL DEL SERVICIO DE AUDITORÍA
class AuditLoggingService {
  private readonly COLLECTION_NAME = 'audit_logs';
  private sessionId: string;

  constructor() {
    // Generar un ID de sesión único
    this.sessionId = this.generateSessionId();
  }

  /**
   * Registra un evento de auditoría
   */
  async logEvent(
    type: AuditEventType,
    action: string,
    description: string,
    options: {
      user?: User;
      lubricentroId?: string;
      lubricentroName?: string;
      severity?: AuditSeverity;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<void> {
    try {
      const { user, lubricentroId, lubricentroName, severity = 'info', metadata } = options;

      const auditEvent: Omit<AuditEvent, 'id'> = {
        type,
        severity,
        userId: user?.id,
        userEmail: user?.email,
        userRole: user?.role,
        lubricentroId,
        lubricentroName,
        action,
        description,
        metadata,
        ipAddress: await this.getClientIP(),
        userAgent: this.getUserAgent(),
        timestamp: new Date(),
        sessionId: this.sessionId
      };

      await addDoc(collection(db, this.COLLECTION_NAME), {
        ...auditEvent,
        timestamp: serverTimestamp()
      });

      // Log en consola para desarrollo
      this.logToConsole(auditEvent);

    } catch (error) {
      console.error('Error al registrar evento de auditoría:', error);
      // No relanzar el error para evitar que interrumpa la operación principal
    }
  }

  /**
   * Obtiene logs de auditoría con filtros
   */
  async getAuditLogs(auditQuery: AuditQuery = {}): Promise<AuditEvent[]> {
    try {
      let q = collection(db, this.COLLECTION_NAME);
      const constraints = [];

      // Aplicar filtros
      if (auditQuery.lubricentroId) {
        constraints.push(where('lubricentroId', '==', auditQuery.lubricentroId));
      }

      if (auditQuery.userId) {
        constraints.push(where('userId', '==', auditQuery.userId));
      }

      if (auditQuery.type) {
        constraints.push(where('type', '==', auditQuery.type));
      }

      if (auditQuery.severity) {
        constraints.push(where('severity', '==', auditQuery.severity));
      }

      if (auditQuery.startDate) {
        constraints.push(where('timestamp', '>=', auditQuery.startDate));
      }

      if (auditQuery.endDate) {
        constraints.push(where('timestamp', '<=', auditQuery.endDate));
      }

      // Agregar ordenamiento y límite
      constraints.push(orderBy('timestamp', 'desc'));
      constraints.push(limit(auditQuery.limit || 100));

      const queryRef = query(q, ...constraints);
      const querySnapshot = await getDocs(queryRef);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as AuditEvent[];

    } catch (error) {
      console.error('Error al obtener logs de auditoría:', error);
      throw error;
    }
  }

  /**
   * Métodos de conveniencia para tipos específicos de eventos
   */

  async logUserLogin(user: User, metadata?: Record<string, any>): Promise<void> {
    await this.logEvent(
      'user_login',
      'LOGIN',
      `Usuario ${user.email} inició sesión`,
      { user, severity: 'info', metadata }
    );
  }

  async logUserLogout(user: User): Promise<void> {
    await this.logEvent(
      'user_logout',
      'LOGOUT',
      `Usuario ${user.email} cerró sesión`,
      { user, severity: 'info' }
    );
  }

  async logServiceCreated(
    user: User, 
    lubricentroId: string, 
    lubricentroName: string,
    serviceNumber: string
  ): Promise<void> {
    await this.logEvent(
      'service_created',
      'CREATE_SERVICE',
      `Servicio ${serviceNumber} creado`,
      { 
        user, 
        lubricentroId, 
        lubricentroName, 
        severity: 'info',
        metadata: { serviceNumber }
      }
    );
  }

  async logUserCreated(
    createdBy: User,
    newUserEmail: string,
    lubricentroId: string,
    lubricentroName: string
  ): Promise<void> {
    await this.logEvent(
      'user_created',
      'CREATE_USER',
      `Usuario ${newUserEmail} creado`,
      { 
        user: createdBy, 
        lubricentroId, 
        lubricentroName, 
        severity: 'info',
        metadata: { newUserEmail }
      }
    );
  }

  async logSubscriptionActivated(
    activatedBy: User,
    lubricentroId: string,
    lubricentroName: string,
    plan: string
  ): Promise<void> {
    await this.logEvent(
      'subscription_activated',
      'ACTIVATE_SUBSCRIPTION',
      `Suscripción plan ${plan} activada para ${lubricentroName}`,
      { 
        user: activatedBy, 
        lubricentroId, 
        lubricentroName, 
        severity: 'info',
        metadata: { plan }
      }
    );
  }

  async logSubscriptionDeactivated(
    deactivatedBy: User,
    lubricentroId: string,
    lubricentroName: string,
    reason?: string
  ): Promise<void> {
    await this.logEvent(
      'subscription_deactivated',
      'DEACTIVATE_SUBSCRIPTION',
      `Suscripción desactivada para ${lubricentroName}${reason ? `: ${reason}` : ''}`,
      { 
        user: deactivatedBy, 
        lubricentroId, 
        lubricentroName, 
        severity: 'warning',
        metadata: { reason }
      }
    );
  }

  async logTrialExtended(
    extendedBy: User,
    lubricentroId: string,
    lubricentroName: string,
    days: number
  ): Promise<void> {
    await this.logEvent(
      'trial_extended',
      'EXTEND_TRIAL',
      `Período de prueba extendido ${days} días para ${lubricentroName}`,
      { 
        user: extendedBy, 
        lubricentroId, 
        lubricentroName, 
        severity: 'info',
        metadata: { days }
      }
    );
  }

  async logValidationFailed(
    user: User | undefined,
    action: string,
    reason: string,
    lubricentroId?: string
  ): Promise<void> {
    await this.logEvent(
      'validation_failed',
      'VALIDATION_ERROR',
      `Validación falló para ${action}: ${reason}`,
      { 
        user, 
        lubricentroId, 
        severity: 'warning',
        metadata: { action, reason }
      }
    );
  }

  async logPermissionDenied(
    user: User | undefined,
    action: string,
    requiredRole?: string
  ): Promise<void> {
    await this.logEvent(
      'permission_denied',
      'ACCESS_DENIED',
      `Acceso denegado para ${action}${requiredRole ? ` (requiere: ${requiredRole})` : ''}`,
      { 
        user, 
        severity: 'warning',
        metadata: { action, requiredRole }
      }
    );
  }

  async logSystemError(
    error: Error,
    context: string,
    user?: User,
    lubricentroId?: string
  ): Promise<void> {
    await this.logEvent(
      'system_error',
      'ERROR',
      `Error del sistema en ${context}: ${error.message}`,
      { 
        user, 
        lubricentroId, 
        severity: 'error',
        metadata: { 
          context, 
          errorName: error.name,
          errorStack: error.stack?.slice(0, 500) // Limitar el stack trace
        }
      }
    );
  }

  /**
   * Obtiene estadísticas de eventos de auditoría
   */
  async getAuditStatistics(lubricentroId?: string, days: number = 30): Promise<{
    totalEvents: number;
    eventsByType: Record<AuditEventType, number>;
    eventsBySeverity: Record<AuditSeverity, number>;
    recentErrors: AuditEvent[];
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const logs = await this.getAuditLogs({
        lubricentroId,
        startDate,
        endDate,
        limit: 1000
      });

      const eventsByType: Record<string, number> = {};
      const eventsBySeverity: Record<string, number> = {};

      logs.forEach(log => {
        eventsByType[log.type] = (eventsByType[log.type] || 0) + 1;
        eventsBySeverity[log.severity] = (eventsBySeverity[log.severity] || 0) + 1;
      });

      const recentErrors = logs
        .filter(log => log.severity === 'error' || log.severity === 'critical')
        .slice(0, 10);

      return {
        totalEvents: logs.length,
        eventsByType: eventsByType as Record<AuditEventType, number>,
        eventsBySeverity: eventsBySeverity as Record<AuditSeverity, number>,
        recentErrors
      };

    } catch (error) {
      console.error('Error al obtener estadísticas de auditoría:', error);
      throw error;
    }
  }

  // ============ MÉTODOS PRIVADOS ============

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getClientIP(): Promise<string> {
    try {
      // En un entorno de producción, esto se obtendría del servidor
      // Por ahora, devolvemos un placeholder
      return 'client_ip';
    } catch (error) {
      return 'unknown';
    }
  }

  private getUserAgent(): string {
    try {
      return navigator.userAgent || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  private logToConsole(event: Omit<AuditEvent, 'id'>): void {
    const { type, severity, action, description, userId, userEmail } = event;
    
    const logMessage = `[AUDIT] ${type.toUpperCase()} | ${action} | ${description} | User: ${userEmail || userId || 'anonymous'}`;
    
    switch (severity) {
      case 'error':
      case 'critical':
        console.error(logMessage);
        break;
      case 'warning':
        console.warn(logMessage);
        break;
      default:
        console.log(logMessage);
    }
  }
}

// ✅ EXPORTAR INSTANCIA SINGLETON
export const auditLoggingService = new AuditLoggingService();

// ✅ FUNCIONES DE CONVENIENCIA
export const logEvent = (
  type: AuditEventType,
  action: string,
  description: string,
  options?: {
    user?: User;
    lubricentroId?: string;
    lubricentroName?: string;
    severity?: AuditSeverity;
    metadata?: Record<string, any>;
  }
) => auditLoggingService.logEvent(type, action, description, options);

export const getAuditLogs = (query?: AuditQuery) => auditLoggingService.getAuditLogs(query);

export const getAuditStatistics = (lubricentroId?: string, days?: number) => 
  auditLoggingService.getAuditStatistics(lubricentroId, days);

export default auditLoggingService;