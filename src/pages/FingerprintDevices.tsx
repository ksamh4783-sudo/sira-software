import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { fingerprintApi, fetchWithAuth } from '@/services/api';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Fingerprint, Plus, Search, Edit2, Trash2, Power, 
  MapPin, Users, RefreshCw, Radio, CheckCircle2, XCircle, Loader2
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
  const [testingId, setTestingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '', ipAddress: '', port: 4370, model: '', serialNumber: '', location: ''
  });

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchDevices();
  }, [isAuthenticated, navigate]);

  const fetchDevices = async () => {
    if (!user) return;
    const result = await fingerprintApi.getAll();
    if (result.success && result.data) setDevices(result.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = editingDevice
      ? await fingerprintApi.update(editingDevice.id, formData)
      : await fingerprintApi.create(formData);
    if (result.success) {
      toast.success(editingDevice ? 'تم تحديث الجهاز' : 'تم إضافة الجهاز');
      fetchDevices(); setIsAddDialogOpen(false); setEditingDevice(null); resetForm();
    }
  };

  const handleDelete = async (device: FingerprintDevice) => {
    if (!confirm('هل أنت متأكد من حذف هذا الجهاز؟')) return;
    const result = await fingerprintApi.delete(device.id);
    if (result.success) { toast.success('تم حذف الجهاز'); fetchDevices(); }
  };

  const handleEdit = (device: FingerprintDevice) => {
    setEditingDevice(device);
    setFormData({ name: device.name, ipAddress: device.ipAddress, port: device.port, model: device.model, serialNumber: device.serialNumber || '', location: device.location || '' });
    setIsAddDialogOpen(true);
  };

  const handleTestConnection = async (device: FingerprintDevice) => {
    setTestingId(device.id);
    const result = await fetchWithAuth<{ success: boolean; message?: string; error?: string }>(
      `/api/fingerprint/${device.id}/test-connection`, { method: 'POST' }
    );
    setTestingId(null);
    if (result.success && (result as any).data?.success) {
      toast.success(`✅ متصل: ${device.name}`);
      await fingerprintApi.update(device.id, { status: 'online' });
    } else {
      toast.error(`❌ فشل الاتصال: ${(result as any).data?.error || 'تعذر الوصول للجهاز'}`);
      await fingerprintApi.update(device.id, { status: 'offline' });
    }
    fetchDevices();
  };

  const resetForm = () => setFormData({ name: '', ipAddress: '', port: 4370, model: '', serialNumber: '', location: '' });

  const filtered = devices.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.ipAddress.includes(searchQuery) ||
    d.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const actions = (
    <div className="flex gap-2">
      <Button variant="outline" size="icon" onClick={fetchDevices} title="تحديث">
        <RefreshCw className="w-4 h-4" />
      </Button>
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm" onClick={() => { resetForm(); setEditingDevice(null); }}>
            <Plus className="w-4 h-4 ml-1" /> إضافة جهاز
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingDevice ? 'تعديل جهاز' : 'إضافة جهاز بصمة'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label>اسم الجهاز</Label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="جهاز البصمة الرئيسي" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>عنوان IP</Label>
                <Input value={formData.ipAddress} onChange={e => setFormData({ ...formData, ipAddress: e.target.value })} placeholder="192.168.1.100" required />
              </div>
              <div>
                <Label>المنفذ</Label>
                <Input type="number" value={formData.port} onChange={e => setFormData({ ...formData, port: parseInt(e.target.value) })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الموديل</Label>
                <Input value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} placeholder="ZKTeco K40" />
              </div>
              <div>
                <Label>الرقم التسلسلي</Label>
                <Input value={formData.serialNumber} onChange={e => setFormData({ ...formData, serialNumber: e.target.value })} placeholder="اختياري" />
              </div>
            </div>
            <div>
              <Label>الموقع</Label>
              <Input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="المكتب الرئيسي" />
            </div>
            <Button type="submit" className="w-full">{editingDevice ? 'تحديث' : 'إضافة'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <Layout title="أجهزة البصمة" actions={actions}>
      <div className="space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي الأجهزة', value: devices.length, icon: Fingerprint, color: 'bg-blue-100 text-blue-600' },
            { label: 'متصل', value: devices.filter(d => d.status === 'online').length, icon: CheckCircle2, color: 'bg-green-100 text-green-600' },
            { label: 'غير متصل', value: devices.filter(d => d.status === 'offline').length, icon: XCircle, color: 'bg-red-100 text-red-600' },
            { label: 'إجمالي المستخدمين', value: devices.reduce((s, d) => s + d.totalUsers, 0), icon: Users, color: 'bg-purple-100 text-purple-600' },
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
          <Input placeholder="البحث في الأجهزة..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-9" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(device => (
            <Card key={device.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${device.status === 'online' ? 'bg-green-100' : 'bg-red-100'}`}>
                      <Fingerprint className={`w-5 h-5 ${device.status === 'online' ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{device.name}</CardTitle>
                      <Badge variant={device.status === 'online' ? 'default' : 'secondary'} className="text-[10px] mt-0.5">
                        {device.status === 'online' ? 'متصل' : 'غير متصل'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => handleEdit(device)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => handleDelete(device)}>
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-1">
                <div className="space-y-1.5 text-xs text-gray-600 mb-3">
                  <div className="flex items-center gap-1.5"><Power className="w-3.5 h-3.5" />{device.ipAddress}:{device.port}</div>
                  {device.model && <div className="flex items-center gap-1.5"><Fingerprint className="w-3.5 h-3.5" />{device.model}</div>}
                  {device.location && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{device.location}</div>}
                  <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{device.totalUsers} مستخدم</div>
                </div>
                <Button
                  variant="outline" size="sm" className="w-full text-xs h-8"
                  onClick={() => handleTestConnection(device)}
                  disabled={testingId === device.id}
                >
                  {testingId === device.id
                    ? <><Loader2 className="w-3.5 h-3.5 ml-1 animate-spin" />جاري الاختبار...</>
                    : <><Radio className="w-3.5 h-3.5 ml-1" />اختبار الاتصال</>
                  }
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Fingerprint className="w-14 h-14 mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 font-medium">لا توجد أجهزة</p>
            <p className="text-gray-300 text-sm">قم بإضافة جهاز بصمة</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
