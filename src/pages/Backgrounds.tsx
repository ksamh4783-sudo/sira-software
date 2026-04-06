import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { backgroundsApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Image, Plus, Search, Trash2, ArrowRight, Menu, Check, 
  Coffee, Building2, Utensils, Hotel, Store
} from 'lucide-react';
import { toast } from 'sonner';
import type { Background } from '@/types';

const categoryIcons: Record<string, any> = {
  cafe: Coffee,
  restaurant: Utensils,
  hotel: Hotel,
  company: Building2,
  mall: Store,
  general: Image
};

const categoryLabels: Record<string, string> = {
  cafe: 'مقهى',
  restaurant: 'مطعم',
  hotel: 'فندق',
  company: 'شركة',
  mall: 'مجمع',
  general: 'عام'
};

export default function Backgrounds() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    imageUrl: '',
    category: 'general' as const,
    isDefault: false
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchBackgrounds();
  }, [isAuthenticated, navigate]);

  const fetchBackgrounds = () => {
    if (!user) return;
    const result = backgroundsApi.getAll();
    if (result.success && result.data) {
      setBackgrounds(result.data);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const result = backgroundsApi.create(formData);
    if (result.success) {
      toast.success('تم إضافة الخلفية بنجاح');
      fetchBackgrounds();
      setIsAddDialogOpen(false);
      resetForm();
    }
  };

  const handleDelete = (background: Background) => {
    if (!user) return;
    if (confirm('هل أنت متأكد من حذف هذه الخلفية؟')) {
      const result = backgroundsApi.delete(background.id);
      if (result.success) {
        toast.success('تم حذف الخلفية بنجاح');
        fetchBackgrounds();
      }
    }
  };

  const handleSetDefault = (background: Background) => {
    if (!user) return;
    const result = backgroundsApi.update(background.id, { isDefault: !background.isDefault });
    if (result.success) {
      toast.success(background.isDefault ? 'تم إلغاء التعيين كافتراضي' : 'تم التعيين كافتراضي');
      fetchBackgrounds();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      imageUrl: '',
      category: 'general',
      isDefault: false
    });
  };

  const filteredBackgrounds = backgrounds.filter(bg =>
    bg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bg.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navItems = [
    { icon: ArrowRight, label: 'العودة للوحة التحكم', path: '/dashboard' },
    { icon: Image, label: 'الخلفيات', path: '/backgrounds', active: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0 lg:static`}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
                <Image className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold gradient-text">الخلفيات</h1>
                <p className="text-xs text-gray-500">خلفيات صفحات الهوت سبوت</p>
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
                    ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg' 
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
              <h2 className="text-xl font-bold">الخلفيات</h2>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); }}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة خلفية
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>إضافة خلفية جديدة</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div>
                    <Label>اسم الخلفية</Label>
                    <Input 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="مثال: خلفية المقهى"
                      required
                    />
                  </div>
                  <div>
                    <Label>رابط الصورة</Label>
                    <Input 
                      value={formData.imageUrl} 
                      onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                      placeholder="https://example.com/image.jpg"
                      required
                    />
                  </div>
                  <div>
                    <Label>الفئة</Label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="general">عام</option>
                      <option value="cafe">مقهى</option>
                      <option value="restaurant">مطعم</option>
                      <option value="hotel">فندق</option>
                      <option value="company">شركة</option>
                      <option value="mall">مجمع</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      id="isDefault"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="isDefault">تعيين كافتراضي</Label>
                  </div>
                  <Button type="submit" className="w-full">
                    إضافة
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(categoryLabels).map(([key, label]) => {
              const count = backgrounds.filter(bg => bg.category === key).length;
              const Icon = categoryIcons[key];
              return (
                <Card key={key}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{label}</p>
                      <p className="text-2xl font-bold">{count}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input 
              placeholder="البحث في الخلفيات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>

          {/* Backgrounds Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBackgrounds.map((background) => {
              const Icon = categoryIcons[background.category] || Image;
              return (
                <Card key={background.id} className={`card-hover overflow-hidden ${background.isDefault ? 'ring-2 ring-pink-500' : ''}`}>
                  <div className="aspect-video bg-gray-100 relative overflow-hidden">
                    {background.imageUrl ? (
                      <img 
                        src={background.imageUrl} 
                        alt={background.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100%25" height="100%25"%3E%3Crect width="100%25" height="100%25" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af"%3Eلا توجد صورة%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="w-16 h-16 text-gray-300" />
                      </div>
                    )}
                    {background.isDefault && (
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-pink-500 text-white">
                          <Check className="w-3 h-3 ml-1" />
                          افتراضي
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{background.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Icon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">{categoryLabels[background.category]}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleSetDefault(background)}
                          title={background.isDefault ? 'إلغاء التعيين كافتراضي' : 'تعيين كافتراضي'}
                        >
                          <Check className={`w-4 h-4 ${background.isDefault ? 'text-pink-500' : ''}`} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(background)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredBackgrounds.length === 0 && (
            <div className="text-center py-12">
              <Image className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-500">لا توجد خلفيات</h3>
              <p className="text-gray-400">قم بإضافة خلفية جديدة</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
