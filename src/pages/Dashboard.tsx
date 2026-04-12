import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardApi } from '@/services/api';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Router, Ticket, DollarSign, Wifi, 
  Image, CreditCard, Globe, Activity, ArrowUpRight, 
  ArrowDownRight, Bell, Settings, RefreshCw, Fingerprint, Camera,
  Clock, CheckCircle2
} from 'lucide-react';
import type { DashboardStats } from '@/types';

function AnimatedCounter({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    const duration = 800;
    const steps = 25;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) { setDisplayValue(value); clearInterval(timer); }
      else setDisplayValue(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{prefix}{displayValue.toLocaleString()}{suffix}</span>;
}

function StatCard({ title, value, icon: Icon, color, trend, trendValue, subtitle, prefix = '', onClick }: any) {
  const colorMap: Record<string, { bg: string; light: string }> = {
    blue:   { bg: 'from-blue-500 to-blue-600',   light: 'bg-blue-50 text-blue-600' },
    green:  { bg: 'from-green-500 to-green-600',  light: 'bg-green-50 text-green-600' },
    purple: { bg: 'from-purple-500 to-purple-600', light: 'bg-purple-50 text-purple-600' },
    yellow: { bg: 'from-yellow-500 to-orange-500', light: 'bg-yellow-50 text-yellow-600' },
    pink:   { bg: 'from-pink-500 to-rose-500',    light: 'bg-pink-50 text-pink-600' },
    cyan:   { bg: 'from-cyan-500 to-blue-500',    light: 'bg-cyan-50 text-cyan-600' },
    indigo: { bg: 'from-indigo-500 to-purple-500', light: 'bg-indigo-50 text-indigo-600' },
    orange: { bg: 'from-orange-500 to-red-500',   light: 'bg-orange-50 text-orange-600' },
    teal:   { bg: 'from-teal-500 to-cyan-500',    light: 'bg-teal-50 text-teal-600' },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 mb-1 truncate">{title}</p>
            <h3 className="text-2xl font-bold">
              <AnimatedCounter value={value} prefix={prefix} />
            </h3>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>}
            {trend && (
              <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
                {trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {trendValue}
              </div>
            )}
          </div>
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.bg} flex items-center justify-center shadow-md shrink-0 mr-3`}>
            <Icon className="w-5.5 h-5.5 text-white" />
          </div>
        </div>
        <Progress value={Math.min((value / Math.max(value, 10)) * 100, 100)} className="h-1 mt-3" />
      </CardContent>
    </Card>
  );
}

function QuickAction({ icon: Icon, label, onClick, colorClass }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-transparent 
        bg-white dark:bg-gray-800 hover:border-blue-200 hover:bg-blue-50 dark:hover:bg-gray-700
        transition-all text-center shadow-sm hover:shadow-md group`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass} group-hover:scale-110 transition-transform`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{label}</span>
    </button>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const result = await dashboardApi.getStats();
    if (result.success && result.data) {
      setStats(result.data);
      setLastUpdated(new Date());
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, navigate, fetchData]);

  if (!isAuthenticated) return null;

  const quickActions = [
    { icon: Router,      label: 'راوتر جديد',     path: '/routers',     colorClass: 'bg-blue-100 text-blue-600' },
    { icon: Ticket,      label: 'قسيمة جديدة',    path: '/vouchers',    colorClass: 'bg-green-100 text-green-600' },
    { icon: Fingerprint, label: 'جهاز بصمة',      path: '/fingerprint', colorClass: 'bg-teal-100 text-teal-600' },
    { icon: Camera,      label: 'كاميرا DVR',     path: '/dvr',         colorClass: 'bg-orange-100 text-orange-600' },
    { icon: Image,       label: 'خلفية جديدة',    path: '/backgrounds', colorClass: 'bg-purple-100 text-purple-600' },
    { icon: Globe,       label: 'صفحة هوت سبوت',  path: '/hotspot-pages', colorClass: 'bg-cyan-100 text-cyan-600' },
  ];

  const headerActions = (
    <div className="flex items-center gap-2">
      {lastUpdated && (
        <span className="hidden md:flex items-center gap-1.5 text-xs text-gray-400">
          <Clock className="w-3.5 h-3.5" />
          {lastUpdated.toLocaleTimeString('ar-EG')}
        </span>
      )}
      <Button variant="outline" size="icon" onClick={fetchData} disabled={loading} title="تحديث">
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      </Button>
      <Button variant="outline" size="icon" onClick={() => navigate('/settings')} title="الإعدادات">
        <Settings className="w-4 h-4" />
      </Button>
      <Button variant="outline" size="icon" className="relative" title="الإشعارات">
        <Bell className="w-4 h-4" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">3</span>
      </Button>
    </div>
  );

  return (
    <Layout title="لوحة التحكم" actions={headerActions}>
      <div className="space-y-6">
        {/* Welcome */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">مرحباً، {user?.name} 👋</h1>
            <p className="text-gray-500 text-sm mt-0.5">إليك نظرة عامة على نشاطك اليوم</p>
          </div>
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            النظام يعمل بكفاءة
          </span>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 mb-3">إجراءات سريعة</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {quickActions.map(a => (
              <QuickAction key={a.path} icon={a.icon} label={a.label} onClick={() => navigate(a.path)} colorClass={a.colorClass} />
            ))}
          </div>
        </div>

        {/* Main Stats */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 mb-3">الأجهزة والشبكة</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="الراوترات" value={stats?.totalRouters || 0} icon={Router} color="blue" trend="up" trendValue="+12%" subtitle={`${stats?.activeRouters || 0} نشط`} onClick={() => navigate('/routers')} />
            <StatCard title="القسائم" value={stats?.totalVouchers || 0} icon={Ticket} color="purple" trend="up" trendValue="+8%" subtitle={`${stats?.usedVouchers || 0} مستخدمة`} onClick={() => navigate('/vouchers')} />
            <StatCard title="أجهزة البصمة" value={stats?.totalFingerprintDevices || 0} icon={Fingerprint} color="teal" subtitle={`${stats?.activeFingerprintDevices || 0} نشط`} onClick={() => navigate('/fingerprint')} />
            <StatCard title="كاميرات DVR" value={stats?.totalDVRCameras || 0} icon={Camera} color="orange" subtitle={`${stats?.activeDVRCameras || 0} متصلة`} onClick={() => navigate('/dvr')} />
          </div>
        </div>

        {/* Revenue & Content */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="الإيرادات" value={Math.floor(stats?.revenue || 0)} icon={DollarSign} color="green" prefix="$" trend="up" trendValue="+23%" subtitle="إجمالي المبيعات" />
          <StatCard title="صفحات الهوت سبوت" value={stats?.totalHotspotPages || 0} icon={Globe} color="cyan" subtitle={`${stats?.activeHotspotPages || 0} نشطة`} onClick={() => navigate('/hotspot-pages')} />
          <StatCard title="الخلفيات" value={stats?.totalBackgrounds || 0} icon={Image} color="pink" onClick={() => navigate('/backgrounds')} />
          <StatCard title="كروت الطباعة" value={stats?.totalPrintCards || 0} icon={CreditCard} color="indigo" onClick={() => navigate('/print-cards')} />
        </div>

        {/* Recent Activity */}
        {stats?.recentActivity && stats.recentActivity.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 dark:text-gray-100">آخر النشاطات</h3>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5" /> تحديث تلقائي كل 30 ث
                </span>
              </div>
              <div className="space-y-2">
                {stats.recentActivity.slice(0, 8).map((log: any) => (
                  <div key={log.id} className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                      <Activity className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{log.action}</p>
                      <p className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString('ar-EG')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
