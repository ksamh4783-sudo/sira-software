// Local Storage API - Works without external backend
import type { 
  User, 
  Router, 
  Voucher, 
  Background, 
  PrintCard, 
  HotspotPage,
  DashboardStats,
  ActivityLog,
  FingerprintDevice,
  DVRCamera
} from '@/types';

// Storage Keys
const STORAGE_KEYS = {
  USERS: 'sira_users',
  CURRENT_USER: 'sira_current_user',
  ROUTERS: 'sira_routers',
  VOUCHERS: 'sira_vouchers',
  BACKGROUNDS: 'sira_backgrounds',
  PRINT_CARDS: 'sira_print_cards',
  HOTSPOT_PAGES: 'sira_hotspot_pages',
  ACTIVITY_LOGS: 'sira_activity_logs',
  FINGERPRINT_DEVICES: 'sira_fingerprint_devices',
  DVR_CAMERAS: 'sira_dvr_cameras',
  SETTINGS: 'sira_settings'
};

// Helper functions
const getStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setStorage = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const logActivity = (userId: string, action: string, details: Record<string, any> = {}) => {
  const logs = getStorage<ActivityLog[]>(STORAGE_KEYS.ACTIVITY_LOGS, []);
  logs.unshift({
    id: generateId(),
    userId,
    action,
    details,
    timestamp: new Date().toISOString()
  });
  if (logs.length > 100) logs.pop();
  setStorage(STORAGE_KEYS.ACTIVITY_LOGS, logs);
};

// Initialize default admin
const initAdmin = () => {
  const users = getStorage<User[]>(STORAGE_KEYS.USERS, []);
  if (users.length === 0) {
    const adminUser: User = {
      id: generateId(),
      email: 'admin@sira.software',
      password: 'admin123', // In production, this should be hashed
      name: 'المشرف',
      role: 'admin',
      avatar: '',
      companyName: 'Sira Software',
      phone: '+201065063147',
      subscriptionPlan: 'enterprise',
      subscriptionStatus: 'active',
      subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      lastLogin: undefined,
      isActive: true
    };
    setStorage(STORAGE_KEYS.USERS, [adminUser]);
  }
};

initAdmin();

// Auth API
export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    
    const users = getStorage<User[]>(STORAGE_KEYS.USERS, []);
    const user = users.find(u => u.email === credentials.email && u.password === credentials.password && u.isActive);
    
    if (!user) {
      return { success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
    }
    
    user.lastLogin = new Date().toISOString();
    setStorage(STORAGE_KEYS.USERS, users);
    setStorage(STORAGE_KEYS.CURRENT_USER, user);
    
    logActivity(user.id, 'LOGIN', { email: user.email });
    
    return {
      success: true,
      data: {
        token: generateId(),
        user: user as User
      }
    };
  },
  
  register: async (data: { email: string; password: string; name: string; companyName?: string; phone?: string }) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const users = getStorage<User[]>(STORAGE_KEYS.USERS, []);
    
    if (users.find(u => u.email === data.email)) {
      return { success: false, error: 'البريد الإلكتروني مستخدم بالفعل' };
    }
    
    const newUser: User = {
      id: generateId(),
      email: data.email,
      password: data.password,
      name: data.name,
      role: 'user',
      companyName: data.companyName || '',
      phone: data.phone || '',
      subscriptionPlan: 'starter',
      subscriptionStatus: 'active',
      subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      lastLogin: undefined,
      isActive: true
    };
    
    users.push(newUser);
    setStorage(STORAGE_KEYS.USERS, users);
    
    logActivity(newUser.id, 'REGISTER', { email: data.email });
    
    return { success: true, message: 'تم إنشاء الحساب بنجاح' };
  },
  
  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },
  
  getCurrentUser: () => {
    return getStorage<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  },
  
  updateProfile: async (userId: string, data: Partial<User>) => {
    const users = getStorage<User[]>(STORAGE_KEYS.USERS, []);
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return { success: false, error: 'المستخدم غير موجود' };
    }
    
    users[userIndex] = { ...users[userIndex], ...data };
    setStorage(STORAGE_KEYS.USERS, users);
    setStorage(STORAGE_KEYS.CURRENT_USER, users[userIndex]);
    
    return { success: true, data: users[userIndex] };
  }
};

// Dashboard API
export const dashboardApi = {
  getStats: async (userId: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const routers = getStorage<Router[]>(STORAGE_KEYS.ROUTERS, []).filter(r => r.companyId === userId);
    const vouchers = getStorage<Voucher[]>(STORAGE_KEYS.VOUCHERS, []).filter(v => v.companyId === userId);
    const backgrounds = getStorage<Background[]>(STORAGE_KEYS.BACKGROUNDS, []).filter(b => b.companyId === userId);
    const printCards = getStorage<PrintCard[]>(STORAGE_KEYS.PRINT_CARDS, []).filter(c => c.companyId === userId);
    const hotspotPages = getStorage<HotspotPage[]>(STORAGE_KEYS.HOTSPOT_PAGES, []).filter(p => p.companyId === userId);
    const fingerprintDevices = getStorage<FingerprintDevice[]>(STORAGE_KEYS.FINGERPRINT_DEVICES, []).filter(d => d.companyId === userId);
    const dvrCameras = getStorage<DVRCamera[]>(STORAGE_KEYS.DVR_CAMERAS, []).filter(c => c.companyId === userId);
    const logs = getStorage<ActivityLog[]>(STORAGE_KEYS.ACTIVITY_LOGS, []).filter(l => l.userId === userId).slice(0, 10);
    
    // Calculate monthly revenue
    const now = new Date();
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthVouchers = vouchers.filter(v => {
        const vDate = new Date(v.createdAt);
        return vDate.getMonth() === month.getMonth() && vDate.getFullYear() === month.getFullYear();
      });
      monthlyRevenue.push({
        month: month.toLocaleString('ar-EG', { month: 'short' }),
        revenue: monthVouchers.filter(v => v.isUsed).reduce((sum, v) => sum + (v.price || 0), 0),
        count: monthVouchers.length
      });
    }
    
    const stats: DashboardStats = {
      totalRouters: routers.length,
      activeRouters: routers.filter(r => r.status === 'online').length,
      totalVouchers: vouchers.length,
      usedVouchers: vouchers.filter(v => v.isUsed).length,
      unusedVouchers: vouchers.filter(v => !v.isUsed).length,
      revenue: vouchers.filter(v => v.isUsed).reduce((sum, v) => sum + (v.price || 0), 0),
      totalBackgrounds: backgrounds.length,
      totalPrintCards: printCards.length,
      totalHotspotPages: hotspotPages.length,
      activeHotspotPages: hotspotPages.filter(p => p.isActive).length,
      totalFingerprintDevices: fingerprintDevices.length,
      activeFingerprintDevices: fingerprintDevices.filter(d => d.status === 'online').length,
      totalDVRCameras: dvrCameras.length,
      activeDVRCameras: dvrCameras.filter(c => c.status === 'online').length,
      monthlyRevenue,
      recentActivity: logs,
      systemHealth: {
        status: 'excellent',
        uptime: Date.now(),
        lastBackup: new Date().toISOString()
      }
    };
    
    return { success: true, data: stats };
  }
};

// Routers API
export const routersApi = {
  getAll: (userId: string) => {
    const routers = getStorage<Router[]>(STORAGE_KEYS.ROUTERS, []);
    return { success: true, data: routers.filter(r => r.companyId === userId) };
  },
  
  create: (userId: string, data: Partial<Router>) => {
    const routers = getStorage<Router[]>(STORAGE_KEYS.ROUTERS, []);
    const newRouter: Router = {
      id: generateId(),
      name: data.name || '',
      ipAddress: data.ipAddress || '',
      macAddress: data.macAddress || '',
      status: data.status || 'offline',
      location: data.location || '',
      username: data.username || 'admin',
      password: data.password || '',
      port: data.port || 8728,
      companyId: userId,
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    routers.push(newRouter);
    setStorage(STORAGE_KEYS.ROUTERS, routers);
    logActivity(userId, 'ROUTER_CREATED', { routerId: newRouter.id, name: newRouter.name });
    return { success: true, data: newRouter };
  },
  
  update: (userId: string, id: string, data: Partial<Router>) => {
    const routers = getStorage<Router[]>(STORAGE_KEYS.ROUTERS, []);
    const index = routers.findIndex(r => r.id === id && r.companyId === userId);
    if (index === -1) return { success: false, error: 'الراوتر غير موجود' };
    
    routers[index] = { ...routers[index], ...data, updatedAt: new Date().toISOString() };
    setStorage(STORAGE_KEYS.ROUTERS, routers);
    logActivity(userId, 'ROUTER_UPDATED', { routerId: id });
    return { success: true, data: routers[index] };
  },
  
  delete: (userId: string, id: string) => {
    const routers = getStorage<Router[]>(STORAGE_KEYS.ROUTERS, []);
    const filtered = routers.filter(r => !(r.id === id && r.companyId === userId));
    setStorage(STORAGE_KEYS.ROUTERS, filtered);
    logActivity(userId, 'ROUTER_DELETED', { routerId: id });
    return { success: true };
  }
};

// Vouchers API
export const vouchersApi = {
  getAll: (userId: string) => {
    const vouchers = getStorage<Voucher[]>(STORAGE_KEYS.VOUCHERS, []);
    return { success: true, data: vouchers.filter(v => v.companyId === userId) };
  },
  
  create: (userId: string, data: Partial<Voucher> & { quantity?: number }) => {
    const vouchers = getStorage<Voucher[]>(STORAGE_KEYS.VOUCHERS, []);
    const qty = data.quantity || 1;
    const createdVouchers: Voucher[] = [];
    
    for (let i = 0; i < qty; i++) {
      const code = qty > 1 ? `${data.code}-${String(i + 1).padStart(3, '0')}` : (data.code || generateId().toUpperCase());
      
      if (vouchers.find(v => v.code === code)) continue;
      
      const newVoucher: Voucher = {
        id: generateId(),
        code,
        duration: data.duration || 0,
        dataLimit: data.dataLimit || 0,
        speedLimit: data.speedLimit || '',
        price: data.price || 0,
        isUsed: false,
        usedBy: undefined,
        usedAt: undefined,
        companyId: userId,
        createdAt: new Date().toISOString(),
        expiresAt: data.duration ? new Date(Date.now() + (data.duration * 24 * 60 * 60 * 1000)).toISOString() : undefined
      };
      vouchers.push(newVoucher);
      createdVouchers.push(newVoucher);
    }
    
    setStorage(STORAGE_KEYS.VOUCHERS, vouchers);
    logActivity(userId, 'VOUCHERS_CREATED', { count: createdVouchers.length });
    return { success: true, data: createdVouchers.length === 1 ? createdVouchers[0] : createdVouchers };
  },
  
  use: (userId: string, id: string, usedBy?: string) => {
    const vouchers = getStorage<Voucher[]>(STORAGE_KEYS.VOUCHERS, []);
    const index = vouchers.findIndex(v => v.id === id && v.companyId === userId);
    if (index === -1) return { success: false, error: 'القسيمة غير موجودة' };
    if (vouchers[index].isUsed) return { success: false, error: 'القسيمة مستخدمة بالفعل' };
    
    vouchers[index].isUsed = true;
    vouchers[index].usedBy = usedBy || '';
    vouchers[index].usedAt = new Date().toISOString();
    setStorage(STORAGE_KEYS.VOUCHERS, vouchers);
    logActivity(userId, 'VOUCHER_USED', { voucherId: id, code: vouchers[index].code });
    return { success: true, data: vouchers[index] };
  },
  
  delete: (userId: string, id: string) => {
    const vouchers = getStorage<Voucher[]>(STORAGE_KEYS.VOUCHERS, []);
    const filtered = vouchers.filter(v => !(v.id === id && v.companyId === userId));
    setStorage(STORAGE_KEYS.VOUCHERS, filtered);
    logActivity(userId, 'VOUCHER_DELETED', { voucherId: id });
    return { success: true };
  }
};

// Backgrounds API
export const backgroundsApi = {
  getAll: (userId: string) => {
    const backgrounds = getStorage<Background[]>(STORAGE_KEYS.BACKGROUNDS, []);
    return { success: true, data: backgrounds.filter(b => b.companyId === userId) };
  },
  
  create: (userId: string, data: Partial<Background>) => {
    const backgrounds = getStorage<Background[]>(STORAGE_KEYS.BACKGROUNDS, []);
    const newBackground: Background = {
      id: generateId(),
      name: data.name || '',
      imageUrl: data.imageUrl || '',
      category: data.category || 'general',
      isDefault: data.isDefault || false,
      companyId: userId,
      createdAt: new Date().toISOString()
    };
    backgrounds.push(newBackground);
    setStorage(STORAGE_KEYS.BACKGROUNDS, backgrounds);
    return { success: true, data: newBackground };
  },
  
  update: (userId: string, id: string, data: Partial<Background>) => {
    const backgrounds = getStorage<Background[]>(STORAGE_KEYS.BACKGROUNDS, []);
    const index = backgrounds.findIndex(b => b.id === id && b.companyId === userId);
    if (index === -1) return { success: false, error: 'الخلفية غير موجودة' };
    
    backgrounds[index] = { ...backgrounds[index], ...data, updatedAt: new Date().toISOString() };
    setStorage(STORAGE_KEYS.BACKGROUNDS, backgrounds);
    return { success: true, data: backgrounds[index] };
  },
  
  delete: (userId: string, id: string) => {
    const backgrounds = getStorage<Background[]>(STORAGE_KEYS.BACKGROUNDS, []);
    const filtered = backgrounds.filter(b => !(b.id === id && b.companyId === userId));
    setStorage(STORAGE_KEYS.BACKGROUNDS, filtered);
    return { success: true };
  }
};

// Print Cards API
export const printCardsApi = {
  getAll: (userId: string) => {
    const cards = getStorage<PrintCard[]>(STORAGE_KEYS.PRINT_CARDS, []);
    return { success: true, data: cards.filter(c => c.companyId === userId) };
  },
  
  create: (userId: string, data: Partial<PrintCard>) => {
    const cards = getStorage<PrintCard[]>(STORAGE_KEYS.PRINT_CARDS, []);
    const newCard: PrintCard = {
      id: generateId(),
      title: data.title || '',
      template: data.template || 'modern',
      voucherCode: data.voucherCode || '',
      duration: data.duration || 0,
      dataLimit: data.dataLimit || 0,
      speedLimit: data.speedLimit || '',
      price: data.price || 0,
      logoUrl: data.logoUrl || '',
      primaryColor: data.primaryColor || '#3b82f6',
      secondaryColor: data.secondaryColor || '#8b5cf6',
      fontFamily: data.fontFamily || 'Tajawal',
      showLogo: data.showLogo !== undefined ? data.showLogo : true,
      showQR: data.showQR !== undefined ? data.showQR : true,
      notes: data.notes || '',
      printCount: 0,
      companyId: userId,
      createdAt: new Date().toISOString()
    };
    cards.push(newCard);
    setStorage(STORAGE_KEYS.PRINT_CARDS, cards);
    return { success: true, data: newCard };
  },
  
  print: (userId: string, id: string) => {
    const cards = getStorage<PrintCard[]>(STORAGE_KEYS.PRINT_CARDS, []);
    const index = cards.findIndex(c => c.id === id && c.companyId === userId);
    if (index === -1) return { success: false, error: 'الكرت غير موجود' };
    
    cards[index].printCount = (cards[index].printCount || 0) + 1;
    cards[index].lastPrintedAt = new Date().toISOString();
    setStorage(STORAGE_KEYS.PRINT_CARDS, cards);
    return { success: true, data: cards[index] };
  },
  
  delete: (userId: string, id: string) => {
    const cards = getStorage<PrintCard[]>(STORAGE_KEYS.PRINT_CARDS, []);
    const filtered = cards.filter(c => !(c.id === id && c.companyId === userId));
    setStorage(STORAGE_KEYS.PRINT_CARDS, filtered);
    return { success: true };
  }
};

// Hotspot Pages API
export const hotspotPagesApi = {
  getAll: (userId: string) => {
    const pages = getStorage<HotspotPage[]>(STORAGE_KEYS.HOTSPOT_PAGES, []);
    return { success: true, data: pages.filter(p => p.companyId === userId) };
  },
  
  getPublic: (id: string) => {
    const pages = getStorage<HotspotPage[]>(STORAGE_KEYS.HOTSPOT_PAGES, []);
    const page = pages.find(p => p.id === id && p.isActive);
    if (!page) return { success: false, error: 'الصفحة غير موجودة' };
    
    page.viewCount = (page.viewCount || 0) + 1;
    page.lastViewedAt = new Date().toISOString();
    setStorage(STORAGE_KEYS.HOTSPOT_PAGES, pages);
    return { success: true, data: page };
  },
  
  create: (userId: string, data: Partial<HotspotPage>) => {
    const pages = getStorage<HotspotPage[]>(STORAGE_KEYS.HOTSPOT_PAGES, []);
    const newPage: HotspotPage = {
      id: generateId(),
      name: data.name || '',
      title: data.title || '',
      subtitle: data.subtitle || '',
      backgroundImage: data.backgroundImage || '',
      backgroundColor: data.backgroundColor || '#0f172a',
      logoUrl: data.logoUrl || '',
      welcomeMessage: data.welcomeMessage || 'مرحباً بك في شبكتنا',
      instructions: data.instructions || 'أدخل كود القسيمة للاتصال',
      termsText: data.termsText || 'باستخدامك لهذه الخدمة، فإنك توافق على الشروط والأحكام',
      showTerms: data.showTerms !== undefined ? data.showTerms : true,
      showLogo: data.showLogo !== undefined ? data.showLogo : true,
      showVoucherInput: data.showVoucherInput !== undefined ? data.showVoucherInput : true,
      showPhoneInput: data.showPhoneInput !== undefined ? data.showPhoneInput : false,
      primaryColor: data.primaryColor || '#3b82f6',
      secondaryColor: data.secondaryColor || '#8b5cf6',
      fontFamily: data.fontFamily || 'Tajawal',
      buttonText: data.buttonText || 'اتصل الآن',
      footerText: data.footerText || '',
      isActive: data.isActive !== undefined ? data.isActive : true,
      viewCount: 0,
      companyId: userId,
      createdAt: new Date().toISOString()
    };
    pages.push(newPage);
    setStorage(STORAGE_KEYS.HOTSPOT_PAGES, pages);
    return { success: true, data: newPage };
  },
  
  update: (userId: string, id: string, data: Partial<HotspotPage>) => {
    const pages = getStorage<HotspotPage[]>(STORAGE_KEYS.HOTSPOT_PAGES, []);
    const index = pages.findIndex(p => p.id === id && p.companyId === userId);
    if (index === -1) return { success: false, error: 'الصفحة غير موجودة' };
    
    pages[index] = { ...pages[index], ...data, updatedAt: new Date().toISOString() };
    setStorage(STORAGE_KEYS.HOTSPOT_PAGES, pages);
    return { success: true, data: pages[index] };
  },
  
  delete: (userId: string, id: string) => {
    const pages = getStorage<HotspotPage[]>(STORAGE_KEYS.HOTSPOT_PAGES, []);
    const filtered = pages.filter(p => !(p.id === id && p.companyId === userId));
    setStorage(STORAGE_KEYS.HOTSPOT_PAGES, filtered);
    return { success: true };
  }
};

// Fingerprint Devices API
export const fingerprintApi = {
  getAll: (userId: string) => {
    const devices = getStorage<FingerprintDevice[]>(STORAGE_KEYS.FINGERPRINT_DEVICES, []);
    return { success: true, data: devices.filter(d => d.companyId === userId) };
  },
  
  create: (userId: string, data: Partial<FingerprintDevice>) => {
    const devices = getStorage<FingerprintDevice[]>(STORAGE_KEYS.FINGERPRINT_DEVICES, []);
    const newDevice: FingerprintDevice = {
      id: generateId(),
      name: data.name || '',
      ipAddress: data.ipAddress || '',
      port: data.port || 4370,
      status: data.status || 'offline',
      model: data.model || '',
      serialNumber: data.serialNumber || '',
      location: data.location || '',
      totalUsers: 0,
      lastSync: undefined,
      companyId: userId,
      createdAt: new Date().toISOString()
    };
    devices.push(newDevice);
    setStorage(STORAGE_KEYS.FINGERPRINT_DEVICES, devices);
    return { success: true, data: newDevice };
  },
  
  update: (userId: string, id: string, data: Partial<FingerprintDevice>) => {
    const devices = getStorage<FingerprintDevice[]>(STORAGE_KEYS.FINGERPRINT_DEVICES, []);
    const index = devices.findIndex(d => d.id === id && d.companyId === userId);
    if (index === -1) return { success: false, error: 'الجهاز غير موجود' };
    
    devices[index] = { ...devices[index], ...data, updatedAt: new Date().toISOString() };
    setStorage(STORAGE_KEYS.FINGERPRINT_DEVICES, devices);
    return { success: true, data: devices[index] };
  },
  
  delete: (userId: string, id: string) => {
    const devices = getStorage<FingerprintDevice[]>(STORAGE_KEYS.FINGERPRINT_DEVICES, []);
    const filtered = devices.filter(d => !(d.id === id && d.companyId === userId));
    setStorage(STORAGE_KEYS.FINGERPRINT_DEVICES, filtered);
    return { success: true };
  }
};

// DVR Cameras API
export const dvrApi = {
  getAll: (userId: string) => {
    const cameras = getStorage<DVRCamera[]>(STORAGE_KEYS.DVR_CAMERAS, []);
    return { success: true, data: cameras.filter(c => c.companyId === userId) };
  },
  
  create: (userId: string, data: Partial<DVRCamera>) => {
    const cameras = getStorage<DVRCamera[]>(STORAGE_KEYS.DVR_CAMERAS, []);
    const newCamera: DVRCamera = {
      id: generateId(),
      name: data.name || '',
      ipAddress: data.ipAddress || '',
      port: data.port || 80,
      status: data.status || 'offline',
      model: data.model || '',
      channel: data.channel || 1,
      username: data.username || 'admin',
      password: data.password || '',
      location: data.location || '',
      streamUrl: data.streamUrl || '',
      companyId: userId,
      createdAt: new Date().toISOString()
    };
    cameras.push(newCamera);
    setStorage(STORAGE_KEYS.DVR_CAMERAS, cameras);
    return { success: true, data: newCamera };
  },
  
  update: (userId: string, id: string, data: Partial<DVRCamera>) => {
    const cameras = getStorage<DVRCamera[]>(STORAGE_KEYS.DVR_CAMERAS, []);
    const index = cameras.findIndex(c => c.id === id && c.companyId === userId);
    if (index === -1) return { success: false, error: 'الكاميرا غير موجودة' };
    
    cameras[index] = { ...cameras[index], ...data, updatedAt: new Date().toISOString() };
    setStorage(STORAGE_KEYS.DVR_CAMERAS, cameras);
    return { success: true, data: cameras[index] };
  },
  
  delete: (userId: string, id: string) => {
    const cameras = getStorage<DVRCamera[]>(STORAGE_KEYS.DVR_CAMERAS, []);
    const filtered = cameras.filter(c => !(c.id === id && c.companyId === userId));
    setStorage(STORAGE_KEYS.DVR_CAMERAS, filtered);
    return { success: true };
  }
};

// Activity API
export const activityApi = {
  getAll: (userId: string) => {
    const logs = getStorage<ActivityLog[]>(STORAGE_KEYS.ACTIVITY_LOGS, []);
    return { success: true, data: logs.filter(l => l.userId === userId).slice(0, 50) };
  }
};

// Clear all data (for testing)
export const clearAllData = () => {
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  initAdmin();
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
  clearAllData
};
