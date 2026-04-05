# Sira Software Pro

<div align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind-4.0-06B6D4?logo=tailwindcss" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License">
</div>

<p align="center">
  <strong>منصة احترافية لإدارة الشبكات وأجهزة الميكروتيك وأجهزة البصمة وكاميرات DVR</strong>
</p>

<p align="center">
  <a href="#features">المميزات</a> •
  <a href="#screenshots">لقطات الشاشة</a> •
  <a href="#installation">التثبيت</a> •
  <a href="#usage">الاستخدام</a> •
  <a href="#api">API</a>
</p>

---

## 🚀 المميزات

### إدارة الشبكات
- ✅ إدارة أجهزة MikroTik Router
- ✅ مراقبة حالة الراوترات (متصل/غير متصل/صيانة)
- ✅ إدارة إعدادات الاتصال (IP، منفذ API، بيانات الدخول)

### إدارة القسائم (Vouchers)
- ✅ إنشاء قسائم هوت سبوت بكميات كبيرة
- ✅ تخصيص المدة وحد البيانات وحد السرعة
- ✅ تتبع القسائم المستخدمة وغير المستخدمة
- ✅ حساب الإيرادات

### أجهزة البصمة
- ✅ إدارة أجهزة البصمة (ZKTeco وغيرها)
- ✅ مراقبة حالة الأجهزة
- ✅ تتبع عدد المستخدمين المسجلين
- ✅ تسجيل مواقع الأجهزة

### كاميرات DVR
- ✅ إدارة كاميرات المراقبة
- ✅ دعم multiple channels
- ✅ تسجيل بيانات الاتصال (IP، منفذ، بيانات الدخول)
- ✅ روابط البث المباشر (Stream URL)

### تصميم وطباعة الكروت
- ✅ 5 قوالب جاهزة للطباعة
- ✅ تخصيص الألوان والخطوط
- ✅ إضافة QR Code
- ✅ إضافة الشعار
- ✅ معاينة الكرت قبل الطباعة

### صفحات الهوت سبوت
- ✅ تصميم صفحات تسجيل الدخول المخصصة
- ✅ خلفيات قابلة للتخصيص
- ✅ حقول متعددة (كود القسيمة، رقم الهاتف)
- ✅ معاينة مباشرة للتصميم

### الخلفيات
- ✅ مكتبة خلفيات منظمة حسب الفئة
- ✅ دعم فئات: مقاهي، مطاعم، فنادق، شركات، مجمعات
- ✅ تعيين خلفية افتراضية

---

## 📸 لقطات الشاشة

### لوحة التحكم
<p align="center">
  <img src="screenshots/dashboard.png" alt="Dashboard" width="800">
</p>

### إدارة الراوترات
<p align="center">
  <img src="screenshots/routers.png" alt="Routers" width="800">
</p>

### إدارة القسائم
<p align="center">
  <img src="screenshots/vouchers.png" alt="Vouchers" width="800">
</p>

---

## 📦 التثبيت

### المتطلبات
- Node.js 18+
- npm أو yarn

### خطوات التثبيت

```bash
# استنساخ المستودع
git clone https://github.com/yourusername/sira-software-pro.git
cd sira-software-pro

# تثبيت التبعيات
npm install

# تشغيل في وضع التطوير
npm run dev

# بناء للإنتاج
npm run build
```

---

## 🎯 الاستخدام

### بيانات تسجيل الدخول الافتراضية
- **البريد الإلكتروني:** `admin@sira.software`
- **كلمة المرور:** `admin123`

### المسارات المتاحة
| المسار | الوصف |
|--------|-------|
| `/login` | صفحة تسجيل الدخول |
| `/dashboard` | لوحة التحكم الرئيسية |
| `/routers` | إدارة الراوترات |
| `/vouchers` | إدارة القسائم |
| `/fingerprint` | إدارة أجهزة البصمة |
| `/dvr` | إدارة كاميرات DVR |
| `/backgrounds` | إدارة الخلفيات |
| `/print-cards` | تصميم كروت الطباعة |
| `/hotspot-pages` | تصميم صفحات الهوت سبوت |

---

## 🔧 التقنيات المستخدمة

### Frontend
- **React 19** - إطار عمل واجهة المستخدم
- **TypeScript** - لغة البرمجة
- **Vite** - أداة البناء
- **Tailwind CSS 4** - إطار عمل CSS
- **shadcn/ui** - مكونات واجهة المستخدم
- **Lucide React** - الأيقونات
- **React Router** - التوجيه

### Backend (محلي)
- **localStorage API** - تخزين البيانات محلياً
- لا يحتاج إلى خادم خارجي

---

## 📁 هيكل المشروع

```
sira-software-pro/
├── public/                 # الملفات الثابتة
├── src/
│   ├── components/         # المكونات المشتركة
│   │   └── ui/            # مكونات shadcn/ui
│   ├── contexts/          # سياقات React
│   │   └── AuthContext.tsx
│   ├── pages/             # صفحات التطبيق
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Routers.tsx
│   │   ├── Vouchers.tsx
│   │   ├── FingerprintDevices.tsx
│   │   ├── DVRCameras.tsx
│   │   ├── Backgrounds.tsx
│   │   ├── PrintCards.tsx
│   │   └── HotspotPages.tsx
│   ├── services/          # خدمات API
│   │   └── localApi.ts
│   ├── types/             # أنواع TypeScript
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.ts
```

---

## 🔌 API محلي

يستخدم التطبيق localStorage كقاعدة بيانات محلية. المفاتيح المستخدمة:

| المفتاح | الوصف |
|---------|-------|
| `sira_users` | بيانات المستخدمين |
| `sira_current_user` | المستخدم الحالي |
| `sira_routers` | بيانات الراوترات |
| `sira_vouchers` | بيانات القسائم |
| `sira_fingerprint_devices` | أجهزة البصمة |
| `sira_dvr_cameras` | كاميرات DVR |
| `sira_backgrounds` | الخلفيات |
| `sira_print_cards` | كروت الطباعة |
| `sira_hotspot_pages` | صفحات الهوت سبوت |
| `sira_activity_logs` | سجل النشاطات |

---

## 🤝 المساهمة

نرحب بمساهماتكم! يمكنكم المساهمة من خلال:

1. عمل Fork للمشروع
2. إنشاء فرع جديد (`git checkout -b feature/amazing-feature`)
3. عمل Commit للتغييرات (`git commit -m 'Add amazing feature'`)
4. رفع الفرع (`git push origin feature/amazing-feature`)
5. فتح Pull Request

---

## 📝 الترخيص

هذا المشروع مرخص بموجب [MIT License](LICENSE).

---

## 👨‍💻 المطور

**Sira Software** - [موقعنا](https://sira.software)

---

<p align="center">
  صنع بـ ❤️ في مصر
</p>
