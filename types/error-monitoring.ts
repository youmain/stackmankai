export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorLog {
  id: string;
  timestamp: number;
  message: string;
  stack?: string;
  context?: string;
  severity: ErrorSeverity;
  userId?: string;
  storeId?: string;
  url?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface ErrorSummary {
  count: number;
  lastOccurrence: number;
  severity: ErrorSeverity;
  message: string;
}
