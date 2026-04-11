import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Router, Ticket, DollarSign, LogOut, Plus, Wifi, 
  Image, CreditCard, Globe, Users, Activity, ArrowUpRight, 
  ArrowDownRight, Bell, Settings, Menu, Fingerprint, Camera
} from 'lucide-react';
import { toast } from 'sonner';
import type { DashboardStats } from '@/types';

// Animated Counter
function AnimatedCounter({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return <span>{prefix}{displayValue.toLocaleString()}{suffix}</span>;
}

// Stat Card
function StatCard({ title, value, icon: Icon, color, trend, trendValue, subtitle, onClick }: any) {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    yellow: 'from-yellow-500 to-orange-500',
    pink: 'from-pink-500 to-rose-500',
    cyan: 'from-cyan-500 to-blue-500',
    indigo: 'from-indigo-500 to-purple-500',
    orange: 'from-orange-500 to-red-500',
    teal: 'from-teal-500 to-cyan-500',
  };

  return (
    <Card className="card-hover overflow-hidden cursor-pointer" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <h3 className="text-3xl font-bold"><AnimatedCounter value={value} /></h3>
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
            {trend && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}>
            <Icon className="w-7 h-7 text-white" />
          </div>
        </div>
        <div className="mt-4"><Progress value={Math.min((value / 100) * 100, 100)} className="h-1" /></div>
      </CardContent>
    </Card>
  );
}

// Quick Action
function QuickAction({ icon: Icon, label, onClick, color }: any) {
  const colorClasses: Record<string, string> = {
    blue: 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200',
    green: 'hover:bg-green-50 hover:text-green-600 hover:border-green-200',
    purple: 'hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200',
    orange: 'hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200',
    teal: 'hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200',
  };

  return (
    <Button variant="outline" className={`flex flex-col items-center gap-2 h-auto py-4 px-6 transition-all ${colorClasses[color]}`} onClick={onClick}>
      <div className={`w-10 h-10 rounded-xl bg-${color}-100 flex items-center justify-center`}>
        <Icon className={`w-5 h-5 text-${color}-600`} />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </Button>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [isAuthenticated, navigate]);

  const fetchData = async () => {
    if (!user) return;
    const result = await dashboardApi.getStats();
    if (result.success && result.data) {
      setStats(result.data);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('تم تسجيل الخروج بنجاح');
  };

  if (!isAuthenticated) return null;

  const navItems = [
    { icon: Activity, label: 'لوحة التحكم', path: '/dashboard', active: true },
    { icon: Router, label: 'الراوترات', path: '/routers' },
    { icon: Ticket, label: 'القسائم', path: '/vouchers' },
    { icon: Fingerprint, label: 'أجهزة البصمة', path: '/fingerprint' },
    { icon: Camera, label: 'كاميرات DVR', path: '/dvr' },
    { icon: Image, label: 'الخلفيات', path: '/backgrounds' },
    { icon: CreditCard, label: 'كروت الطباعة', path: '/print-cards' },
    { icon: Globe, label: 'صفحات الهوت سبوت', path: '/hotspot-pages' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0 lg:static`}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Wifi className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold gradient-text">سيرا للبرمجيات</h1>
                <p className="text-xs text-gray-500">Sira Software Pro</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  item.active 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-5 h-5 text-gray-400" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <Menu className="w-6 h-6" />
              </Button>
              <h2 className="text-xl font-bold">لوحة التحكم</h2>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
              </Button>
              <Button variant="outline" size="icon"><Settings className="w-5 h-5" /></Button>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">مرحباً، {user?.name} 👋</h1>
              <p className="text-gray-500 mt-1">إليك نظرة عامة على نشاطك اليوم</p>
            </div>
            <span className="px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-medium flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />النظام يعمل بكفاءة
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <QuickAction icon={Plus} label="راوتر جديد" onClick={() => navigate('/routers')} color="blue" />
            <QuickAction icon={Ticket} label="قسيمة جديدة" onClick={() => navigate('/vouchers')} color="green" />
            <QuickAction icon={Fingerprint} label="جهاز بصمة" onClick={() => navigate('/fingerprint')} color="teal" />
            <QuickAction icon={Camera} label="كاميرا DVR" onClick={() => navigate('/dvr')} color="orange" />
            <QuickAction icon={Image} label="خلفية جديدة" onClick={() => navigate('/backgrounds')} color="purple" />
            <QuickAction icon={CreditCard} label="كرت طباعة" onClick={() => navigate('/print-cards')} color="orange" />
          </div>

          {/* Network Devices Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="إجمالي الراوترات" value={stats?.totalRouters || 0} icon={Router} color="blue" trend="up" trendValue="+12%" subtitle={`${stats?.activeRouters || 0} نشط`} />
            <StatCard title="إجمالي القسائم" value={stats?.totalVouchers || 0} icon={Ticket} color="purple" trend="up" trendValue="+8%" subtitle={`${stats?.usedVouchers || 0} مستخدمة`} />
            <StatCard title="أجهزة البصمة" value={stats?.totalFingerprintDevices || 0} icon={Fingerprint} color="teal" trend="up" trendValue="+5%" subtitle={`${stats?.activeFingerprintDevices || 0} نشط`} />
            <StatCard title="كاميرات DVR" value={stats?.totalDVRCameras || 0} icon={Camera} color="orange" trend="up" trendValue="+3%" subtitle={`${stats?.activeDVRCameras || 0} متصلة`} />
          </div>

          {/* Revenue & Other Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="الإيرادات" value={Math.floor(stats?.revenue || 0)} icon={DollarSign} color="green" prefix="$" trend="up" trendValue="+23%" subtitle="إجمالي المبيعات" />
            <StatCard title="صفحات الهوت سبوت" value={stats?.totalHotspotPages || 0} icon={Globe} color="cyan" subtitle={`${stats?.activeHotspotPages || 0} صفحة نشطة`} />
            <StatCard title="الخلفيات" value={stats?.totalBackgrounds || 0} icon={Image} color="pink" />
            <StatCard title="كروت الطباعة" value={stats?.totalPrintCards || 0} icon={CreditCard} color="indigo" />
          </div>

          {/* Recent Activity */}
          {stats?.recentActivity && stats.recentActivity.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">آخر النشاطات</h3>
                <div className="space-y-3">
                  {stats.recentActivity.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{log.action}</p>
                        <p className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString('ar-EG')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
