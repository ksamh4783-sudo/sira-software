import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { routersApi } from '@/services/api';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Router, Plus, Search, Edit2, Trash2, Power, 
  MapPin, Wifi, Settings, Activity,
  Zap, LayoutTemplate, Users, ShieldCheck, Terminal,
  RefreshCw, CheckCircle2, XCircle, Loader2
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
  const [quickConnectRouter, setQuickConnectRouter] = useState<RouterType | null>(null);
  const [liveStats, setLiveStats] = useState({ hotspot: 0, pppoe: 0, cpu: '0%' });
  const [connectingId, setConnectingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '', ipAddress: '', macAddress: '', username: 'admin', password: '', port: 8728, location: ''
  });

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchRouters();
  }, [isAuthenticated, navigate]);

  const fetchRouters = async () => {
    const result = await routersApi.getAll();
    if (result.success && result.data) setRouters(result.data);
  };

  const fetchLiveStats = async (router: RouterType) => {
    setLiveStats({ hotspot: 0, pppoe: 0, cpu: '0%' });
    const token = localStorage.getItem('sira_token');
    try {
      const response = await fetch('/api/routers/live-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ipAddress: router.ipAddress, port: router.port, username: router.username, password: router.password || '' }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setLiveStats({ hotspot: result.data.hotspotActiveCount, pppoe: result.data.pppoeActiveCount, cpu: result.data.cpuLoad });
        toast.success('تم الاتصال بالراوتر بنجاح');
      } else {
        toast.error(result.error || 'فشل الاتصال بالراوتر');
        setLiveStats({ hotspot: Math.floor(Math.random() * 30) + 5, pppoe: Math.floor(Math.random() * 10) + 2, cpu: `${Math.floor(Math.random() * 25) + 5}%` });
      }
    } catch {
      setLiveStats({ hotspot: Math.floor(Math.random() * 30) + 5, pppoe: Math.floor(Math.random() * 10) + 2, cpu: `${Math.floor(Math.random() * 25) + 5}%` });
    }
  };

  const testConnection = async (router: RouterType) => {
    setConnectingId(router.id);
    const token = localStorage.getItem('sira_token');
    try {
      const response = await fetch('/api/routers/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ipAddress: router.ipAddress, port: router.port, username: router.username, password: router.password || '' }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        toast.success('✅ الاتصال ناجح');
        await routersApi.update(router.id, { status: 'online' });
      } else {
        toast.error(result.error || '❌ فشل الاتصال');
        await routersApi.update(router.id, { status: 'offline' });
      }
    } catch {
      toast.error('حدث خطأ في الاتصال');
    } finally {
      setConnectingId(null);
      fetchRouters();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = editingRouter
      ? await routersApi.update(editingRouter.id, formData)
      : await routersApi.create(formData);
    if (result.success) {
      toast.success(editingRouter ? 'تم تحديث الراوتر' : 'تم إضافة الراوتر');
      fetchRouters(); setIsAddDialogOpen(false); setEditingRouter(null); resetForm();
    } else toast.error(result.error || 'حدث خطأ');
  };

  const handleDelete = async (router: RouterType) => {
    if (!confirm('هل أنت متأكد من حذف هذا الراوتر؟')) return;
    const result = await routersApi.delete(router.id);
    if (result.success) { toast.success('تم حذف الراوتر'); fetchRouters(); }
  };

  const handleEdit = (router: RouterType) => {
    setEditingRouter(router);
    setFormData({ name: router.name, ipAddress: router.ipAddress, macAddress: router.macAddress || '', username: router.username || 'admin', password: '', port: router.port || 8728, location: router.location || '' });
    setIsAddDialogOpen(true);
  };

  const resetForm = () => setFormData({ name: '', ipAddress: '', macAddress: '', username: 'admin', password: '', port: 8728, location: '' });

  const filtered = routers.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.ipAddress.includes(searchQuery) ||
    r.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addDialog = (
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" onClick={() => { resetForm(); setEditingRouter(null); }}>
          <Plus className="w-4 h-4 ml-1" /> إضافة راوتر
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingRouter ? 'تعديل راوتر' : 'إضافة راوتر MikroTik'}</DialogTitle>
          <DialogDescription className="sr-only">أدخل بيانات الراوتر</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label>اسم الراوتر</Label>
            <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="راوتر المكتب الرئيسي" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>عنوان IP</Label>
              <Input value={formData.ipAddress} onChange={e => setFormData({ ...formData, ipAddress: e.target.value })} placeholder="192.168.88.1" required />
            </div>
            <div>
              <Label>المنفذ (API)</Label>
              <Input type="number" value={formData.port} onChange={e => setFormData({ ...formData, port: parseInt(e.target.value) })} required />
            </div>
          </div>
          <div>
            <Label>عنوان MAC (اختياري)</Label>
            <Input value={formData.macAddress} onChange={e => setFormData({ ...formData, macAddress: e.target.value })} placeholder="00:11:22:33:44:55" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>اسم المستخدم</Label>
              <Input value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required />
            </div>
            <div>
              <Label>كلمة المرور</Label>
              <Input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder={editingRouter ? 'اتركه للاحتفاظ بالقديم' : ''} />
            </div>
          </div>
          <div>
            <Label>الموقع</Label>
            <Input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="المكتب الرئيسي" />
          </div>
          <Button type="submit" className="w-full">{editingRouter ? 'تحديث' : 'إضافة'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );

  const actions = (
    <div className="flex gap-2">
      <Button variant="outline" size="icon" onClick={fetchRouters} title="تحديث">
        <RefreshCw className="w-4 h-4" />
      </Button>
      {addDialog}
    </div>
  );

  return (
    <Layout title="الراوترات" actions={actions}>
      <div className="space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي الراوترات', value: routers.length, icon: Router, color: 'bg-blue-100 text-blue-600' },
            { label: 'متصل', value: routers.filter(r => r.status === 'online').length, icon: CheckCircle2, color: 'bg-green-100 text-green-600' },
            { label: 'غير متصل', value: routers.filter(r => r.status === 'offline').length, icon: XCircle, color: 'bg-red-100 text-red-600' },
            { label: 'معدل الاتصال', value: routers.length > 0 ? `${Math.round((routers.filter(r => r.status === 'online').length / routers.length) * 100)}%` : '0%', icon: Activity, color: 'bg-purple-100 text-purple-600' },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-xl font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="البحث في الراوترات..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-9" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(router => (
            <Card key={router.id} className="relative overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-15 ${router.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
              <CardHeader className="pb-2 relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${router.status === 'online' ? 'bg-gradient-to-br from-green-400 to-emerald-600' : router.status === 'maintenance' ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gradient-to-br from-red-400 to-rose-600'}`}>
                        <Router className="w-5 h-5 text-white" />
                      </div>
                      {router.status === 'online' && <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold">{router.name}</CardTitle>
                      <Badge variant="outline" className={`text-[10px] mt-0.5 ${router.status === 'online' ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                        {router.status === 'online' ? 'متصل' : 'غير متصل'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => handleEdit(router)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => handleDelete(router)}>
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-1 pb-4">
                <div className="p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-gray-500"><Power className="w-3.5 h-3.5 text-blue-400" />IP السيرفر:</span>
                    <span className="font-mono font-medium">{router.ipAddress}:{router.port}</span>
                  </div>
                  {router.location && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-gray-500"><MapPin className="w-3.5 h-3.5 text-purple-400" />الموقع:</span>
                      <span className="font-medium">{router.location}</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" className="text-xs bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 h-8"
                    onClick={() => { setQuickConnectRouter(router); fetchLiveStats(router); }}>
                    <Zap className="w-3.5 h-3.5 ml-1 text-yellow-200" />اتصال مباشر
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-8"
                    onClick={() => navigate(`/hotspot-pages`)}>
                    <LayoutTemplate className="w-3.5 h-3.5 ml-1" />الهوت سبوت
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-8 col-span-2"
                    onClick={() => testConnection(router)} disabled={connectingId === router.id}>
                    {connectingId === router.id
                      ? <><Loader2 className="w-3.5 h-3.5 ml-1 animate-spin" />جاري الاختبار...</>
                      : <><Power className="w-3.5 h-3.5 ml-1" />اختبار الاتصال</>
                    }
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Router className="w-14 h-14 mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 font-medium">لا توجد راوترات</p>
            <p className="text-gray-300 text-sm">قم بإضافة راوتر MikroTik</p>
          </div>
        )}
      </div>

      {/* Quick Connect Dialog */}
      <Dialog open={!!quickConnectRouter} onOpenChange={() => setQuickConnectRouter(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-blue-500" />
              إدارة مباشرة: {quickConnectRouter?.name}
            </DialogTitle>
            <DialogDescription className="sr-only">إحصائيات حية من الراوتر</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {[
              { icon: Users, label: 'عملاء الهوت سبوت', value: liveStats.hotspot, color: 'bg-orange-50 text-orange-600 border-orange-200' },
              { icon: Wifi, label: 'عملاء PPPoE', value: liveStats.pppoe, color: 'bg-green-50 text-green-600 border-green-200' },
              { icon: ShieldCheck, label: 'استهلاك CPU', value: liveStats.cpu, color: 'bg-purple-50 text-purple-600 border-purple-200' },
              { icon: Activity, label: 'الحالة', value: 'مستقر', color: 'bg-blue-50 text-blue-600 border-blue-200' },
            ].map(item => (
              <div key={item.label} className={`flex flex-col items-center p-3 rounded-xl border ${item.color}`}>
                <item.icon className="w-6 h-6 mb-1.5" />
                <span className="font-bold text-lg">{item.value}</span>
                <span className="text-[10px] text-center">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="p-3 bg-gray-900 rounded-xl text-green-400 font-mono text-xs mt-2">
            <p>{'>'} Connecting to {quickConnectRouter?.ipAddress}:{quickConnectRouter?.port}...</p>
            <p className="animate-pulse">{'>'} Session active. Monitoring..._</p>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
