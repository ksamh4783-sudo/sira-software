import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { routersApi } from '@/services/localApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Router, Plus, Search, Edit2, Trash2, Power, 
  MapPin, Wifi, ArrowRight, Menu, Settings, Activity
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

  const fetchRouters = () => {
    if (!user) return;
    const result = routersApi.getAll(user.id);
    if (result.success && result.data) {
      setRouters(result.data);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (editingRouter) {
      const result = routersApi.update(user.id, editingRouter.id, formData);
      if (result.success) {
        toast.success('تم تحديث الراوتر بنجاح');
        fetchRouters();
        setIsAddDialogOpen(false);
        setEditingRouter(null);
      }
    } else {
      const result = routersApi.create(user.id, formData);
      if (result.success) {
        toast.success('تم إضافة الراوتر بنجاح');
        fetchRouters();
        setIsAddDialogOpen(false);
        resetForm();
      }
    }
  };

  const handleDelete = (router: RouterType) => {
    if (!user) return;
    if (confirm('هل أنت متأكد من حذف هذا الراوتر؟')) {
      const result = routersApi.delete(user.id, router.id);
      if (result.success) {
        toast.success('تم حذف الراوتر بنجاح');
        fetchRouters();
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
      password: router.password || '',
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRouters.map((router) => (
              <Card key={router.id} className="card-hover">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        router.status === 'online' ? 'bg-green-100' : 
                        router.status === 'maintenance' ? 'bg-yellow-100' : 'bg-red-100'
                      }`}>
                        <Router className={`w-5 h-5 ${
                          router.status === 'online' ? 'text-green-600' : 
                          router.status === 'maintenance' ? 'text-yellow-600' : 'text-red-600'
                        }`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{router.name}</CardTitle>
                        <Badge variant={router.status === 'online' ? 'default' : 'secondary'} className="text-xs">
                          {router.status === 'online' ? 'متصل' : router.status === 'maintenance' ? 'صيانة' : 'غير متصل'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(router)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(router)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Power className="w-4 h-4" />
                      <span>{router.ipAddress}:{router.port}</span>
                    </div>
                    {router.macAddress && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Wifi className="w-4 h-4" />
                        <span>{router.macAddress}</span>
                      </div>
                    )}
                    {router.location && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{router.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Activity className="w-4 h-4" />
                      <span>آخر اتصال: {router.lastSeen ? new Date(router.lastSeen).toLocaleDateString('ar-EG') : 'غير معروف'}</span>
                    </div>
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
      </main>
    </div>
  );
}
