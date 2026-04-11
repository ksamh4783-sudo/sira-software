import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { backgroundsApi } from '@/services/api';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Image, Plus, Trash2, Star, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { Background } from '@/types';

export default function Backgrounds() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', imageUrl: '', category: 'general' });

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchBackgrounds();
  }, [isAuthenticated, navigate]);

  const fetchBackgrounds = async () => {
    const result = await backgroundsApi.getAll();
    if (result.success && result.data) setBackgrounds(result.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.imageUrl) { toast.error('الرجاء ملء جميع الحقول'); return; }
    const result = await backgroundsApi.create(formData as Partial<Background>);
    if (result.success) {
      toast.success('تم إضافة الخلفية');
      fetchBackgrounds(); setIsAddDialogOpen(false); resetForm();
    } else toast.error(result.error || 'حدث خطأ');
  };

  const handleDelete = async (background: Background) => {
    if (!confirm('هل أنت متأكد من حذف هذه الخلفية؟')) return;
    const result = await backgroundsApi.delete(background.id);
    if (result.success) { toast.success('تم حذف الخلفية'); fetchBackgrounds(); }
    else toast.error(result.error || 'حدث خطأ');
  };

  const handleSetDefault = async (background: Background) => {
    const result = await backgroundsApi.update(background.id, { isDefault: !background.isDefault });
    if (result.success) {
      toast.success(background.isDefault ? 'تم إلغاء التعيين كافتراضي' : 'تم التعيين كافتراضي');
      fetchBackgrounds();
    }
  };

  const resetForm = () => setFormData({ name: '', imageUrl: '', category: 'general' });

  const actions = (
    <div className="flex gap-2">
      <Button variant="outline" size="icon" onClick={fetchBackgrounds} title="تحديث">
        <RefreshCw className="w-4 h-4" />
      </Button>
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm" onClick={resetForm}>
            <Plus className="w-4 h-4 ml-1" /> خلفية جديدة
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>إضافة خلفية جديدة</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label>اسم الخلفية</Label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="خلفية المقهى" />
            </div>
            <div>
              <Label>رابط الصورة</Label>
              <Input value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} placeholder="https://example.com/image.jpg" dir="ltr" />
            </div>
            <div>
              <Label>الفئة</Label>
              <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-sm">
                <option value="general">عام</option>
                <option value="cafe">مقهى</option>
                <option value="restaurant">مطعم</option>
                <option value="hotel">فندق</option>
                <option value="company">شركة</option>
              </select>
            </div>
            <Button type="submit" className="w-full">إضافة</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <Layout title="الخلفيات" actions={actions}>
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {backgrounds.map(background => (
            <Card key={background.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
              <div className="relative h-36 bg-gray-200 overflow-hidden">
                <img
                  src={background.imageUrl}
                  alt={background.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={e => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x150?text=خلفية'; }}
                />
                {background.isDefault && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                    <Star className="w-3 h-3" /> افتراضي
                  </div>
                )}
              </div>
              <CardContent className="p-3">
                <h3 className="font-semibold text-sm mb-0.5">{background.name}</h3>
                <p className="text-xs text-gray-400 mb-3">{background.category}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleSetDefault(background)} className="flex-1 text-xs h-8">
                    <Star className="w-3.5 h-3.5 ml-1" />
                    {background.isDefault ? 'إلغاء' : 'تعيين'}
                  </Button>
                  <Button variant="destructive" size="icon" className="w-8 h-8" onClick={() => handleDelete(background)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {backgrounds.length === 0 && (
          <div className="text-center py-16">
            <Image className="w-14 h-14 mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 font-medium">لا توجد خلفيات</p>
            <p className="text-gray-300 text-sm">قم بإضافة خلفيات للهوت سبوت</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
