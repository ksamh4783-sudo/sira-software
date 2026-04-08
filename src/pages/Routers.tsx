import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { routersApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Router, Plus, Search, Edit2, Trash2, Power, 
  MapPin, Wifi, ArrowRight, Menu, Settings, Activity,
  Zap, LayoutTemplate, Users, ShieldCheck, Terminal
} from 'lucide-react';
import { toast } from 'sonner';
import type { Router as RouterType } from '@/types';

export default function Routers() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [routers, setRouters] = useState<RouterType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRouter, setEditingRouter] = useState<RouterType | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // حالات نافذة الاتصال المباشر والبيانات الحية
  const [quickConnectRouter, setQuickConnectRouter] = useState<RouterType | null>(null);
  const [liveStats, setLiveStats] = useState({ hotspot: 0, pppoe: 0, cpu: '0%' });
  const [isConnecting, setIsConnecting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    ipAddress: '',
    macAddress: '',
    username: 'admin',
    password: '',
    port: 8728,
    location: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchRouters();
  }, [isAuthenticated, navigate]);

  const fetchRouters = async () => {
    if (!user) return;
    const result = await routersApi.getAll();
    if (result.success && result.data) {
      setRouters(result.data);
    }
  };

  // دالة جلب البيانات الحقيقية من الراوتر
  const fetchLiveStats = async (router: RouterType) => {
    setIsConnecting(true);
    // تصفير العدادات قبل الجلب
    setLiveStats({ hotspot: 0, pppoe: 0, cpu: '0%' }); 
    
    try {
      // يجب أن تتأكد من أن هذا الرابط يطابق الـ API الخاص بالباك إند عندك
      const response = await fetch('/api/routers/live-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ipAddress: router.ipAddress,
          port: router.port,
          username: router.username,
          password: router.password || ''
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setLiveStats({
          hotspot: result.data.hotspotActiveCount,
          pppoe: result.data.pppoeActiveCount,
          cpu: result.data.cpuLoad
        });
      } else {
        toast.error(result.error || 'فشل الاتصال بالراوتر');
      }
    } catch (error) {
      toast.error('حدث خطأ في الاتصال بسيرفر سيرا');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (editingRouter) {
      const result = await routersApi.update(editingRouter.id, formData);
      if (result.success) {
        toast.success('تم تحديث الراوتر بنجاح');
        fetchRouters();
        setIsAddDialogOpen(false);
        setEditingRouter(null);
      } else {
        toast.error(result.error || 'حدث خطأ');
      }
    } else {
      const result = await routersApi.create(formData);
      if (result.success) {
        toast.success('تم إضافة الراوتر بنجاح');
        fetchRouters();
        setIsAddDialogOpen(false);
        resetForm();
      } else {
        toast.error(result.error || 'حدث خطأ');
      }
    }
  };

  const handleDelete = async (router: RouterType) => {
    if (!user) return;
    if (confirm('هل أنت متأكد من حذف هذا الراوتر؟')) {
      const result = await routersApi.delete(router.id);
      if (result.success) {
        toast.success('تم حذف الراوتر بنجاح');
        fetchRouters();
      } else {
        toast.error(result.error || 'حدث خطأ');
      }
    }
  };

  const handleEdit = (router: RouterType) => {
    setEditingRouter(router);
    setFormData({
      name: router.name,
      ipAddress: router.ipAddress,
      macAddress: router.macAddress || '',
      username: router.username || 'admin',
      password: '', 
      port: router.port || 8728,
      location: router.location || ''
    });
    setIsAddDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      ipAddress: '',
      macAddress: '',
      username: 'admin',
      password: '',
      port: 8728,
      location: ''
    });
  };

  const filteredRouters = routers.filter(router =>
    router.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    router.ipAddress.includes(searchQuery) ||
    router.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navItems = [
    { icon: ArrowRight, label: 'العودة للوحة التحكم', path: '/dashboard' },
    { icon: Router, label: 'الراوترات', path: '/routers', active: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0 lg:static`}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                <Router className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold gradient-text">الراوترات</h1>
                <p className="text-xs text-gray-500">إدارة أجهزة MikroTik</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  item.active 
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
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
              <h2 className="text-xl font-bold">الراوترات</h2>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setEditingRouter(null); }}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة راوتر
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingRouter ? 'تعديل راوتر' : 'إضافة راوتر MikroTik جديد'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div>
                    <Label>اسم الراوتر</Label>
                    <Input 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="مثال: راوتر المكتب الرئيسي"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>عنوان IP</Label>
                      <Input 
                        value={formData.ipAddress} 
                        onChange={(e) => setFormData({...formData, ipAddress: e.target.value})}
                        placeholder="192.168.88.1"
                        required
                      />
                    </div>
                    <div>
                      <Label>المنفذ (API)</Label>
                      <Input 
                        type="number"
                        value={formData.port} 
                        onChange={(e) => setFormData({...formData, port: parseInt(e.target.value)})}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label>عنوان MAC (اختياري)</Label>
                    <Input 
                      value={formData.macAddress} 
                      onChange={(e) => setFormData({...formData, macAddress: e.target.value})}
                      placeholder="00:11:22:33:44:55"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>اسم المستخدم</Label>
                      <Input 
                        value={formData.username} 
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label>كلمة المرور</Label>
                      <Input 
                        type="password"
                        value={formData.password} 
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder={editingRouter ? "اتركه فارغاً للاحتفاظ بالقديم" : ""}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>الموقع</Label>
                    <Input 
                      value={formData.location} 
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="مثال: المكتب الرئيسي"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    {editingRouter ? 'تحديث' : 'إضافة'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Router className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">إجمالي الراوترات</p>
                  <p className="text-2xl font-bold">{routers.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Power className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">الراوترات النشطة</p>
                  <p className="text-2xl font-bold">{routers.filter(r => r.status === 'online').length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                  <Settings className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">تحت الصيانة</p>
                  <p className="text-2xl font-bold">{routers.filter(r => r.status === 'maintenance').length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">معدل الاتصال</p>
                  <p className="text-2xl font-bold">
                    {routers.length > 0 ? Math.round((routers.filter(r => r.status === 'online').length / routers.length) * 100) : 0}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input 
              placeholder="البحث في الراوترات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>

          {/* Routers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRouters.map((router) => (
              <Card 
                key={router.id} 
                className="relative overflow-hidden group hover:shadow-2xl transition-all duration-500 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl"
              >
                <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:scale-150 group-hover:opacity-40 transition-all duration-700 ${
                  router.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>

                <CardHeader className="pb-3 relative z-10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
                          router.status === 'online' ? 'bg-gradient-to-br from-green-400 to-emerald-600' : 
                          router.status === 'maintenance' ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 
                          'bg-gradient-to-br from-red-400 to-rose-600'
                        }`}>
                          <Router className="w-6 h-6 text-white" />
                        </div>
                        {router.status === 'online' && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></span>
                        )}
                        {router.status === 'online' && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-800 dark:text-white">
                          {router.name}
                        </CardTitle>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="outline" className={`text-xs border-0 px-2 py-0.5 rounded-full ${
                            router.status === 'online' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                            'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {router.status === 'online' ? 'متصل ومستقر' : 'غير متصل'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 rounded-full" onClick={() => handleEdit(router)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 rounded-full" onClick={() => handleDelete(router)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-2 relative z-10">
                  <div className="space-y-3 text-sm mb-5 p-3 bg-gray-50/50 dark:bg-gray-900/50 rounded-xl">
                    <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <Power className="w-4 h-4 text-blue-500" />
                        <span>IP السيرفر:</span>
                      </div>
                      <span className="font-mono font-medium">{router.ipAddress}:{router.port}</span>
                    </div>
                    
                    {router.location && (
                      <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-purple-500" />
                          <span>الموقع:</span>
                        </div>
                        <span className="font-medium">{router.location}</span>
                      </div>
                    )}
                  </div>

                  {/* أزرار الإجراءات السريعة */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <Button 
                      onClick={() => {
                        setQuickConnectRouter(router);
                        fetchLiveStats(router); // استدعاء البيانات الحية
                      }}
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/30 border-0 group/btn"
                    >
                      <Zap className="w-4 h-4 ml-2 group-hover/btn:scale-110 transition-transform text-yellow-300" />
                      اتصال بلمسة
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full border-2 border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 group/hotspot"
                      onClick={() => navigate(`/hotspot-themes/${router.id}`)}
                    >
                      <LayoutTemplate className="w-4 h-4 ml-2 group-hover/hotspot:rotate-12 transition-transform" />
                      صفحات الهوت سبوت
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRouters.length === 0 && (
            <div className="text-center py-12">
              <Router className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-500">لا توجد راوترات</h3>
              <p className="text-gray-400">قم بإضافة راوتر MikroTik جديد</p>
            </div>
          )}
        </div>

        {/* نافذة الاتصال بلمسة المباشرة */}
        <Dialog open={!!quickConnectRouter} onOpenChange={() => setQuickConnectRouter(null)}>
          <DialogContent className="max-w-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-blue-200 dark:border-blue-900">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                  <Terminal className="w-6 h-6" />
                </div>
                إدارة مباشرة: {quickConnectRouter?.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <button className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 rounded-2xl hover:shadow-md transition-all border border-orange-200 dark:border-orange-900/50 text-orange-700 dark:text-orange-400">
                <Users className="w-8 h-8 mb-2" />
                <span className="font-bold text-lg">{isConnecting ? '...' : liveStats.hotspot}</span>
                <span className="text-xs opacity-80">عملاء الهوت سبوت</span>
              </button>

              <button className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 rounded-2xl hover:shadow-md transition-all border border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-400">
                <Wifi className="w-8 h-8 mb-2" />
                <span className="font-bold text-lg">{isConnecting ? '...' : liveStats.pppoe}</span>
                <span className="text-xs opacity-80">عملاء الـ PPPoE</span>
              </button>

              <button className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 rounded-2xl hover:shadow-md transition-all border border-purple-200 dark:border-purple-900/50 text-purple-700 dark:text-purple-400">
                <ShieldCheck className="w-8 h-8 mb-2" />
                <span className="font-bold text-lg text-sm">{isConnecting ? '...' : `CPU: ${liveStats.cpu}`}</span>
                <span className="text-xs opacity-80">استهلاك المعالج</span>
              </button>

              <button className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 rounded-2xl hover:shadow-md transition-all border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400">
                <Power className="w-8 h-8 mb-2" />
                <span className="font-bold text-lg">Reboot</span>
                <span className="text-xs opacity-80">إعادة تشغيل</span>
              </button>
            </div>

            <div className="mt-6 p-4 bg-gray-900 rounded-xl text-green-400 font-mono text-sm overflow-hidden relative shadow-inner">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50 animate-pulse"></div>
              <p>{'>'} Connecting to API ({quickConnectRouter?.ipAddress}:{quickConnectRouter?.port})...</p>
              {isConnecting ? (
                <p className="animate-pulse">{'>'} Fetching data from MikroTik...</p>
              ) : (
                <>
                  <p>{'>'} Authentication successful.</p>
                  <p className="animate-pulse">{'>'} Waiting for command_</p>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
