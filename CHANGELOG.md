# 📋 سجل التغييرات

جميع التغييرات المهمة في هذا المشروع سيتم تسجيلها في هذا الملف.

## [2.0.0] - 2024-12-01

### 🎉 الإصدار الرئيسي

#### ✨ المميزات الجديدة
- 🔐 نظام مصادقة كامل مع JWT
- 📡 إدارة الراوترات (إضافة، تعديل، حذف، مراقبة)
- 🎫 إدارة القسائم (إنشاء، تصدير، إرسال واتساب)
- 🖼️ إدارة الخلفيات (خلفيات مخصصة للكافيهات والمطاعم)
- 💳 كروت الطباعة (تصميم وطباعة كروت قسائم احترافية)
- 🌐 صفحات الهوت سبوت (صفحات تسجيل دخول مخصصة)
- 📊 لوحة تحكم مع إحصائيات مباشرة
- 🌍 دعم كامل للغة العربية (RTL)
- 📱 تصميم متجاوب مع جميع الأجهزة
- 🔒 أمان عالي مع تشفير Bcrypt

#### 🛠️ التقنيات المستخدمة
- React 19 + TypeScript
- Tailwind CSS + shadcn/ui
- Node.js + Express
- LowDB (JSON Database)
- JWT Authentication

#### 📄 الصفحات
- صفحة تسجيل الدخول مع تأثيرات بصرية
- لوحة التحكم مع إحصائيات
- صفحة إدارة الراوترات
- صفحة إدارة القسائم
- صفحة إدارة الخلفيات
- صفحة كروت الطباعة
- صفحة إدارة صفحات الهوت سبوت

#### 🔌 API Endpoints
- POST /api/auth/login
- POST /api/auth/register
- GET /api/auth/me
- GET /api/dashboard
- GET /api/routers
- POST /api/routers
- PUT /api/routers/:id
- DELETE /api/routers/:id
- GET /api/vouchers
- POST /api/vouchers
- PUT /api/vouchers/:id/use
- DELETE /api/vouchers/:id
- GET /api/backgrounds
- POST /api/backgrounds
- PUT /api/backgrounds/:id
- DELETE /api/backgrounds/:id
- GET /api/print-cards
- POST /api/print-cards
- PUT /api/print-cards/:id/print
- DELETE /api/print-cards/:id
- GET /api/hotspot-pages
- POST /api/hotspot-pages
- PUT /api/hotspot-pages/:id
- DELETE /api/hotspot-pages/:id
- GET /api/activity

---

## قالب التحديثات المستقبلية

### [x.x.x] - YYYY-MM-DD

#### ✨ مضاف
- ميزة جديدة

#### 🐛 مُصلح
- إصلاح خطأ

#### 🔄 مُحسّن
- تحسين أداء

#### ⚠️ مُهمل
- ميزة تم إهمالها

#### 🗑️ مُزال
- ميزة تمت إزالتها
