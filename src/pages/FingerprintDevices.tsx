import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { fingerprintApi } from '@/services/localApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Fingerprint, Plus, Search, Edit2, Trash2, Power, 
  MapPin, Users, RefreshCw, ArrowRight, Menu
} from 'lucide-react';
import { toast } from 'sonner';
import type { FingerprintDevice } from '@/types';

export default function FingerprintDevices() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [devices, setDevices] = useState<FingerprintDevice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<FingerprintDevice | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    ipAddress: '',
    port: 4370,
    model: '',
    serialNumber: '',
    location: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchDevices();
  }, [isAuthenticated, navigate]);

  const fetchDevices = () => {
    if (!user) return;
    const result = fingerprintApi.getAll(user.id);
    if (result.success && result.data) {
      setDevices(result.data);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (editingDevice) {
      const result = fingerprintApi.update(user.id, editingDevice.id, formData);
      if (result.success) {
        toast.success('تم تحديث الجهاز بنجاح');
        fetchDevices();
        setIsAddDialogOpen(false);
        setEditingDevice(null);
      }
    } else {
      const result = fingerprintApi.create(user.id, formData);
      if (result.success) {
        toast.success('تم إضافة الجهاز بنجاح');
        fetchDevices();
        setIsAddDialogOpen(false);
        resetForm();
      }
    }
  };

  const handleDelete = (device: FingerprintDevice) => {
    if (!user) return;
    if (confirm('هل أنت متأكد من حذف هذا الجهاز؟')) {
      const result = fingerprintApi.delete(user.id, device.id);
      if (result.success) {
        toast.success('تم حذف الجهاز بنجاح');
        fetchDevices();
      }
    }
  };

  const handleEdit = (device: FingerprintDevice) => {
    setEditingDevice(device);
    setFormData({
      name: device.name,
      ipAddress: device.ipAddress,
      port: device.port,
      model: device.model,
      serialNumber: device.serialNumber || '',
      location: device.location || ''
    });
    setIsAddDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      ipAddress: '',
      port: 4370,
      model: '',
      serialNumber: '',
      location: ''
    });
  };

  const filteredDevices = devices.filter(device =>
    device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.ipAddress.includes(searchQuery) ||
    device.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navItems = [
    { icon: ArrowRight, label: 'العودة للوحة التحكم', path: '/dashboard' },
    { icon: Fingerprint, label: 'أجهزة البصمة', path: '/fingerprint', active: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0 lg:static`}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
                <Fingerprint className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold gradient-text">أجهزة البصمة</h1>
                <p className="text-xs text-gray-500">إدارة أجهزة البصمة</p>
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
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg' 
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
              <h2 className="text-xl font-bold">أجهزة البصمة</h2>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setEditingDevice(null); }}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة جهاز
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingDevice ? 'تعديل جهاز' : 'إضافة جهاز بصمة جديد'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div>
                    <Label>اسم الجهاز</Label>
                    <Input 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="مثال: جهاز البصمة الرئيسي"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>عنوان IP</Label>
                      <Input 
                        value={formData.ipAddress} 
                        onChange={(e) => setFormData({...formData, ipAddress: e.target.value})}
                        placeholder="192.168.1.100"
                        required
                      />
                    </div>
                    <div>
                      <Label>المنفذ</Label>
                      <Input 
                        type="number"
                        value={formData.port} 
                        onChange={(e) => setFormData({...formData, port: parseInt(e.target.value)})}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>الموديل</Label>
                      <Input 
                        value={formData.model} 
                        onChange={(e) => setFormData({...formData, model: e.target.value})}
                        placeholder="مثال: ZKTeco K40"
                      />
                    </div>
                    <div>
                      <Label>الرقم التسلسلي</Label>
                      <Input 
                        value={formData.serialNumber} 
                        onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                        placeholder="اختياري"
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
                    {editingDevice ? 'تحديث' : 'إضافة'}
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
                  <Fingerprint className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">إجمالي الأجهزة</p>
                  <p className="text-2xl font-bold">{devices.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Power className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">الأجهزة النشطة</p>
                  <p className="text-2xl font-bold">{devices.filter(d => d.status === 'online').length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">إجمالي المستخدمين</p>
                  <p className="text-2xl font-bold">{devices.reduce((sum, d) => sum + d.totalUsers, 0)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">آخر مزامنة</p>
                  <p className="text-sm font-medium">
                    {devices.length > 0 && devices[0].lastSync 
                      ? new Date(devices[0].lastSync).toLocaleDateString('ar-EG')
                      : 'لم تتم'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input 
              placeholder="البحث في الأجهزة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>

          {/* Devices Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDevices.map((device) => (
              <Card key={device.id} className="card-hover">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        device.status === 'online' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <Fingerprint className={`w-5 h-5 ${
                          device.status === 'online' ? 'text-green-600' : 'text-red-600'
                        }`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{device.name}</CardTitle>
                        <Badge variant={device.status === 'online' ? 'default' : 'secondary'} className="text-xs">
                          {device.status === 'online' ? 'متصل' : 'غير متصل'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(device)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(device)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Power className="w-4 h-4" />
                      <span>{device.ipAddress}:{device.port}</span>
                    </div>
                    {device.model && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Fingerprint className="w-4 h-4" />
                        <span>{device.model}</span>
                      </div>
                    )}
                    {device.location && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{device.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{device.totalUsers} مستخدم</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredDevices.length === 0 && (
            <div className="text-center py-12">
              <Fingerprint className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-500">لا توجد أجهزة</h3>
              <p className="text-gray-400">قم بإضافة جهاز بصمة جديد</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
