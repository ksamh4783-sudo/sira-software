import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowRight, Ticket, Users, QrCode, Printer, CheckCircle, 
  Palette, FileText, LayoutGrid, Clock3, DownloadCloud, Settings2, Trash2
} from 'lucide-react';
import { toast } from 'sonner';

// ==========================================
// نموذج بيانات الكارت المولّد (Mock Data)
// ==========================================
interface GeneratedCard {
  id: string;
  username: string;
  password?: string;
  price: string;
  validity: string;
  quota: string; // سعة التحميل
  qrValue: string; // الرابط الخاص بـ QR Code Login
}

// ==========================================
// الكود الكامل للصفحة
// ==========================================
export default function CreateCards() {
  const navigate = useNavigate();
  const printAreaRef = useRef<HTMLDivElement>(null); // مرجع لمنطقة الطباعة
  
  // حقول الإعدادات الأساسية
  const [networkId, setNetworkId] = useState('net-1');
  const [profileId, setProfileId] = useState('prof-1');
  const [quantity, setQuantity] = useState('10');
  const [prefix, setPrefix] = useState('omda-');
  const [validity, setValidity] = useState('30'); // عدد الأيام
  const [quota, setQuota] = useState('5'); // جيجابايت
  const [price, setPrice] = useState('50'); // جنيه

  // حقول إعدادات التصميم والطباعة
  const [columns, setColumns] = useState(4); // عدد الأعمدة في الطباعة
  const [fontSize, setFontSize] = useState(12); // حجم الخط الأساسي
  const [showQr, setShowQr] = useState(true);
  const [showValidity, setShowValidity] = useState(true);
  const [cardTheme, setCardTheme] = useState('premium-gold'); // plain, classic, premium-gold

  // حالة الكروت المولّدة
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // ==========================================
// بيانات وهمية (Mock Data) للشبكات والبروفايلات
// ==========================================
  const networks = useMemo(() => [
    { id: 'net-1', name: 'كافيه العمده (MikroTik CHR)' },
    { id: 'net-2', name: 'قهوة درويش' },
  ], []);

  const profiles = useMemo(() => [
    { id: 'prof-1', name: 'باقة 30 يوم - 5 جيجا (50 ج)', price: '50', validity: '30', quota: '5' },
    { id: 'prof-2', name: 'باقة 15 يوم - 2 جيجا (25 ج)', price: '25', validity: '15', quota: '2' },
    { id: 'prof-3', name: 'باقة يوم واحد - مفتوح (10 ج)', price: '10', validity: '1', quota: '0' },
  ], []);

  // ==========================================
  // دالة توليد الكروت (Mock Logic)
  // ==========================================
  const handleGenerateCards = () => {
    setIsGenerating(true);
    setGeneratedCards([]); // تصفير القائمة الحالية

    const count = parseInt(quantity) || 10;
    const newCards: GeneratedCard[] = [];

    // جلب بيانات البروفايل المختار
    const selectedProfile = profiles.find(p => p.id === profileId);

    // محاكاة الاتصال بالميكروتيك وتوليد اليوزرات
    setTimeout(() => {
      for (let i = 0; i < count; i++) {
        // توليد اسم مستخدم وباسورد عشوائي (في النظام الحقيقي يأتي من API الميكروتيك)
        const randomString = Math.random().toString(36).substring(2, 6).toUpperCase();
        const username = `${prefix}${randomString}`;
        
        newCards.push({
          id: `card-${i}`,
          username: username,
          // password: randomString, // في حال كان اليوزر فقط هو المطلوب
          price: selectedProfile?.price || price,
          validity: selectedProfile?.validity === '1' ? 'يوم واحد' : `${selectedProfile?.validity} يوم`,
          quota: selectedProfile?.quota === '0' ? 'مفتوح' : `${selectedProfile?.quota} جيجا`,
          qrValue: `http://abofahd.a2zspot.com/login?username=${username}` // مثال لرابط تسجيل الدخول عبر QR
        });
      }
      setGeneratedCards(newCards);
      setIsGenerating(false);
      toast.success(`تم توليد ${count} كارت بنجاح، جاهز للطباعة.`);
    }, 1500); // محاكاة تأخير 1.5 ثانية للاتصال بالـ API
  };

  // ==========================================
  // دالة الطباعة (Browser Print)
  // ==========================================
  const handlePrintCards = () => {
    if (generatedCards.length === 0) {
      toast.error('لا توجد كروت مولّدة للطباعة، قم بالإنشاء أولاً.');
      return;
    }
    // نقوم بفتح نافذة الطباعة الخاصة بالمتصفح، مع إخفاء كل شيء عدا منطقة الطباعة عبر الـ CSS
    window.print();
  };

  // ==========================================
  // مُكوّن الكارت الفردي (Single Card Component)
  // ==========================================
  const SingleCard = ({ card, theme, showQr, fontSize }: { card: GeneratedCard, theme: string, showQr: boolean, fontSize: number }) => {
    // تحديد شكل الكارت بناءً على الثيم المختب
    const baseClass = "relative border border-gray-300 rounded overflow-hidden p-2 text-center break-inside-avoid print:shadow-none";
    const themeClass = theme === 'premium-gold' 
      ? 'bg-gradient-to-br from-gray-50 to-amber-50 border-amber-300 text-amber-950 shadow-inner'
      : theme === 'classic'
      ? 'bg-gray-100 border-gray-400 text-gray-900'
      : 'bg-white text-gray-900';

    return (
      <div className={`${baseClass} ${themeClass}`} style={{ fontSize: `${fontSize}px` }}>
        {/* اللوجو (placeholder) */}
        <div className="flex items-center justify-center gap-1 mb-1 pb-1 border-b border-gray-200 dark:border-gray-700 print:border-gray-300">
          <Ticket className={`w-4 h-4 ${theme === 'premium-gold' ? 'text-amber-600' : 'text-gray-600'}`} />
          <span className="font-bold text-[0.8rem]">شبكة العمده</span>
        </div>
        
        {/* السعر البارز */}
        <div className={`${theme === 'premium-gold' ? 'bg-amber-600' : 'bg-gray-800'} text-white font-black text-[1rem] py-0.5 rounded-sm inline-block px-3 mb-1.5 print:bg-gray-800`}>
          {card.price} ج
        </div>

        {/* بيانات المستخدم */}
        <div className="space-y-1 mb-2">
           <p className="text-gray-500 text-[0.7rem] font-medium print:text-gray-600">اسم المستخدم:</p>
           <p className="font-mono font-bold text-[0.9rem] bg-gray-100 px-2 py-0.5 rounded-sm dark:bg-gray-700 dark:text-gray-100 print:bg-gray-100">{card.username}</p>
        </div>

        {/* QR Code (placeholder - يحتاج لمكتبة مثل qrcode.react للتوليد الحقيقي) */}
        {showQr && (
          <div className="flex justify-center mb-1.5 p-1 bg-white inline-block border border-gray-200 print:border-gray-300">
             <div className="w-16 h-16 bg-gray-200 flex items-center justify-center">
                 <QrCode className="w-12 h-12 text-gray-500" />
             </div>
             {/* في النظام الحقيقي: <QRCodeValue value={card.qrValue} size={64} /> */}
          </div>
        )}

        {/* بيانات الصلاحية */}
        {showValidity && (
           <div className="flex justify-between items-center text-[0.7rem] text-gray-600 mt-1 pt-1 border-t border-gray-100 print:border-gray-200">
              <span className="font-medium">سعة التحميل:</span>
              <span className="font-bold">{card.quota}</span>
           </div>
        )}
        {showValidity && (
           <div className="flex justify-between items-center text-[0.7rem] text-gray-600">
              <span className="font-medium">صلاحية:</span>
              <span className="font-bold">{card.validity}</span>
           </div>
        )}
        
        {/* تزيين للخلفية في الـ premium theme */}
        {theme === 'premium-gold' && (
          <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-amber-200 opacity-30 blur-xl"></div>
        )}
      </div>
    );
  };

  // ==========================================
  // التخطيط الرئيسي للصفحة
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex font-sans" dir="rtl">
      
      {/* Sidebar - (نستخدم نفس المنطق الموجود في Routers.tsx لعرض القائمة الجانبية) */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0 lg:static print:hidden`}>
        {/* ... محتوى القائمة الجانبية (يمكن نسخه من Routers.tsx) ... */}
         <div className="h-full flex flex-col">
            <nav className="flex-1 p-4 space-y-2 mt-20">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium"
              >
                <ArrowRight className="w-5 h-5" />
                <span>العودة للوحة التحكم</span>
              </button>
               <button
                onClick={() => navigate('/routers')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium"
              >
                <Router className="w-5 h-5" />
                <span>الشبكات والسيرفرات</span>
              </button>
              <button
                onClick={() => navigate('/create-cards')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all bg-gradient-to-r from-amber-400 to-amber-600 text-amber-950 shadow-lg font-bold"
              >
                <Ticket className="w-5 h-5" />
                <span>توليد الكروت الذهبية</span>
              </button>
            </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        
        {/* Header (مخفي عند الطباعة) */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 px-6 py-4 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                <Ticket className="w-6 h-6 text-amber-950" />
              </div>
              <div>
                <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600">توليد الكروت المخصصة</h1>
                <p className="text-sm text-gray-500 font-medium">قم بإنشاء وطباعة كروت الهوت سبوت بلمسة ذهبية</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 print:p-0 print:m-0 print:max-w-none">
          
          {/* العمود الأيسر: الإعدادات (مخفي عند الطباعة) */}
          <div className="md:col-span-1 space-y-6 print:hidden">
            
            {/* 1. إعدادات البطاقة */}
            <Card className="border border-gray-100 dark:border-gray-800 shadow-sm rounded-2xl">
              <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800 flex flex-row items-center gap-3">
                 <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                  <Settings2 className="w-5 h-5" />
                </div>
                <CardTitle className="text-xl font-black tracking-tight text-gray-800 dark:text-gray-100">إعدادات الكارت</CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                
                <div className="space-y-2">
                  <Label className="font-bold">اختر الشبكة والسيرفر</Label>
                  <Select value={networkId} onValueChange={setNetworkId}>
                    <SelectTrigger className="w-full rounded-xl border-gray-200 dark:border-gray-700 focus:ring-blue-500">
                      <SelectValue placeholder="اختر الشبكة" />
                    </SelectTrigger>
                    <SelectContent>
                      {networks.map(n => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold">اختر البروفايل (الباقة)</Label>
                  <Select value={profileId} onValueChange={setProfileId}>
                    <SelectTrigger className="w-full rounded-xl border-gray-200 dark:border-gray-700 focus:ring-blue-500 font-medium text-gray-700 dark:text-gray-300">
                      <SelectValue placeholder="اختر البروفايل" />
                    </SelectTrigger>
                    <SelectContent>
                       {profiles.map(p => <SelectItem key={p.id} value={p.id} className="font-bold">{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label className="font-bold">عدد الكروت</Label>
                     <Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="مثال: 50" className="rounded-xl border-gray-200 dark:border-gray-700 focus:ring-blue-500" />
                   </div>
                   <div className="space-y-2">
                     <Label className="font-bold">بادئة المستخدم (اختياري)</Label>
                     <Input type="text" value={prefix} onChange={e => setPrefix(e.target.value)} placeholder="omda-" className="rounded-xl border-gray-200 dark:border-gray-700 focus:ring-blue-500 font-mono" />
                   </div>
                </div>

                <Button 
                    onClick={handleGenerateCards} 
                    className="w-full gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-lg h-12 rounded-xl shadow-lg shadow-blue-500/30 border-0"
                    disabled={isGenerating}
                >
                    {isGenerating ? <LayoutTemplate className="w-6 h-6 animate-pulse" /> : <Zap className="w-6 h-6 text-amber-300" />}
                    {isGenerating ? 'جاري توليد الكروت...' : 'توليد الكروت المخصصة'}
                </Button>

              </CardContent>
            </Card>

            {/* 2. إعدادات التصميم والطباعة */}
            <Card className="border border-gray-100 dark:border-gray-800 shadow-sm rounded-2xl">
              <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800 flex flex-row items-center gap-3">
                 <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg text-amber-600 dark:text-amber-400">
                  <Palette className="w-5 h-5" />
                </div>
                <CardTitle className="text-xl font-black tracking-tight text-gray-800 dark:text-gray-100">إعدادات التصميم والطباعة</CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                
                <div className="space-y-2">
                  <Label className="font-bold">اختر شكل الكارت (الثيم)</Label>
                  <Select value={cardTheme} onValueChange={setCardTheme}>
                    <SelectTrigger className="w-full rounded-xl border-gray-200 dark:border-gray-700 focus:ring-amber-500 font-bold text-amber-800 dark:text-amber-400">
                      <SelectValue placeholder="اختر الثيم" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="plain" className="font-medium">بسيط (أبيض وأسود)</SelectItem>
                        <SelectItem value="classic" className="font-medium">كلاسيكي (رمادي وأسود)</SelectItem>
                        <SelectItem value="premium-gold" className="font-bold text-amber-700 dark:text-amber-400">الذهبي الفخم (المقترح)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-gray-500" />
                      <Label className="font-bold">إظهار QR Code</Label>
                  </div>
                  <Switch checked={showQr} onCheckedChange={setShowQr} className="data-[state=checked]:bg-amber-500" />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                      <Clock3 className="w-5 h-5 text-gray-500" />
                      <Label className="font-bold">إظهار الصلاحية والكوتة</Label>
                  </div>
                  <Switch checked={showValidity} onCheckedChange={setShowValidity} className="data-[state=checked]:bg-amber-500" />
                </div>

              </CardContent>
            </Card>

          </div>

          {/* العمود الأيمن: نموذج المعاينة والطباعة */}
          <div className="md:col-span-2 space-y-6 print:p-0 print:m-0">
            
            {/* شريط أدوات المعاينة والطباعة (مخفي عند الطباعة) */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 print:hidden">
              <h3 className="text-xl font-black text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-gray-500" />
                  معاينة نموذج الطباعة
              </h3>
              <div className="flex gap-3 w-full md:w-auto">
                 {generatedCards.length > 0 && (
                    <Button onClick={() => setGeneratedCards([])} variant="ghost" className="text-gray-500 hover:text-red-600">
                      <Trash2 className="w-4 h-4 ml-2" /> مسح القائمة
                    </Button>
                 )}
                 <Button 
                    onClick={handlePrintCards} 
                    className="gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-black h-12 px-6 rounded-xl shadow-lg shadow-green-500/30 border-0"
                    disabled={generatedCards.length === 0}
                 >
                    <Printer className="w-6 h-6 text-white" />
                    طباعة نموذج A4
                 </Button>
              </div>
            </div>

            {/* منطقة الطباعة (هذه المنطقة فقط هي التي ستظهر في نافذة الطباعة) */}
            <div ref={printAreaRef} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-lg min-h-[400px] dark:bg-gray-800 dark:border-gray-700 print:border-0 print:shadow-none print:p-0 print:m-0 print:rounded-none">
                
                {generatedCards.length === 0 && (
                    <div className="flex flex-col items-center justify-center text-center py-24 text-gray-300 dark:text-gray-600 print:hidden">
                        <Ticket className="w-24 h-24 mb-6" />
                        <h3 className="text-2xl font-black mb-2">لا توجد كروت مولّدة حالياً</h3>
                        <p className="max-w-md">قم بضبط الإعدادات في العمود الأيسر واضغط على "توليد الكروت المخصصة" لبدء المعاينة والطباعة.</p>
                    </div>
                )}

                {generatedCards.length > 0 && (
                    <Tabs defaultValue="a4-grid" className="print:hidden">
                        <TabsList className="grid w-[400px] grid-cols-2 mb-6 bg-gray-100 dark:bg-gray-900 rounded-xl p-1 h-12">
                            <TabsTrigger value="a4-grid" className="rounded-lg h-10 data-[state=checked]:bg-white dark:data-[state=checked]:bg-gray-800 data-[state=checked]:font-black data-[state=checked]:text-amber-800 dark:data-[state=checked]:text-amber-400">
                                <FileText className="w-4 h-4 ml-2" /> نموذج طباعة أعمدة A4
                            </TabsTrigger>
                            <TabsTrigger value="thermal" className="rounded-lg h-10 data-[state=checked]:bg-white dark:data-[state=checked]:bg-gray-800 data-[state=checked]:font-black data-[state=checked]:text-amber-800 dark:data-[state=checked]:text-amber-400">
                                <DownloadCloud className="w-4 h-4 ml-2" /> نموذج طباعة حرارية (كاشير)
                            </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="a4-grid">
                            {/* نموذج A4: شبكة أعمدة قابلة للتخصيص */}
                            <div className="flex items-center gap-4 mb-5 p-3 bg-amber-50/50 dark:bg-gray-900/50 rounded-xl border border-amber-100 dark:border-gray-700 print:hidden">
                                <Label className="font-bold whitespace-nowrap">عدد الأعمدة (A4):</Label>
                                <Slider value={[columns]} onValueChange={([val]) => setColumns(val)} min={1} max={6} step={1} className="flex-1 w-64" />
                                <span className="font-black text-amber-800 dark:text-amber-400 text-lg">{columns} أعمدة</span>
                            </div>
                        
                            <div 
                                className="grid gap-2 print:grid print:grid-cols-4 print:gap-1 p-1 bg-white print:p-0 print:m-0" 
                                style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }} // تطبيق عدد الأعمدة برمجياً في الـ preview
                            >
                                {generatedCards.map(card => (
                                    <SingleCard key={card.id} card={card} theme={cardTheme} showQr={showQr} fontSize={fontSize} />
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="thermal">
                           {/* نموذج حراري: عمود واحد ضيق */}
                            <div className="max-w-[300px] mx-auto space-y-2 p-2 bg-white border border-gray-100 print:border-0 print:p-0">
                                {generatedCards.map(card => (
                                    <SingleCard key={card.id} card={card} theme={cardTheme} showQr={showQr} fontSize={fontSize} />
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                )}
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
