import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { vouchersApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Ticket, Plus, Search, Trash2, Check, Copy, ArrowRight, Menu,
  Clock, Database, Zap, DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import type { Voucher } from '@/types';

export default function Vouchers() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [formData, setFormData] = useState({
    code: '',
    duration: 1,
    dataLimit: 0,
    speedLimit: '',
    price: 0,
    quantity: 1
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchVouchers();
  }, [isAuthenticated, navigate]);

  const fetchVouchers = async () => {
    if (!user) return;
    const result = await vouchersApi.getAll();
    if (result.success && result.data) {
      setVouchers(result.data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const result = await vouchersApi.create(formData);
    if (result.success) {
      toast.success(`تم إنشاء ${formData.quantity} قسيمة بنجاح`);
      fetchVouchers();
      setIsAddDialogOpen(false);
      resetForm();
    }
  };

  const handleDelete = async (voucher: Voucher) => {
    if (!user) return;
    if (confirm('هل أنت متأكد من حذف هذه القسيمة؟')) {
      const result = await vouchersApi.delete(voucher.id);
      if (result.success) {
        toast.success('تم حذف القسيمة بنجاح');
        fetchVouchers();
      }
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('تم نسخ الكود');
  };

  const resetForm = () => {
    setFormData({
      code: '',
      duration: 1,
      dataLimit: 0,
      speedLimit: '',
      price: 0,
      quantity: 1
    });
  };

  const filteredVouchers = vouchers.filter(voucher =>
    voucher.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (voucher.usedBy && voucher.usedBy.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const navItems = [
    { icon: ArrowRight, label: 'العودة للوحة التحكم', path: '/dashboard' },
    { icon: Ticket, label: 'القسائم', path: '/vouchers', active: true },
  ];

  const generateRandomCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData({...formData, code});
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0 lg:static`}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <Ticket className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold gradient-text">القسائم</h1>
                <p className="text-xs text-gray-500">إدارة قسائم الهوت سبوت</p>
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
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg' 
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
              <h2 className="text-xl font-bold">القسائم</h2>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); }}>
                  <Plus className="w-4 h-4 ml-2" />
                  إنشاء قسائم
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>إنشاء قسائم جديدة</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div>
                    <Label>الكود (اتركه فارغاً لتوليد عشوائي)</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={formData.code} 
                        onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                        placeholder="مثال: ABC123"
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" onClick={generateRandomCode}>
                        توليد
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>المدة (بالأيام)</Label>
                      <Input 
                        type="number"
                        value={formData.duration} 
                        onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                        min={1}
                        required
                      />
                    </div>
                    <div>
                      <Label>الكمية</Label>
                      <Input 
                        type="number"
                        value={formData.quantity} 
                        onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                        min={1}
                        max={100}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>حد البيانات (MB)</Label>
                      <Input 
                        type="number"
                        value={formData.dataLimit} 
                        onChange={(e) => setFormData({...formData, dataLimit: parseInt(e.target.value)})}
                        placeholder="0 = غير محدود"
                      />
                    </div>
                    <div>
                      <Label>حد السرعة</Label>
                      <Input 
                        value={formData.speedLimit} 
                        onChange={(e) => setFormData({...formData, speedLimit: e.target.value})}
                        placeholder="مثال: 2M/2M"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>السعر</Label>
                    <Input 
                      type="number"
                      value={formData.price} 
                      onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                      min={0}
                      step={0.01}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    إنشاء {formData.quantity > 1 ? `${formData.quantity} قسائم` : 'قسيمة'}
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
                  <Ticket className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">إجمالي القسائم</p>
                  <p className="text-2xl font-bold">{vouchers.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">المستخدمة</p>
                  <p className="text-2xl font-bold">{vouchers.filter(v => v.isUsed).length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">غير المستخدمة</p>
                  <p className="text-2xl font-bold">{vouchers.filter(v => !v.isUsed).length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">إجمالي الإيرادات</p>
                  <p className="text-2xl font-bold">${vouchers.filter(v => v.isUsed).reduce((sum, v) => sum + v.price, 0).toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input 
              placeholder="البحث في القسائم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>

          {/* Vouchers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredVouchers.map((voucher) => (
              <Card key={voucher.id} className={`card-hover ${voucher.isUsed ? 'opacity-70' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        voucher.isUsed ? 'bg-gray-100' : 'bg-green-100'
                      }`}>
                        <Ticket className={`w-5 h-5 ${
                          voucher.isUsed ? 'text-gray-500' : 'text-green-600'
                        }`} />
                      </div>
                      <Badge variant={voucher.isUsed ? 'secondary' : 'default'} className="text-xs">
                        {voucher.isUsed ? 'مستخدمة' : 'متاحة'}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleCopyCode(voucher.code)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(voucher)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-center mb-4">
                    <p className="text-2xl font-mono font-bold tracking-wider">{voucher.code}</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{voucher.duration} يوم</span>
                    </div>
                    {voucher.dataLimit > 0 && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Database className="w-4 h-4" />
                        <span>{voucher.dataLimit} MB</span>
                      </div>
                    )}
                    {voucher.speedLimit && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Zap className="w-4 h-4" />
                        <span>{voucher.speedLimit}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <DollarSign className="w-4 h-4" />
                      <span>${voucher.price.toFixed(2)}</span>
                    </div>
                    {voucher.isUsed && voucher.usedAt && (
                      <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
                        <p>تم الاستخدام: {new Date(voucher.usedAt).toLocaleDateString('ar-EG')}</p>
                        {voucher.usedBy && <p>بواسطة: {voucher.usedBy}</p>}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredVouchers.length === 0 && (
            <div className="text-center py-12">
              <Ticket className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-500">لا توجد قسائم</h3>
              <p className="text-gray-400">قم بإنشاء قسائم جديدة</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
