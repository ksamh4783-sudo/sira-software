import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { hotspotPagesApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, Plus, Search, Trash2, ArrowRight, Menu, Eye, 
  Palette, Type, Image, Check
} from 'lucide-react';
import { toast } from 'sonner';
import type { HotspotPage } from '@/types';

const fonts = [
  { id: 'Tajawal', name: 'تجوال' },
  { id: 'Cairo', name: 'القاهرة' },
  { id: 'Almarai', name: 'المراعي' },
  { id: 'Roboto', name: 'Roboto' },
];

export default function HotspotPages() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [pages, setPages] = useState<HotspotPage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [previewPage, setPreviewPage] = useState<HotspotPage | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    subtitle: '',
    backgroundImage: '',
    backgroundColor: '#0f172a',
    logoUrl: '',
    welcomeMessage: 'مرحباً بك في شبكتنا',
    instructions: 'أدخل كود القسيمة للاتصال',
    termsText: 'باستخدامك لهذه الخدمة، فإنك توافق على الشروط والأحكام',
    showTerms: true,
    showLogo: true,
    showVoucherInput: true,
    showPhoneInput: false,
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
    fontFamily: 'Tajawal',
    buttonText: 'اتصل الآن',
    footerText: '',
    isActive: true
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchPages();
  }, [isAuthenticated, navigate]);

  const fetchPages = async () => {
    if (!user) return;
    const result = await hotspotPagesApi.getAll();
    if (result.success && result.data) {
      setPages(result.data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const result = await hotspotPagesApi.create(formData);
    if (result.success) {
      toast.success('تم إنشاء صفحة الهوت سبوت بنجاح');
      fetchPages();
      setIsAddDialogOpen(false);
      resetForm();
    }
  };

  const handleDelete = async (page: HotspotPage) => {
    if (!user) return;
    if (confirm('هل أنت متأكد من حذف هذه الصفحة؟')) {
      const result = await hotspotPagesApi.delete(page.id);
      if (result.success) {
        toast.success('تم حذف الصفحة بنجاح');
        fetchPages();
      }
    }
  };

  const handleToggleActive = async (page: HotspotPage) => {
    if (!user) return;
    const result = await hotspotPagesApi.update(page.id, { isActive: !page.isActive });
    if (result.success) {
      toast.success(page.isActive ? 'تم إلغاء تفعيل الصفحة' : 'تم تفعيل الصفحة');
      fetchPages();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      title: '',
      subtitle: '',
      backgroundImage: '',
      backgroundColor: '#0f172a',
      logoUrl: '',
      welcomeMessage: 'مرحباً بك في شبكتنا',
      instructions: 'أدخل كود القسيمة للاتصال',
      termsText: 'باستخدامك لهذه الخدمة، فإنك توافق على الشروط والأحكام',
      showTerms: true,
      showLogo: true,
      showVoucherInput: true,
      showPhoneInput: false,
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      fontFamily: 'Tajawal',
      buttonText: 'اتصل الآن',
      footerText: '',
      isActive: true
    });
  };

  const filteredPages = pages.filter(page =>
    page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navItems = [
    { icon: ArrowRight, label: 'العودة للوحة التحكم', path: '/dashboard' },
    { icon: Globe, label: 'صفحات الهوت سبوت', path: '/hotspot-pages', active: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0 lg:static`}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold gradient-text">صفحات الهوت سبوت</h1>
                <p className="text-xs text-gray-500">تصميم صفحات تسجيل الدخول</p>
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
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg' 
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
              <h2 className="text-xl font-bold">صفحات الهوت سبوت</h2>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); }}>
                  <Plus className="w-4 h-4 ml-2" />
                  صفحة جديدة
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>إنشاء صفحة هوت سبوت جديدة</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div>
                    <Label>اسم الصفحة (للإدارة)</Label>
                    <Input 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="مثال: صفحة المقهى"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>العنوان الرئيسي</Label>
                      <Input 
                        value={formData.title} 
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        placeholder="مرحباً بك"
                      />
                    </div>
                    <div>
                      <Label>العنوان الفرعي</Label>
                      <Input 
                        value={formData.subtitle} 
                        onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                        placeholder="في شبكتنا"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>رسالة الترحيب</Label>
                    <Input 
                      value={formData.welcomeMessage} 
                      onChange={(e) => setFormData({...formData, welcomeMessage: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>التعليمات</Label>
                    <Input 
                      value={formData.instructions} 
                      onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      رابط صورة الخلفية
                    </Label>
                    <Input 
                      value={formData.backgroundImage} 
                      onChange={(e) => setFormData({...formData, backgroundImage: e.target.value})}
                      placeholder="https://example.com/bg.jpg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        لون الخلفية
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input 
                          type="color"
                          value={formData.backgroundColor}
                          onChange={(e) => setFormData({...formData, backgroundColor: e.target.value})}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <Input 
                          value={formData.backgroundColor}
                          onChange={(e) => setFormData({...formData, backgroundColor: e.target.value})}
                          className="flex-1"
                        />
                      </div>
                    </div>
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
                    <Label>نص الزر</Label>
                    <Input 
                      value={formData.buttonText} 
                      onChange={(e) => setFormData({...formData, buttonText: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>نص الشروط</Label>
                    <Input 
                      value={formData.termsText} 
                      onChange={(e) => setFormData({...formData, termsText: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>نص التذييل</Label>
                    <Input 
                      value={formData.footerText} 
                      onChange={(e) => setFormData({...formData, footerText: e.target.value})}
                      placeholder="Powered by Sira Software"
                    />
                  </div>
                  <div className="flex flex-wrap gap-4">
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
                        checked={formData.showVoucherInput}
                        onChange={(e) => setFormData({...formData, showVoucherInput: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <span>حقل كود القسيمة</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={formData.showPhoneInput}
                        onChange={(e) => setFormData({...formData, showPhoneInput: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <span>حقل رقم الهاتف</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={formData.showTerms}
                        onChange={(e) => setFormData({...formData, showTerms: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <span>إظهار الشروط</span>
                    </label>
                  </div>
                  <Button type="submit" className="w-full">
                    إنشاء الصفحة
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
                  <Globe className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">إجمالي الصفحات</p>
                  <p className="text-2xl font-bold">{pages.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">الصفحات النشطة</p>
                  <p className="text-2xl font-bold">{pages.filter(p => p.isActive).length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">إجمالي المشاهدات</p>
                  <p className="text-2xl font-bold">{pages.reduce((sum, p) => sum + p.viewCount, 0)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Palette className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">التصميمات</p>
                  <p className="text-2xl font-bold">{new Set(pages.map(p => p.primaryColor)).size}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input 
              placeholder="البحث في الصفحات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>

          {/* Pages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPages.map((page) => (
              <Card key={page.id} className={`card-hover overflow-hidden ${page.isActive ? 'ring-2 ring-cyan-500' : ''}`}>
                <div 
                  className="h-32 relative overflow-hidden"
                  style={{ backgroundColor: page.backgroundColor }}
                >
                  {page.backgroundImage && (
                    <img 
                      src={page.backgroundImage} 
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover opacity-50"
                    />
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
                    {page.showLogo && page.logoUrl && (
                      <img src={page.logoUrl} alt="logo" className="w-10 h-10 rounded-full mb-2" />
                    )}
                    <h3 className="font-bold text-lg">{page.title || page.name}</h3>
                    {page.subtitle && <p className="text-sm opacity-80">{page.subtitle}</p>}
                  </div>
                  <div className="absolute top-2 left-2">
                    <Badge className={page.isActive ? 'bg-green-500' : 'bg-gray-500'}>
                      {page.isActive ? 'نشطة' : 'معطلة'}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">المشاهدات:</span>
                      <Badge variant="secondary">{page.viewCount}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">آخر مشاهدة:</span>
                      <span>{page.lastViewedAt ? new Date(page.lastViewedAt).toLocaleDateString('ar-EG') : 'never'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setPreviewPage(page)}
                    >
                      <Eye className="w-4 h-4 ml-2" />
                      معاينة
                    </Button>
                    <Button 
                      variant={page.isActive ? 'secondary' : 'default'}
                      onClick={() => handleToggleActive(page)}
                    >
                      {page.isActive ? 'تعطيل' : 'تفعيل'}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(page)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPages.length === 0 && (
            <div className="text-center py-12">
              <Globe className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-500">لا توجد صفحات</h3>
              <p className="text-gray-400">قم بإنشاء صفحة هوت سبوت جديدة</p>
            </div>
          )}
        </div>
      </main>

      {/* Preview Dialog */}
      <Dialog open={!!previewPage} onOpenChange={() => setPreviewPage(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          {previewPage && (
            <div 
              className="min-h-[500px] flex flex-col"
              style={{
                backgroundColor: previewPage.backgroundColor,
                backgroundImage: previewPage.backgroundImage ? `url(${previewPage.backgroundImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                fontFamily: previewPage.fontFamily
              }}
            >
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-black/40">
                {previewPage.showLogo && previewPage.logoUrl && (
                  <img 
                    src={previewPage.logoUrl} 
                    alt="logo" 
                    className="w-20 h-20 rounded-full mb-4 bg-white/20"
                  />
                )}
                <h1 className="text-3xl font-bold text-white mb-2">{previewPage.title}</h1>
                <p className="text-xl text-white/80 mb-6">{previewPage.subtitle}</p>
                <p className="text-white/90 mb-2">{previewPage.welcomeMessage}</p>
                <p className="text-white/70 text-sm mb-6">{previewPage.instructions}</p>
                
                {previewPage.showVoucherInput && (
                  <div className="w-full max-w-xs mb-4">
                    <input 
                      type="text"
                      placeholder="أدخل كود القسيمة"
                      className="w-full px-4 py-3 rounded-lg text-center text-gray-800"
                      readOnly
                    />
                  </div>
                )}
                
                {previewPage.showPhoneInput && (
                  <div className="w-full max-w-xs mb-4">
                    <input 
                      type="tel"
                      placeholder="رقم الهاتف"
                      className="w-full px-4 py-3 rounded-lg text-center text-gray-800"
                      readOnly
                    />
                  </div>
                )}
                
                <button 
                  className="px-8 py-3 rounded-lg text-white font-medium"
                  style={{ backgroundColor: previewPage.primaryColor }}
                >
                  {previewPage.buttonText}
                </button>
                
                {previewPage.showTerms && (
                  <p className="text-white/60 text-xs mt-4 text-center">{previewPage.termsText}</p>
                )}
              </div>
              
              {previewPage.footerText && (
                <div className="p-4 text-center text-white/60 text-sm">
                  {previewPage.footerText}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
