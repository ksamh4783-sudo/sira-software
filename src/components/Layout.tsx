import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Activity, Router, Ticket, Fingerprint, Camera,
  Image, CreditCard, Globe, Users, LogOut, Wifi,
  Menu, X, Settings, ChevronLeft
} from 'lucide-react';

const navItems = [
  { icon: Activity, label: 'لوحة التحكم', path: '/dashboard' },
  { icon: Router, label: 'الراوترات', path: '/routers' },
  { icon: Ticket, label: 'القسائم', path: '/vouchers' },
  { icon: Fingerprint, label: 'أجهزة البصمة', path: '/fingerprint' },
  { icon: Camera, label: 'كاميرات DVR', path: '/dvr' },
  { icon: Image, label: 'الخلفيات', path: '/backgrounds' },
  { icon: CreditCard, label: 'كروت الطباعة', path: '/print-cards' },
  { icon: Globe, label: 'صفحات الهوت سبوت', path: '/hotspot-pages' },
  { icon: Settings, label: 'الإعدادات', path: '/settings' },
];

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
}

export default function Layout({ children, title, actions }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex" dir="rtl">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 right-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl
          transition-transform duration-300 flex flex-col
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
          lg:translate-x-0 lg:static lg:shadow-none lg:border-l border-gray-200 dark:border-gray-700
        `}
      >
        {/* Logo */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow">
              <Wifi className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold gradient-text leading-tight">سيرا للبرمجيات</h1>
              <p className="text-xs text-gray-400">Sira Software Pro</p>
            </div>
          </div>
          <button className="lg:hidden text-gray-400 hover:text-gray-600" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium
                  ${isActive
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
                  }`}
              >
                <item.icon className="w-4.5 h-4.5 shrink-0" />
                <span>{item.label}</span>
                {isActive && <ChevronLeft className="w-4 h-4 mr-auto opacity-70" />}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || 'المشرف'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
            <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0" onClick={handleLogout} title="تسجيل الخروج">
              <LogOut className="w-4 h-4 text-gray-400" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              {title && (
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{title}</h2>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2">{actions}</div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
