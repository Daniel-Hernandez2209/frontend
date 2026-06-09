// src/app/core/services/logger.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

export interface LogEntry {
  level: 'info' | 'warning' | 'error';
  message: string;
  context?: string;
  data?: any;
  timestamp: Date;
  userAgent: string;
  url: string;
}

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private http = inject(HttpClient);
  private isDev = !environment.production;

  logInfo(message: string, context?: string, data?: any): void {
    console.log(`ℹ️  [INFO] ${message}`, data || '');
    this.sendToServer('info', message, context, data);
  }

  logWarning(message: string, context?: string, data?: any): void {
    console.warn(`⚠️  [WARNING] ${message}`, data || '');
    this.sendToServer('warning', message, context, data);
  }

  logError(message: string, context?: string, data?: any): void {
    console.error(`❌ [ERROR] ${message}`, data || '');
    this.sendToServer('error', message, context, data);
  }

  private sendToServer(level: string, message: string, context?: string, data?: any): void {
    if (this.isDev) {
      // En desarrollo, no enviar a servidor
      return;
    }

    const entry: LogEntry = {
      level: level as any,
      message,
      context,
      data,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // En producción, enviar a servicio de logs
    // this.http.post(`${environment.apiUrl}/logs`, entry).subscribe();
  }
}
