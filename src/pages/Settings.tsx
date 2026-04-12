import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Settings as SettingsIcon, Save, User, Bell, 
  Shield, Wifi, Building, Globe,
  CheckCircle2, Eye, EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithAuth } from '@/services/api';

export default function Settings() {
  const navigate = useNavigate();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    address: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [systemSettings, setSystemSettings] = useState({
    defaultVoucherDuration: '24',
    defaultVoucherPrice: '5',
    autoRefreshInterval: '30',
    language: 'ar',
    timezone: 'Africa/Cairo',
  });

  const [notifications, setNotifications] = useState({
    deviceOffline: true,
    lowVouchers: true,
    newLogin: true,
  });

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: (user as any).phone || '',
        companyName: (user as any).companyName || '',
        address: (user as any).address || '',
      });
    }
    loadSystemSettings();
  }, [isAuthenticated, user, navigate]);

  const loadSystemSettings = async () => {
    const result = await fetchWithAuth<any>('/api/settings');
    if (result.success && result.data) {
      if (result.data.system) setSystemSettings(prev => ({ ...prev, ...result.data.system }));
      if (result.data.notifications) setNotifications(prev => ({ ...prev, ...result.data.notifications }));
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    const result = await fetchWithAuth<any>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
    setSaving(false);
    if (result.success) {
      await refreshUser();
      toast.success('تم حفظ بيانات الملف الشخصي');
    } else {
      toast.error(result.error || 'فشل الحفظ');
    }
  };

  const savePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('كلمة المرور الجديدة غير متطابقة');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    setSaving(true);
    const result = await fetchWithAuth<any>('/api/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }),
    });
    setSaving(false);
    if (result.success) {
      toast.success('تم تغيير كلمة المرور بنجاح');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      toast.error(result.error || 'فشل تغيير كلمة المرور');
    }
  };

  const saveSystemSettings = async () => {
    setSaving(true);
    const result = await fetchWithAuth<any>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({ system: systemSettings, notifications }),
    });
    setSaving(false);
    if (result.success) {
      toast.success('تم حفظ إعدادات النظام');
    } else {
      toast.error('فشل حفظ الإعدادات');
    }
  };

  if (!isAuthenticated) return null;

  return (
    <Layout title="الإعدادات">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Profile */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="w-4.5 h-4.5 text-blue-500" />
              الملف الشخصي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>الاسم الكامل</Label>
                <Input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} placeholder="أدخل اسمك" />
              </div>
              <div>
                <Label>البريد الإلكتروني</Label>
                <Input value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} placeholder="example@email.com" dir="ltr" />
              </div>
              <div>
                <Label>رقم الهاتف</Label>
                <Input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} placeholder="+20 xxx xxxx xxxx" dir="ltr" />
              </div>
              <div>
                <Label>اسم الشركة</Label>
                <Input value={profile.companyName} onChange={e => setProfile({ ...profile, companyName: e.target.value })} placeholder="اسم شركتك" />
              </div>
              <div className="sm:col-span-2">
                <Label>العنوان</Label>
                <Input value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })} placeholder="عنوان الشركة أو المكتب" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={saveProfile} disabled={saving}>
                <Save className="w-4 h-4 ml-2" />
                حفظ الملف الشخصي
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="w-4.5 h-4.5 text-red-500" />
              تغيير كلمة المرور
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>كلمة المرور الحالية</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    dir="ltr"
                  />
                </div>
              </div>
              <div>
                <Label>كلمة المرور الجديدة</Label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  dir="ltr"
                />
              </div>
              <div>
                <Label>تأكيد كلمة المرور</Label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  dir="ltr"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showPassword ? 'إخفاء' : 'إظهار'} كلمة المرور
              </button>
              <Button onClick={savePassword} disabled={saving} variant="destructive">
                <Shield className="w-4 h-4 ml-2" />
                تغيير كلمة المرور
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wifi className="w-4.5 h-4.5 text-purple-500" />
              إعدادات النظام
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>مدة القسيمة الافتراضية (بالساعات)</Label>
                <Input
                  type="number"
                  value={systemSettings.defaultVoucherDuration}
                  onChange={e => setSystemSettings({ ...systemSettings, defaultVoucherDuration: e.target.value })}
                />
              </div>
              <div>
                <Label>سعر القسيمة الافتراضي ($)</Label>
                <Input
                  type="number"
                  value={systemSettings.defaultVoucherPrice}
                  onChange={e => setSystemSettings({ ...systemSettings, defaultVoucherPrice: e.target.value })}
                />
              </div>
              <div>
                <Label>فترة التحديث التلقائي (ثانية)</Label>
                <Input
                  type="number"
                  value={systemSettings.autoRefreshInterval}
                  onChange={e => setSystemSettings({ ...systemSettings, autoRefreshInterval: e.target.value })}
                />
              </div>
              <div>
                <Label>المنطقة الزمنية</Label>
                <select
                  value={systemSettings.timezone}
                  onChange={e => setSystemSettings({ ...systemSettings, timezone: e.target.value })}
                  className="w-full p-2 border rounded-md bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="Africa/Cairo">مصر (GMT+2)</option>
                  <option value="Asia/Riyadh">السعودية (GMT+3)</option>
                  <option value="Asia/Dubai">الإمارات (GMT+4)</option>
                  <option value="Africa/Algiers">الجزائر (GMT+1)</option>
                  <option value="Africa/Tunis">تونس (GMT+1)</option>
                  <option value="Africa/Tripoli">ليبيا (GMT+2)</option>
                </select>
              </div>
            </div>

            {/* Notifications */}
            <div className="pt-2 border-t">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Bell className="w-4 h-4 text-yellow-500" /> الإشعارات
              </p>
              <div className="space-y-2.5">
                {[
                  { key: 'deviceOffline', label: 'إشعار عند انقطاع الجهاز' },
                  { key: 'lowVouchers', label: 'إشعار عند نفاد القسائم' },
                  { key: 'newLogin', label: 'إشعار عند تسجيل دخول جديد' },
                ].map(item => (
                  <label key={item.key} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications[item.key as keyof typeof notifications]}
                      onChange={e => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={saveSystemSettings} disabled={saving}>
                <Save className="w-4 h-4 ml-2" />
                حفظ الإعدادات
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 border-blue-100 dark:border-gray-700">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <SettingsIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold">سيرا سوفت ويرز برو</p>
                <p className="text-xs text-gray-500">Sira Software Pro v2.0.0</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { icon: CheckCircle2, label: 'الحالة', value: 'يعمل', color: 'text-green-600' },
                { icon: Globe, label: 'الإصدار', value: '2.0.0', color: 'text-blue-600' },
                { icon: Building, label: 'الخطة', value: user?.subscriptionPlan || 'enterprise', color: 'text-purple-600' },
              ].map(item => (
                <div key={item.label} className="p-3 bg-white/70 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                  <p className={`text-sm font-semibold ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
}
