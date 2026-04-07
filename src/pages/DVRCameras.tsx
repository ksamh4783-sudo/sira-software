import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { dvrApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, Plus, Search, Edit2, Trash2, Power, 
  MapPin, Video, ArrowRight, Menu, Eye, EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import type { DVRCamera } from '@/types';

export default function DVRCameras() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [cameras, setCameras] = useState<DVRCamera[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<DVRCamera | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    ipAddress: '',
    port: 80,
    model: '',
    channel: 1,
    username: 'admin',
    password: '',
    location: '',
    streamUrl: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchCameras();
  }, [isAuthenticated, navigate]);

  const fetchCameras = async () => {
    if (!user) return;
    const result = await dvrApi.getAll();
    if (result.success && result.data) {
      setCameras(result.data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (editingCamera) {
      const result = await dvrApi.update(editingCamera.id, formData);
      if (result.success) {
        toast.success('تم تحديث الكاميرا بنجاح');
        fetchCameras();
        setIsAddDialogOpen(false);
        setEditingCamera(null);
      }
    } else {
      const result = await dvrApi.create(formData);
      if (result.success) {
        toast.success('تم إضافة الكاميرا بنجاح');
        fetchCameras();
        setIsAddDialogOpen(false);
        resetForm();
      }
    }
  };

  const handleDelete = async (camera: DVRCamera) => {
    if (!user) return;
    if (confirm('هل أنت متأكد من حذف هذه الكاميرا؟')) {
      const result = await dvrApi.delete(camera.id);
      if (result.success) {
        toast.success('تم حذف الكاميرا بنجاح');
        fetchCameras();
      }
    }
  };

  const handleEdit = async (camera: DVRCamera) => {
    setEditingCamera(camera);
    setFormData({
      name: camera.name,
      ipAddress: camera.ipAddress,
      port: camera.port,
      model: camera.model,
      channel: camera.channel,
      username: camera.username,
      password: camera.password,
      location: camera.location || '',
      streamUrl: camera.streamUrl || ''
    });
    setIsAddDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      ipAddress: '',
      port: 80,
      model: '',
      channel: 1,
      username: 'admin',
      password: '',
      location: '',
      streamUrl: ''
    });
  };

  const filteredCameras = cameras.filter(camera =>
    camera.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    camera.ipAddress.includes(searchQuery) ||
    camera.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navItems = [
    { icon: ArrowRight, label: 'العودة للوحة التحكم', path: '/dashboard' },
    { icon: Camera, label: 'كاميرات DVR', path: '/dvr', active: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0 lg:static`}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold gradient-text">كاميرات DVR</h1>
                <p className="text-xs text-gray-500">إدارة كاميرات المراقبة</p>
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
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg' 
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
              <h2 className="text-xl font-bold">كاميرات DVR</h2>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setEditingCamera(null); }}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة كاميرا
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingCamera ? 'تعديل كاميرا' : 'إضافة كاميرا DVR جديدة'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div>
                    <Label>اسم الكاميرا</Label>
                    <Input 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="مثال: كاميرا المدخل الرئيسي"
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
                        placeholder="مثال: Hikvision DS-7200"
                      />
                    </div>
                    <div>
                      <Label>القناة</Label>
                      <Input 
                        type="number"
                        value={formData.channel} 
                        onChange={(e) => setFormData({...formData, channel: parseInt(e.target.value)})}
                        min={1}
                      />
                    </div>
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
                      <div className="relative">
                        <Input 
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password} 
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          className="absolute left-1 top-1/2 -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label>الموقع</Label>
                    <Input 
                      value={formData.location} 
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="مثال: المدخل الأمامي"
                    />
                  </div>
                  <div>
                    <Label>رابط البث (Stream URL)</Label>
                    <Input 
                      value={formData.streamUrl} 
                      onChange={(e) => setFormData({...formData, streamUrl: e.target.value})}
                      placeholder="rtsp://..."
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    {editingCamera ? 'تحديث' : 'إضافة'}
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
                  <Camera className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">إجمالي الكاميرات</p>
                  <p className="text-2xl font-bold">{cameras.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Power className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">الكاميرات المتصلة</p>
                  <p className="text-2xl font-bold">{cameras.filter(c => c.status === 'online').length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Video className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">إجمالي القنوات</p>
                  <p className="text-2xl font-bold">{cameras.reduce((sum, c) => sum + c.channel, 0)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">المواقع</p>
                  <p className="text-2xl font-bold">{new Set(cameras.map(c => c.location).filter(Boolean)).size}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input 
              placeholder="البحث في الكاميرات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>

          {/* Cameras Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCameras.map((camera) => (
              <Card key={camera.id} className="card-hover">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        camera.status === 'online' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <Camera className={`w-5 h-5 ${
                          camera.status === 'online' ? 'text-green-600' : 'text-red-600'
                        }`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{camera.name}</CardTitle>
                        <Badge variant={camera.status === 'online' ? 'default' : 'secondary'} className="text-xs">
                          {camera.status === 'online' ? 'متصلة' : 'غير متصلة'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(camera)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(camera)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Power className="w-4 h-4" />
                      <span>{camera.ipAddress}:{camera.port}</span>
                    </div>
                    {camera.model && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Camera className="w-4 h-4" />
                        <span>{camera.model}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Video className="w-4 h-4" />
                      <span>قناة {camera.channel}</span>
                    </div>
                    {camera.location && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{camera.location}</span>
                      </div>
                    )}
                    {camera.streamUrl && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Eye className="w-4 h-4" />
                        <span className="truncate">{camera.streamUrl}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCameras.length === 0 && (
            <div className="text-center py-12">
              <Camera className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-500">لا توجد كاميرات</h3>
              <p className="text-gray-400">قم بإضافة كاميرا DVR جديدة</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
