import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { vouchersApi } from '@/services/api';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Ticket, Plus, Search, Trash2, Check, Copy,
  Clock, Database, Zap, DollarSign, Download, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import type { Voucher } from '@/types';

export default function Vouchers() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'used' | 'available'>('all');
  
  const [formData, setFormData] = useState({
    code: '', duration: 1, dataLimit: 0, speedLimit: '', price: 0, quantity: 1
  });

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchVouchers();
  }, [isAuthenticated, navigate]);

  const fetchVouchers = async () => {
    if (!user) return;
    const result = await vouchersApi.getAll();
    if (result.success && result.data) setVouchers(result.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await vouchersApi.create(formData);
    if (result.success) {
      toast.success(`تم إنشاء ${formData.quantity} قسيمة بنجاح`);
      fetchVouchers();
      setIsAddDialogOpen(false);
      resetForm();
    }
  };

  const handleDelete = async (voucher: Voucher) => {
    if (!confirm('هل أنت متأكد من حذف هذه القسيمة؟')) return;
    const result = await vouchersApi.delete(voucher.id);
    if (result.success) { toast.success('تم حذف القسيمة'); fetchVouchers(); }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('تم نسخ الكود');
  };

  const resetForm = () => setFormData({ code: '', duration: 1, dataLimit: 0, speedLimit: '', price: 0, quantity: 1 });
  const generateRandomCode = () => setFormData({ ...formData, code: Math.random().toString(36).substring(2, 10).toUpperCase() });

  // CSV Export
  const exportCSV = () => {
    const headers = ['الكود', 'المدة (أيام)', 'حد البيانات (MB)', 'حد السرعة', 'السعر ($)', 'الحالة', 'تاريخ الاستخدام'];
    const rows = vouchers.map(v => [
      v.code, v.duration, v.dataLimit || 'غير محدود', v.speedLimit || 'غير محدود',
      v.price.toFixed(2), v.isUsed ? 'مستخدمة' : 'متاحة',
      v.usedAt ? new Date(v.usedAt).toLocaleDateString('ar-EG') : '-'
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `vouchers-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('تم تصدير القسائم بنجاح');
  };

  const filtered = vouchers.filter(v => {
    const matchSearch = v.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.usedBy && v.usedBy.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchStatus = filterStatus === 'all' || (filterStatus === 'used' ? v.isUsed : !v.isUsed);
    return matchSearch && matchStatus;
  });

  const usedCount = vouchers.filter(v => v.isUsed).length;
  const revenue = vouchers.filter(v => v.isUsed).reduce((sum, v) => sum + v.price, 0);

  const actions = (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={exportCSV} disabled={vouchers.length === 0}>
        <Download className="w-4 h-4 ml-1" /> تصدير CSV
      </Button>
      <Button variant="outline" size="icon" onClick={fetchVouchers} title="تحديث">
        <RefreshCw className="w-4 h-4" />
      </Button>
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button onClick={resetForm} size="sm">
            <Plus className="w-4 h-4 ml-1" /> إنشاء قسائم
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>إنشاء قسائم جديدة</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label>الكود (اتركه فارغاً لتوليد عشوائي)</Label>
              <div className="flex gap-2">
                <Input value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="ABC123" className="flex-1" />
                <Button type="button" variant="outline" onClick={generateRandomCode}>توليد</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>المدة (بالأيام)</Label>
                <Input type="number" value={formData.duration} onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })} min={1} required />
              </div>
              <div>
                <Label>الكمية</Label>
                <Input type="number" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })} min={1} max={500} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>حد البيانات (MB)</Label>
                <Input type="number" value={formData.dataLimit} onChange={e => setFormData({ ...formData, dataLimit: parseInt(e.target.value) })} placeholder="0 = غير محدود" />
              </div>
              <div>
                <Label>حد السرعة</Label>
                <Input value={formData.speedLimit} onChange={e => setFormData({ ...formData, speedLimit: e.target.value })} placeholder="مثال: 2M/2M" />
              </div>
            </div>
            <div>
              <Label>السعر ($)</Label>
              <Input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} min={0} step={0.01} />
            </div>
            <Button type="submit" className="w-full">
              إنشاء {formData.quantity > 1 ? `${formData.quantity} قسيمة` : 'قسيمة واحدة'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <Layout title="القسائم" actions={actions}>
      <div className="space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي القسائم', value: vouchers.length, icon: Ticket, color: 'bg-blue-100 text-blue-600' },
            { label: 'المستخدمة', value: usedCount, icon: Check, color: 'bg-green-100 text-green-600' },
            { label: 'المتاحة', value: vouchers.length - usedCount, icon: Clock, color: 'bg-yellow-100 text-yellow-600' },
            { label: 'الإيرادات', value: `$${revenue.toFixed(2)}`, icon: DollarSign, color: 'bg-purple-100 text-purple-600' },
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

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="البحث في القسائم..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-9" />
          </div>
          <div className="flex gap-2">
            {([['all', 'الكل'], ['available', 'المتاحة'], ['used', 'المستخدمة']] as const).map(([val, label]) => (
              <Button key={val} size="sm" variant={filterStatus === val ? 'default' : 'outline'} onClick={() => setFilterStatus(val)}>
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(voucher => (
            <Card key={voucher.id} className={`hover:shadow-md transition-shadow ${voucher.isUsed ? 'opacity-70' : ''}`}>
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <Badge variant={voucher.isUsed ? 'secondary' : 'default'} className="text-xs">
                    {voucher.isUsed ? 'مستخدمة' : 'متاحة'}
                  </Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => handleCopyCode(voucher.code)}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => handleDelete(voucher)}>
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-1">
                <p className="text-xl font-mono font-bold tracking-wider text-center my-2">{voucher.code}</p>
                <div className="space-y-1.5 text-xs text-gray-600">
                  <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{voucher.duration} يوم</div>
                  {voucher.dataLimit > 0 && <div className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5" />{voucher.dataLimit} MB</div>}
                  {voucher.speedLimit && <div className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" />{voucher.speedLimit}</div>}
                  <div className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" />${voucher.price.toFixed(2)}</div>
                  {voucher.isUsed && voucher.usedAt && (
                    <div className="text-[11px] text-gray-400 border-t pt-1.5 mt-1.5">
                      {new Date(voucher.usedAt).toLocaleDateString('ar-EG')}
                      {voucher.usedBy && ` — ${voucher.usedBy}`}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Ticket className="w-14 h-14 mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 font-medium">لا توجد قسائم</p>
            <p className="text-gray-300 text-sm">قم بإنشاء قسائم جديدة</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
