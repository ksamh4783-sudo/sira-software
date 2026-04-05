export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user' | 'distributor';
  avatar?: string;
  companyName?: string;
  phone?: string;
  address?: string;
  subscriptionPlan: 'starter' | 'business' | 'enterprise';
  subscriptionStatus: 'active' | 'expired' | 'cancelled';
  subscriptionExpiry?: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface Router {
  id: string;
  name: string;
  ipAddress: string;
  macAddress?: string;
  status: 'online' | 'offline' | 'maintenance';
  location?: string;
  username?: string;
  password?: string;
  port?: number;
  companyId: string;
  lastSeen?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Voucher {
  id: string;
  code: string;
  duration: number;
  dataLimit: number;
  speedLimit: string;
  price: number;
  isUsed: boolean;
  usedBy?: string;
  usedAt?: string;
  companyId: string;
  createdAt: string;
  expiresAt?: string;
}

export interface Background {
  id: string;
  name: string;
  imageUrl: string;
  category: 'cafe' | 'restaurant' | 'hotel' | 'company' | 'mall' | 'general';
  isDefault: boolean;
  companyId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PrintCard {
  id: string;
  title: string;
  template: 'modern' | 'classic' | 'minimal' | 'colorful' | 'elegant';
  voucherCode: string;
  duration: number;
  dataLimit: number;
  speedLimit: string;
  price: number;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  showLogo: boolean;
  showQR: boolean;
  notes: string;
  printCount: number;
  lastPrintedAt?: string;
  companyId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface HotspotPage {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  backgroundImage: string;
  backgroundColor: string;
  logoUrl: string;
  welcomeMessage: string;
  instructions: string;
  termsText: string;
  showTerms: boolean;
  showLogo: boolean;
  showVoucherInput: boolean;
  showPhoneInput: boolean;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  buttonText: string;
  footerText: string;
  isActive: boolean;
  viewCount: number;
  lastViewedAt?: string;
  companyId: string;
  createdAt: string;
  updatedAt?: string;
}

// Fingerprint Device
export interface FingerprintDevice {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  status: 'online' | 'offline';
  model: string;
  serialNumber?: string;
  location?: string;
  totalUsers: number;
  lastSync?: string;
  companyId: string;
  createdAt: string;
  updatedAt?: string;
}

// DVR Camera
export interface DVRCamera {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  status: 'online' | 'offline';
  model: string;
  channel: number;
  username: string;
  password: string;
  location?: string;
  streamUrl?: string;
  companyId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  details: Record<string, any>;
  timestamp: string;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  count: number;
}

export interface DashboardStats {
  totalRouters: number;
  activeRouters: number;
  totalVouchers: number;
  usedVouchers: number;
  unusedVouchers: number;
  revenue: number;
  totalBackgrounds: number;
  totalPrintCards: number;
  totalHotspotPages: number;
  activeHotspotPages: number;
  totalFingerprintDevices: number;
  activeFingerprintDevices: number;
  totalDVRCameras: number;
  activeDVRCameras: number;
  monthlyRevenue: MonthlyRevenue[];
  recentActivity: ActivityLog[];
  systemHealth: {
    status: string;
    uptime: number;
    lastBackup: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  companyName?: string;
  phone?: string;
}
