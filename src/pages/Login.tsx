import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Wifi, Shield, Lock, Headphones, Loader2, MessageCircle,
  Network, Zap, Eye, EyeOff, Sparkles, Globe, Server, Users
} from 'lucide-react';
import { toast } from 'sonner';

// Animated Background
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[150px]" />
      
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white/30 rounded-full animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
          }}
        />
      ))}
      
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />
    </div>
  );
}

// Feature Card
function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300 group">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
        <Icon className="w-5 h-5 text-blue-400" />
      </div>
      <div>
        <h3 className="font-medium text-white text-sm">{title}</h3>
        <p className="text-xs text-gray-400 mt-1">{description}</p>
      </div>
    </div>
  );
}

// Stats Counter
function StatsCounter({ value, label, icon: Icon }: { value: string, label: string, icon: any }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-xs text-gray-400">{label}</div>
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setIsLoading(true);
    
    const result = await login({
      email: formData.email,
      password: formData.password,
    });
    
    setIsLoading(false);
    
    if (result.success) {
      toast.success('تم تسجيل الدخول بنجاح!');
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'فشل تسجيل الدخول');
    }
  };

  const handleWhatsApp = () => {
    window.open('https://wa.me/201065063147', '_blank');
  };

  return (
    <div className="min-h-screen network-bg flex">
      <AnimatedBackground />
      
      {/* Left Side - Features */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Network className="w-7 h-7 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-slate-900 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">سيرا للبرمجيات</h1>
            <p className="text-blue-300 text-sm">Sira Software Pro</p>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
              إدارة ذكية
              <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                أداء أفضل
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-md">
              منصة متكاملة لإدارة الشبكات وأجهزة البصمة وكاميرات المراقبة
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FeatureCard icon={Server} title="إدارة الراوترات" description="تحكم كامل في أجهزة MikroTik" />
            <FeatureCard icon={Wifi} title="قسائم الإنترنت" description="إنشاء وإدارة بطاقات Hotspot" />
            <FeatureCard icon={Globe} title="صفحات مخصصة" description="صفحات تسجيل دخول احترافية" />
            <FeatureCard icon={Shield} title="أمان عالي" description="حماية AES-256 بتشفير كامل" />
          </div>
        </div>

        <div className="flex gap-8">
          <StatsCounter value="1000+" label="عميل نشط" icon={Users} />
          <StatsCounter value="50K+" label="قسيمة" icon={Wifi} />
          <StatsCounter value="99.9%" label="uptime" icon={Server} />
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Network className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <h1 className="text-xl font-bold text-white">سيرا للبرمجيات</h1>
                <p className="text-blue-300 text-xs">Sira Software Pro</p>
              </div>
            </div>
          </div>

          <Card className="glass border-0 shadow-2xl overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
            
            <CardHeader className="space-y-1 text-center pt-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 mb-4">
                <Sparkles className="w-8 h-8 text-blue-400" />
              </div>
              <CardTitle className="text-2xl font-bold">تسجيل الدخول</CardTitle>
              <CardDescription>أدخل بيانات حسابك للوصول إلى لوحة التحكم</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <div className="relative group">
                    <Input
                      id="email"
                      type="email"
                      placeholder="أدخل بريدك الإلكتروني"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pr-10 h-12 bg-white/5 border-white/10 focus:border-blue-500"
                      dir="ltr"
                    />
                    <Wifi className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">كلمة المرور</Label>
                  <div className="relative group">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pr-10 pl-12 h-12 bg-white/5 border-white/10 focus:border-blue-500"
                      dir="ltr"
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id="remember"
                      checked={formData.rememberMe}
                      onCheckedChange={(checked) => setFormData({ ...formData, rememberMe: checked as boolean })}
                    />
                    <Label htmlFor="remember" className="text-sm cursor-pointer text-gray-300">تذكرني</Label>
                  </div>
                  <Button variant="link" className="text-sm p-0 h-auto text-blue-400">نسيت كلمة المرور؟</Button>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 btn-shine bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-lg font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><Loader2 className="ml-2 w-5 h-5 animate-spin" />جاري تسجيل الدخول...</>
                  ) : (
                    <><Zap className="ml-2 w-5 h-5" />تسجيل الدخول</>
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0f172a] px-2 text-gray-500">أو</span></div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-orange-500/50 text-orange-400 hover:bg-orange-500/10 gap-2"
                onClick={() => { window.location.href = '/api/login'; }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4.5a3 3 0 110 6 3 3 0 010-6zm0 15.75a9 9 0 01-7.5-4.02c.037-2.484 5.003-3.855 7.5-3.855 2.49 0 7.463 1.371 7.5 3.855A9 9 0 0112 20.25z"/>
                </svg>
                تسجيل الدخول بـ Replit
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0f172a] px-2 text-gray-500">أو</span></div>
              </div>

              <Button variant="outline" className="w-full h-12 border-green-500/50 text-green-400 hover:bg-green-500/10" onClick={handleWhatsApp}>
                <MessageCircle className="ml-2 w-5 h-5" />تواصل معنا على واتساب
              </Button>
            </CardContent>
          </Card>

         <div className="mt-8 flex justify-center gap-6">
            {[{ icon: Lock, label: 'AES-256' }, { icon: Shield, label: 'آمن 100%' }, { icon: Headphones, label: 'دعم 24/7' }].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 text-gray-400">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center"><item.icon className="w-5 h-5" /></div>
                <span className="text-xs">{item.label}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
