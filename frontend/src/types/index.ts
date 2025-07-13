// Export all types from their respective modules
export * from './auth';
export * from './api';
export * from './calls';
export * from './dashboard';

// Common utility types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type SortDirection = 'asc' | 'desc';

export type PaginationParams = {
  page: number;
  limit: number;
  sortBy?: string;
  sortDirection?: SortDirection;
};

export type PaginationResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// Form validation types
export type ValidationRule = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => boolean | string;
};

export type ValidationErrors = Record<string, string[]>;

// UI Component types
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type InputType = 'text' | 'email' | 'password' | 'tel' | 'number' | 'date' | 'time';

// Theme types
export type Theme = 'light' | 'dark' | 'auto';
export type ColorScheme = 'blue' | 'green' | 'purple' | 'red' | 'yellow' | 'gray';

// Notification types
export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

// Modal types
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

// Table types
export type TableColumn<T> = {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
};

// Chart types
export type ChartType = 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
export type ChartDataPoint = {
  label: string;
  value: number;
  color?: string;
};

// Date range types
export type DateRange = {
  start: Date;
  end: Date;
};

// Filter types
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like' | 'regex';

export type FilterCondition = {
  field: string;
  operator: FilterOperator;
  value: unknown;
};

export type FilterGroup = {
  operator: 'and' | 'or';
  conditions: (FilterCondition | FilterGroup)[];
};

// Search types
export type SearchOptions = {
  query: string;
  fields?: string[];
  fuzzy?: boolean;
  caseSensitive?: boolean;
};

// Export types
export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'json';

export type ExportOptions = {
  format: ExportFormat;
  fields?: string[];
  filename?: string;
  includeHeaders?: boolean;
};

// WebSocket types
export type WebSocketMessage<T = unknown> = {
  type: string;
  data: T;
  timestamp: Date;
  id?: string;
};

export type WebSocketEvent = 'open' | 'close' | 'message' | 'error';

// File upload types
export type FileUpload = {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
};

// API Response wrapper
export type ApiResponseWrapper<T> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
};

// Error handling types
export type AppError = {
  code: string;
  message: string;
  details?: unknown;
  stack?: string;
  timestamp: Date;
  context?: Record<string, unknown>;
};

// Configuration types
export type AppConfig = {
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  features: {
    realTimeUpdates: boolean;
    analytics: boolean;
    notifications: boolean;
  };
  ui: {
    theme: Theme;
    language: string;
    timezone: string;
  };
};

// Localization types
export type Locale = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja' | 'ko';

export type TranslationKey = string;

export type TranslationData = Record<TranslationKey, string>;

// Performance monitoring types
export type PerformanceMetric = {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
};

export type PerformanceEvent = {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  metadata?: Record<string, unknown>;
};

// Accessibility types
export type AccessibilityLevel = 'A' | 'AA' | 'AAA';

export type AccessibilityFeature = {
  name: string;
  supported: boolean;
  level: AccessibilityLevel;
};

// Security types
export type Permission = {
  resource: string;
  actions: string[];
  conditions?: Record<string, unknown>;
};

export type SecurityContext = {
  userId: string;
  roles: string[];
  permissions: Permission[];
  sessionId: string;
  ipAddress: string;
  userAgent: string;
}; 