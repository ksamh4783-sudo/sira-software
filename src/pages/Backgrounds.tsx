import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { backgroundsApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Image, Plus, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';
import type { Background } from '@/types';

export default function Backgrounds() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    imageUrl: '',
    category: 'general'
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchBackgrounds();
  }, [isAuthenticated, navigate]);

  const fetchBackgrounds = async () => {
    const result = await backgroundsApi.getAll();
    if (result.success && result.data) {
      setBackgrounds(result.data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.imageUrl) {
      toast.error('الرجاء ملء جميع الحقول');
      return;
    }

    const result = await backgroundsApi.create(formData as Partial<Background>);
    if (result.success) {
      toast.success('تم إضافة الخلفية بنجاح');
      fetchBackgrounds();
      setIsAddDialogOpen(false);
      resetForm();
    } else {
      toast.error(result.error || 'حدث خطأ');
    }
  };

  const handleDelete = async (background: Background) => {
    if (confirm('هل أنت متأكد من حذف هذه الخلفية؟')) {
      const result = await backgroundsApi.delete(background.id);
      if (result.success) {
        toast.success('تم حذف الخلفية بنجاح');
        fetchBackgrounds();
      } else {
        toast.error(result.error || 'حدث خطأ');
      }
    }
  };

  const handleSetDefault = async (background: Background) => {
    const result = await backgroundsApi.update(background.id, { isDefault: !background.isDefault });
    if (result.success) {
      toast.success(background.isDefault ? 'تم إلغاء التعيين كافتراضي' : 'تم التعيين كافتراضي');
      fetchBackgrounds();
    } else {
      toast.error(result.error || 'حدث خطأ');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      imageUrl: '',
      category: 'general'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
              <Image className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">الخلفيات</h1>
              <p className="text-gray-500">إدارة خلفيات الهوت سبوت والكروت</p>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                خلفية جديدة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة خلفية جديدة</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">اسم الخلفية</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: خلفية المقهى"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">رابط الصورة</label>
                  <Input
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">الفئة</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {backgrounds.map((background) => (
            <Card key={background.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-40 bg-gray-200 overflow-hidden">
                <img
                  src={background.imageUrl}
                  alt={background.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=خلفية';
                  }}
                />
                {background.isDefault && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    افتراضي
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">{background.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{background.category}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetDefault(background)}
                    className="flex-1 gap-2"
                  >
                    <Star className="w-4 h-4" />
                    {background.isDefault ? 'إلغاء' : 'تعيين'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(background)}
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {backgrounds.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">لا توجد خلفيات حالياً</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
