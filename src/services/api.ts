import type { 
  Router, 
  Voucher, 
  Background, 
  PrintCard, 
  HotspotPage,
  DashboardStats, 
  ActivityLog,
  ApiResponse,
  User,
  FingerprintDevice,
  DVRCamera
} from '@/types';

// Use relative URL — Vite dev proxy forwards /api → localhost:3000
// In production, Express serves the built frontend and handles /api directly
const API_URL = '';

function getToken(): string | null {
  return localStorage.getItem('sira_token');
}

async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'An error occurred',
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export { fetchWithAuth };

// Auth API
export const authApi = {
  login: (email: string, password: string) => 
    fetchWithAuth<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  
  register: (data: {
    email: string;
    password: string;
    name: string;
    companyName?: string;
    phone?: string;
    address?: string;
  }) => fetchWithAuth<{ token: string; user: User }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  me: () => fetchWithAuth<User>('/api/auth/me'),
  
  updateProfile: (data: Partial<User>) => 
    fetchWithAuth<User>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Dashboard API
export const dashboardApi = {
  getStats: () => fetchWithAuth<DashboardStats>('/api/dashboard'),
};

// Routers API
export const routersApi = {
  getAll: () => fetchWithAuth<Router[]>('/api/routers'),
  
  create: (data: Partial<Router>) => 
    fetchWithAuth<Router>('/api/routers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: Partial<Router>) => 
    fetchWithAuth<Router>(`/api/routers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) => 
    fetchWithAuth<null>(`/api/routers/${id}`, {
      method: 'DELETE',
    }),
  
  testConnection: (data: { ipAddress: string; port?: number; username?: string; password?: string }) => 
    fetchWithAuth<{ success: boolean; message?: string; error?: string }>('/api/routers/test-connection', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getLiveStats: (data: { ipAddress: string; port?: number; username?: string; password?: string }) => 
    fetchWithAuth<{ hotspotActiveCount: number; pppoeActiveCount: number; cpuLoad: number }>('/api/routers/live-stats', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Vouchers API
export const vouchersApi = {
  getAll: () => fetchWithAuth<Voucher[]>('/api/vouchers'),
  
  create: (data: Partial<Voucher> & { quantity?: number }) => 
    fetchWithAuth<Voucher | Voucher[]>('/api/vouchers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  use: (id: string, usedBy?: string) => 
    fetchWithAuth<Voucher>(`/api/vouchers/${id}/use`, {
      method: 'PUT',
      body: JSON.stringify({ usedBy }),
    }),
  
  delete: (id: string) => 
    fetchWithAuth<null>(`/api/vouchers/${id}`, {
      method: 'DELETE',
    }),
};

// Backgrounds API
export const backgroundsApi = {
  getAll: () => fetchWithAuth<Background[]>('/api/backgrounds'),
  
  create: (data: Partial<Background>) => 
    fetchWithAuth<Background>('/api/backgrounds', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: Partial<Background>) => 
    fetchWithAuth<Background>(`/api/backgrounds/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) => 
    fetchWithAuth<null>(`/api/backgrounds/${id}`, {
      method: 'DELETE',
    }),
};

// Print Cards API
export const printCardsApi = {
  getAll: () => fetchWithAuth<PrintCard[]>('/api/print-cards'),
  
  create: (data: Partial<PrintCard>) => 
    fetchWithAuth<PrintCard>('/api/print-cards', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  print: (id: string) => 
    fetchWithAuth<PrintCard>(`/api/print-cards/${id}/print`, {
      method: 'PUT',
    }),
  
  delete: (id: string) => 
    fetchWithAuth<null>(`/api/print-cards/${id}`, {
      method: 'DELETE',
    }),
};

// Hotspot Pages API
export const hotspotPagesApi = {
  getAll: () => fetchWithAuth<HotspotPage[]>('/api/hotspot-pages'),
  
  getPublic: (id: string) => 
    fetch(`/api/hotspot-pages/${id}/public`).then(r => r.json()),
  
  create: (data: Partial<HotspotPage>) => 
    fetchWithAuth<HotspotPage>('/api/hotspot-pages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: Partial<HotspotPage>) => 
    fetchWithAuth<HotspotPage>(`/api/hotspot-pages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) => 
    fetchWithAuth<null>(`/api/hotspot-pages/${id}`, {
      method: 'DELETE',
    }),
};

// Fingerprint Devices API
export const fingerprintApi = {
  getAll: () => fetchWithAuth<FingerprintDevice[]>('/api/fingerprint'),
  create: (data: Partial<FingerprintDevice>) => 
    fetchWithAuth<FingerprintDevice>('/api/fingerprint', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<FingerprintDevice>) => 
    fetchWithAuth<FingerprintDevice>(`/api/fingerprint/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => 
    fetchWithAuth<null>(`/api/fingerprint/${id}`, {
      method: 'DELETE',
    }),
};

// DVR Cameras API
export const dvrApi = {
  getAll: () => fetchWithAuth<DVRCamera[]>('/api/dvr'),
  create: (data: Partial<DVRCamera>) => 
    fetchWithAuth<DVRCamera>('/api/dvr', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<DVRCamera>) => 
    fetchWithAuth<DVRCamera>(`/api/dvr/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => 
    fetchWithAuth<null>(`/api/dvr/${id}`, {
      method: 'DELETE',
    }),
};

// Activity API
export const activityApi = {
  getAll: () => fetchWithAuth<ActivityLog[]>('/api/activity'),
};

// Health Check
export const healthApi = {
  check: () => fetch('/api/health').then(r => r.json()),
};

export default {
  auth: authApi,
  dashboard: dashboardApi,
  routers: routersApi,
  vouchers: vouchersApi,
  backgrounds: backgroundsApi,
  printCards: printCardsApi,
  hotspotPages: hotspotPagesApi,
  fingerprint: fingerprintApi,
  dvr: dvrApi,
  activity: activityApi,
  health: healthApi,
};
