import { CallStats } from './calls';

// Dashboard Data Types
export interface DashboardData {
  user: UserStats;
  calls: CallStats;
  leads: LeadStats;
  performance: PerformanceMetrics;
  recentActivity: ActivityItem[];
  charts: ChartData;
}

// User Statistics
export interface UserStats {
  totalCalls: number;
  callsToday: number;
  callsThisWeek: number;
  callsThisMonth: number;
  averageCallDuration: number;
  successRate: number;
  totalLeads: number;
  qualifiedLeads: number;
  conversionRate: number;
  lastActive: Date;
}

// Lead Statistics
export interface LeadStats {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  lostLeads: number;
  averageResponseTime: number;
  topSources: LeadSource[];
  industryBreakdown: IndustryStats[];
}

// Lead Source
export interface LeadSource {
  source: string;
  count: number;
  conversionRate: number;
  averageValue: number;
}

// Industry Statistics
export interface IndustryStats {
  industry: string;
  count: number;
  conversionRate: number;
  averageCallDuration: number;
}

// Performance Metrics
export interface PerformanceMetrics {
  daily: DailyMetrics[];
  weekly: WeeklyMetrics[];
  monthly: MonthlyMetrics[];
  trends: TrendData;
}

// Daily Metrics
export interface DailyMetrics {
  date: string;
  calls: number;
  answered: number;
  completed: number;
  duration: number;
  successRate: number;
}

// Weekly Metrics
export interface WeeklyMetrics {
  week: string;
  calls: number;
  answered: number;
  completed: number;
  duration: number;
  successRate: number;
  leads: number;
  qualified: number;
}

// Monthly Metrics
export interface MonthlyMetrics {
  month: string;
  calls: number;
  answered: number;
  completed: number;
  duration: number;
  successRate: number;
  leads: number;
  qualified: number;
  revenue?: number;
}

// Trend Data
export interface TrendData {
  callVolume: TrendPoint[];
  successRate: TrendPoint[];
  averageDuration: TrendPoint[];
  leadConversion: TrendPoint[];
}

// Trend Point
export interface TrendPoint {
  date: string;
  value: number;
  change: number;
  changePercent: number;
}

// Activity Item
export interface ActivityItem {
  id: string;
  type: 'call' | 'lead' | 'user' | 'system';
  action: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

// Chart Data
export interface ChartData {
  callVolume: ChartPoint[];
  successRate: ChartPoint[];
  leadConversion: ChartPoint[];
  callDuration: ChartPoint[];
  topLeads: TopLead[];
}

// Chart Point
export interface ChartPoint {
  label: string;
  value: number;
  color?: string;
}

// Top Lead
export interface TopLead {
  id: string;
  name: string;
  company: string;
  phoneNumber: string;
  status: string;
  value: number;
  lastContacted: Date;
}

// User Management Types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  avatar?: string;
  phoneNumber?: string;
  department?: string;
  position?: string;
  permissions: Permission[];
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// User Role
export type UserRole = 'admin' | 'manager' | 'sdr' | 'viewer';

// Permission
export interface Permission {
  resource: string;
  actions: string[];
}

// User List Response
export interface UserListResponse {
  success: boolean;
  message: string;
  data?: {
    users: UserProfile[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// User Update Request
export interface UserUpdateRequest {
  name?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
  phoneNumber?: string;
  department?: string;
  position?: string;
  permissions?: Permission[];
}

// Password Change Request
export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Profile Update Request
export interface ProfileUpdateRequest {
  name?: string;
  email?: string;
  phoneNumber?: string;
  avatar?: string;
}

// User Statistics
export interface UserPerformanceStats {
  userId: string;
  user: UserProfile;
  calls: CallStats;
  leads: LeadStats;
  performance: PerformanceMetrics;
  ranking: number;
  achievements: Achievement[];
}

// Achievement
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
  progress?: number;
  target?: number;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  timestamp: Date;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

// Settings Types
export interface UserSettings {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: NotificationSettings;
  callSettings: CallSettings;
  displaySettings: DisplaySettings;
}

// Notification Settings
export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  callAlerts: boolean;
  leadAlerts: boolean;
  performanceAlerts: boolean;
}

// Call Settings
export interface CallSettings {
  autoRecord: boolean;
  defaultScript: string;
  callTimeout: number;
  retryAttempts: number;
  voicemailDetection: boolean;
}

// Display Settings
export interface DisplaySettings {
  dashboardLayout: string;
  defaultView: 'list' | 'grid' | 'calendar';
  showCharts: boolean;
  showNotifications: boolean;
  compactMode: boolean;
} 