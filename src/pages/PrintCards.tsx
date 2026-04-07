import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { printCardsApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, Plus, Search, Trash2, ArrowRight, Menu, Printer,
  Palette, Type, QrCode, Image
} from 'lucide-react';
import { toast } from 'sonner';
import type { PrintCard } from '@/types';

const templates = [
  { id: 'modern', name: 'عصري', color: 'from-blue-500 to-purple-600' },
  { id: 'classic', name: 'كلاسيكي', color: 'from-gray-700 to-gray-900' },
  { id: 'minimal', name: 'بسيط', color: 'from-green-500 to-teal-600' },
  { id: 'colorful', name: 'ملون', color: 'from-pink-500 to-orange-500' },
  { id: 'elegant', name: 'أنيق', color: 'from-purple-600 to-indigo-700' },
];

const fonts = [
  { id: 'Tajawal', name: 'تجوال' },
  { id: 'Cairo', name: 'القاهرة' },
  { id: 'Almarai', name: 'المراعي' },
  { id: 'Roboto', name: 'Roboto' },
];

export default function PrintCards() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [cards, setCards] = useState<PrintCard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [previewCard, setPreviewCard] = useState<PrintCard | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    template: 'modern' as const,
    voucherCode: '',
    duration: 1,
    dataLimit: 0,
    speedLimit: '',
    price: 0,
    logoUrl: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
    fontFamily: 'Tajawal',
    showLogo: true,
    showQR: true,
    notes: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchCards();
  }, [isAuthenticated, navigate]);

  const fetchCards = async () => {
    if (!user) return;
    const result = await printCardsApi.getAll();
    if (result.success && result.data) {
      setCards(result.data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const result = await printCardsApi.create(formData);
    if (result.success) {
      toast.success('تم إنشاء كرت الطباعة بنجاح');
      fetchCards();
      setIsAddDialogOpen(false);
      resetForm();
    }
  };

  const handleDelete = async (card: PrintCard) => {
    if (!user) return;
    if (confirm('هل أنت متأكد من حذف هذا الكرت؟')) {
      const result = await printCardsApi.delete(card.id);
      if (result.success) {
        toast.success('تم حذف الكرت بنجاح');
        fetchCards();
      }
    }
  };

  const handlePrint = async (card: PrintCard) => {
    if (!user) return;
    const result = await printCardsApi.print(card.id);
    if (result.success) {
      toast.success('تم تسجيل عملية الطباعة');
      fetchCards();
      setPreviewCard(card);
    } else {
      toast.error(result.error || 'حدث خطأ');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      template: 'modern',
      voucherCode: '',
      duration: 1,
      dataLimit: 0,
      speedLimit: '',
      price: 0,
      logoUrl: '',
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      fontFamily: 'Tajawal',
      showLogo: true,
      showQR: true,
      notes: ''
    });
  };

  const filteredCards = cards.filter(card =>
    card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.voucherCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navItems = [
    { icon: ArrowRight, label: 'العودة للوحة التحكم', path: '/dashboard' },
    { icon: CreditCard, label: 'كروت الطباعة', path: '/print-cards', active: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0 lg:static`}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold gradient-text">كروت الطباعة</h1>
                <p className="text-xs text-gray-500">تصميم وطباعة الكروت</p>
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
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
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
              <h2 className="text-xl font-bold">كروت الطباعة</h2>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); }}>
                  <Plus className="w-4 h-4 ml-2" />
                  تصميم كرت
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>تصميم كرت طباعة جديد</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div>
                    <Label>العنوان</Label>
                    <Input 
                      value={formData.title} 
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="مثال: كرت واي فاي - المقهى"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>كود القسيمة</Label>
                      <Input 
                        value={formData.voucherCode} 
                        onChange={(e) => setFormData({...formData, voucherCode: e.target.value.toUpperCase()})}
                        placeholder="ABC123"
                        required
                      />
                    </div>
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
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>حد البيانات (MB)</Label>
                      <Input 
                        type="number"
                        value={formData.dataLimit} 
                        onChange={(e) => setFormData({...formData, dataLimit: parseInt(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label>حد السرعة</Label>
                      <Input 
                        value={formData.speedLimit} 
                        onChange={(e) => setFormData({...formData, speedLimit: e.target.value})}
                        placeholder="2M/2M"
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
                  <div>
                    <Label>القالب</Label>
                    <div className="grid grid-cols-5 gap-2 mt-2">
                      {templates.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setFormData({...formData, template: t.id as any})}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            formData.template === t.id 
                              ? 'border-indigo-500 bg-indigo-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className={`w-full h-8 rounded bg-gradient-to-r ${t.color} mb-2`} />
                          <span className="text-xs">{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        اللون الأساسي
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input 
                          type="color"
                          value={formData.primaryColor}
                          onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <Input 
                          value={formData.primaryColor}
                          onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        اللون الثانوي
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input 
                          type="color"
                          value={formData.secondaryColor}
                          onChange={(e) => setFormData({...formData, secondaryColor: e.target.value})}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <Input 
                          value={formData.secondaryColor}
                          onChange={(e) => setFormData({...formData, secondaryColor: e.target.value})}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Type className="w-4 h-4" />
                      نوع الخط
                    </Label>
                    <select 
                      value={formData.fontFamily}
                      onChange={(e) => setFormData({...formData, fontFamily: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg mt-1"
                    >
                      {fonts.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      رابط الشعار
                    </Label>
                    <Input 
                      value={formData.logoUrl} 
                      onChange={(e) => setFormData({...formData, logoUrl: e.target.value})}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={formData.showLogo}
                        onChange={(e) => setFormData({...formData, showLogo: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <span>إظهار الشعار</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={formData.showQR}
                        onChange={(e) => setFormData({...formData, showQR: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <span className="flex items-center gap-1">
                        <QrCode className="w-4 h-4" />
                        إظهار QR
                      </span>
                    </label>
                  </div>
                  <div>
                    <Label>ملاحظات</Label>
                    <Input 
                      value={formData.notes} 
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="ملاحظات إضافية..."
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    إنشاء الكرت
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
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">إجمالي الكروت</p>
                  <p className="text-2xl font-bold">{cards.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Printer className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">إجمالي الطباعات</p>
                  <p className="text-2xl font-bold">{cards.reduce((sum, c) => sum + c.printCount, 0)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Palette className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">القوالب</p>
                  <p className="text-2xl font-bold">{new Set(cards.map(c => c.template)).size}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">مع QR</p>
                  <p className="text-2xl font-bold">{cards.filter(c => c.showQR).length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input 
              placeholder="البحث في الكروت..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCards.map((card) => {
              const template = templates.find(t => t.id === card.template);
              return (
                <Card key={card.id} className="card-hover overflow-hidden">
                  <div className={`h-24 bg-gradient-to-r ${template?.color || 'from-blue-500 to-purple-600'} p-4`}>
                    <div className="flex items-start justify-between">
                      <div className="text-white">
                        <h3 className="font-bold text-lg">{card.title}</h3>
                        <p className="text-white/80 text-sm">{card.voucherCode}</p>
                      </div>
                      {card.showLogo && card.logoUrl && (
                        <img src={card.logoUrl} alt="logo" className="w-10 h-10 rounded-full bg-white/20" />
                      )}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-500">المدة:</span>
                        <span>{card.duration} يوم</span>
                      </div>
                      {card.dataLimit > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">البيانات:</span>
                          <span>{card.dataLimit} MB</span>
                        </div>
                      )}
                      {card.speedLimit && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">السرعة:</span>
                          <span>{card.speedLimit}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">السعر:</span>
                        <span className="font-medium">${card.price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">عدد الطباعات:</span>
                        <Badge variant="secondary">{card.printCount}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handlePrint(card)}
                      >
                        <Printer className="w-4 h-4 ml-2" />
                        طباعة
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(card)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredCards.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-500">لا توجد كروت</h3>
              <p className="text-gray-400">قم بتصميم كرت طباعة جديد</p>
            </div>
          )}
        </div>
      </main>

      {/* Preview Dialog */}
      <Dialog open={!!previewCard} onOpenChange={() => setPreviewCard(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>معاينة الكرت</DialogTitle>
          </DialogHeader>
          {previewCard && (
            <div 
              className="p-6 rounded-xl text-white"
              style={{
                background: `linear-gradient(135deg, ${previewCard.primaryColor}, ${previewCard.secondaryColor})`,
                fontFamily: previewCard.fontFamily
              }}
            >
              <div className="text-center mb-4">
                {previewCard.showLogo && previewCard.logoUrl && (
                  <img src={previewCard.logoUrl} alt="logo" className="w-16 h-16 mx-auto mb-2 rounded-full bg-white/20" />
                )}
                <h3 className="text-xl font-bold">{previewCard.title}</h3>
              </div>
              <div className="bg-white/20 rounded-lg p-4 text-center mb-4">
                <p className="text-sm opacity-80">كود الاتصال</p>
                <p className="text-2xl font-mono font-bold tracking-wider">{previewCard.voucherCode}</p>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>المدة:</span>
                  <span>{previewCard.duration} يوم</span>
                </div>
                {previewCard.dataLimit > 0 && (
                  <div className="flex justify-between">
                    <span>البيانات:</span>
                    <span>{previewCard.dataLimit} MB</span>
                  </div>
                )}
                {previewCard.speedLimit && (
                  <div className="flex justify-between">
                    <span>السرعة:</span>
                    <span>{previewCard.speedLimit}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>السعر:</span>
                  <span>${previewCard.price.toFixed(2)}</span>
                </div>
              </div>
              {previewCard.showQR && (
                <div className="mt-4 flex justify-center">
                  <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-gray-800" />
                  </div>
                </div>
              )}
              {previewCard.notes && (
                <p className="mt-4 text-xs text-center opacity-80">{previewCard.notes}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
