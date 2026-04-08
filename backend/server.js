import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import { RouterOSAPI } from 'node-routeros'
import MikroTikManager from './mikrotik-api.js'
import FingerprintManager from './fingerprint-api.js'
import DVRManager from './dvr-api.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000
const JWT_SECRET = process.env.JWT_SECRET || 'sira-pro-secret-key-2024'

// Middleware
app.use(cors({ origin: '*', credentials: true }))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true }))

// Serve static files from the 'dist' or 'public' directory (Vite build output)
const distPath = join(__dirname, '../dist')
const publicPath = join(__dirname, '../public')

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  console.log(`✅ Serving static files from: ${distPath}`)
} else if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath))
  console.log(`✅ Serving static files from: ${publicPath}`)
} else {
  console.log('⚠️ Frontend directory not found, static files not served')
}

// Database
let db = { 
  users: [], 
  routers: [], 
  vouchers: [], 
  backgrounds: [], 
  printCards: [], 
  hotspotPages: [],
  activityLogs: [],
  fingerprintDevices: [],
  dvrCameras: [],
  settings: {}
}
const dbPath = join(__dirname, 'db.json')

// Load Database
try {
  if (fs.existsSync(dbPath)) {
    db = JSON.parse(fs.readFileSync(dbPath, 'utf8'))
    console.log('✅ Database loaded successfully')
  }
} catch (e) {
  console.log('📝 Starting with fresh database')
}

// Save Database
const saveDB = () => {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))
  } catch (e) {
    console.error('❌ Failed to save database:', e.message)
  }
}

// Activity Logger
const logActivity = (userId, action, details = {}) => {
  const log = {
    id: uuidv4(),
    userId,
    action,
    details,
    timestamp: new Date().toISOString()
  }
  db.activityLogs.unshift(log)
  if (db.activityLogs.length > 1000) db.activityLogs.pop()
  saveDB()
}

// Initialize Admin
const initAdmin = async () => {
  const exists = db.users.find(u => u.email === 'admin@sira.software')
  if (!exists) {
    const hash = await bcrypt.hash('admin123', 12)
    db.users.push({
      id: uuidv4(),
      email: 'admin@sira.software',
      password: hash,
      name: 'المشرف',
      role: 'admin',
      avatar: '',
      subscriptionPlan: 'enterprise',
      subscriptionStatus: 'active',
      subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      companyName: 'Sira Software',
      phone: '+201065063147',
      address: 'Cairo, Egypt',
      createdAt: new Date().toISOString(),
      lastLogin: null,
      isActive: true
    })
    saveDB()
    console.log('✅ Admin created: admin@sira.software / admin123')
  }
}
await initAdmin()

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required', success: false })
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token', success: false })
    }
    req.user = user
    next()
  })
}

// Admin Middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required', success: false })
  }
  next()
}

// Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message)
  res.status(500).json({ error: 'Internal server error', success: false })
})

// ==================== ROUTES ====================

// Health Check
app.get('/', (req, res) => {
  res.json({
    name: 'Sira Software Pro API',
    version: '2.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      dashboard: '/api/dashboard',
      routers: '/api/routers',
      vouchers: '/api/vouchers',
      backgrounds: '/api/backgrounds',
      printCards: '/api/print-cards',
      hotspotPages: '/api/hotspot-pages',
      activity: '/api/activity',
      settings: '/api/settings'
    }
  })
})

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    version: '2.0.0'
  })
})

// ==================== AUTH ====================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required', success: false })
    }
    
    const user = db.users.find(u => u.email === email && u.isActive !== false)
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials', success: false })
    }
    
    const validPassword = await bcrypt.compare(password, user.password)
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials', success: false })
    }
    
    // Update last login
    user.lastLogin = new Date().toISOString()
    saveDB()
    
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        name: user.name 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    
    logActivity(user.id, 'LOGIN', { email: user.email })
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          companyName: user.companyName,
          subscriptionPlan: user.subscriptionPlan,
          subscriptionStatus: user.subscriptionStatus
        }
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Server error during login', success: false })
  }
})

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, companyName, phone } = req.body
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Required fields missing', success: false })
    }
    
    const exists = db.users.find(u => u.email === email)
    if (exists) {
      return res.status(400).json({ error: 'User already exists', success: false })
    }
    
    const hash = await bcrypt.hash(password, 12)
    const user = {
      id: uuidv4(),
      email,
      password: hash,
      name,
      role: 'user',
      avatar: '',
      companyName: companyName || '',
      phone: phone || '',
      subscriptionPlan: 'starter',
      subscriptionStatus: 'active',
      subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      lastLogin: null,
      isActive: true
    }
    
    db.users.push(user)
    saveDB()
    
    logActivity(user.id, 'REGISTER', { email })
    
    res.json({ success: true, message: 'User registered successfully' })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Server error during registration', success: false })
  }
})

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = db.users.find(u => u.id === req.user.id)
  if (!user) {
    return res.status(404).json({ error: 'User not found', success: false })
  }
  
  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      companyName: user.companyName,
      phone: user.phone,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionExpiry: user.subscriptionExpiry
    }
  })
})

// ==================== DASHBOARD ====================

app.get('/api/dashboard', authenticateToken, (req, res) => {
  const userRouters = db.routers.filter(r => r.companyId === req.user.id)
  const userVouchers = db.vouchers.filter(v => v.companyId === req.user.id)
  const userBackgrounds = db.backgrounds.filter(b => b.companyId === req.user.id)
  const userPrintCards = db.printCards.filter(c => c.companyId === req.user.id)
  const userHotspotPages = db.hotspotPages.filter(p => p.companyId === req.user.id)
  const userLogs = db.activityLogs.filter(l => l.userId === req.user.id).slice(0, 10)
  
  // Calculate revenue by month
  const now = new Date()
  const monthlyRevenue = []
  for (let i = 5; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthVouchers = userVouchers.filter(v => {
      const vDate = new Date(v.createdAt)
      return vDate.getMonth() === month.getMonth() && vDate.getFullYear() === month.getFullYear()
    })
    monthlyRevenue.push({
      month: month.toLocaleString('ar-EG', { month: 'short' }),
      revenue: monthVouchers.filter(v => v.isUsed).reduce((sum, v) => sum + (v.price || 0), 0),
      count: monthVouchers.length
    })
  }
  
  const stats = {
    totalRouters: userRouters.length,
    activeRouters: userRouters.filter(r => r.status === 'online').length,
    totalVouchers: userVouchers.length,
    usedVouchers: userVouchers.filter(v => v.isUsed).length,
    unusedVouchers: userVouchers.filter(v => !v.isUsed).length,
    revenue: userVouchers.filter(v => v.isUsed).reduce((sum, v) => sum + (v.price || 0), 0),
    totalBackgrounds: userBackgrounds.length,
    totalPrintCards: userPrintCards.length,
    totalHotspotPages: userHotspotPages.length,
    activeHotspotPages: userHotspotPages.filter(p => p.isActive).length,
    monthlyRevenue,
    recentActivity: userLogs,
    systemHealth: {
      status: 'excellent',
      uptime: process.uptime(),
      lastBackup: new Date().toISOString()
    }
  }
  
  res.json({ success: true, data: stats })
})

// ==================== ROUTERS ====================

app.get('/api/routers', authenticateToken, (req, res) => {
  const userRouters = db.routers.filter(r => r.companyId === req.user.id)
  res.json({ success: true, data: userRouters })
})

// مسار الاتصال المباشر بالميكروتيك - (تم التحديث للمكتبة الجديدة node-routeros)
app.post('/api/routers/live-stats', authenticateToken, async (req, res) => {
  const { ipAddress, port, username, password } = req.body;

  if (!ipAddress || !username) {
    return res.status(400).json({ 
      error: 'البيانات غير مكتملة للاتصال بالراوتر',
      success: false 
    });
  }

  try {
    const conn = new RouterOSAPI({
      host: ipAddress,
      user: username,
      password: password || '',
      port: port || 8728,
      timeout: 5
    });

    await conn.connect();

    // جلب البيانات باستخدام أوامر الميكروتيك الفعلية للمكتبة الجديدة
    const hotspotUsers = await conn.write('/ip/hotspot/active/print');
    const pppoeUsers = await conn.write('/ppp/active/print');
    const resources = await conn.write('/system/resource/print');

    conn.close();

    res.json({
      success: true,
      data: {
        hotspotActiveCount: hotspotUsers.length || 0,
        pppoeActiveCount: pppoeUsers.length || 0,
        cpuLoad: resources[0] && resources[0]['cpu-load'] ? `${resources[0]['cpu-load']}%` : '0%',
      }
    });

  } catch (error) {
    console.error("MikroTik Connection Error:", error.message);
    res.status(500).json({ 
      error: 'فشل الاتصال بالراوتر، تأكد من صحة الـ IP وتفعيل الـ API في الراوتر.',
      success: false 
    });
  }
});

app.post('/api/routers', authenticateToken, async (req, res) => {
  try {
    const { name, ipAddress, macAddress, status, location, username, password, port } = req.body
    
    if (!name) {
      return res.status(400).json({ error: 'Router name required', success: false })
    }
    
    const router = {
      id: uuidv4(),
      name,
      ipAddress: ipAddress || '',
      macAddress: macAddress || '',
      status: status || 'offline',
      location: location || '',
      username: username || 'admin',
      password: password || '',
      port: port || 8728,
      companyId: req.user.id,
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    db.routers.push(router)
    saveDB()
    
    logActivity(req.user.id, 'ROUTER_CREATED', { routerId: router.id, name })
    
    res.json({ success: true, message: 'Router added successfully', data: router })
  } catch (error) {
    res.status(500).json({ error: 'Failed to add router', success: false })
  }
})

app.put('/api/routers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const routerIndex = db.routers.findIndex(r => r.id === id && r.companyId === req.user.id)
    
    if (routerIndex === -1) {
      return res.status(404).json({ error: 'Router not found', success: false })
    }
    
    const allowedFields = ['name', 'ipAddress', 'macAddress', 'status', 'location', 'username', 'password', 'port']
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        db.routers[routerIndex][field] = req.body[field]
      }
    })
    
    db.routers[routerIndex].updatedAt = new Date().toISOString()
    saveDB()
    
    logActivity(req.user.id, 'ROUTER_UPDATED', { routerId: id })
    
    res.json({ success: true, message: 'Router updated', data: db.routers[routerIndex] })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update router', success: false })
  }
})

app.delete('/api/routers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const routerIndex = db.routers.findIndex(r => r.id === id && r.companyId === req.user.id)
    
    if (routerIndex === -1) {
      return res.status(404).json({ error: 'Router not found', success: false })
    }
    
    db.routers.splice(routerIndex, 1)
    saveDB()
    
    logActivity(req.user.id, 'ROUTER_DELETED', { routerId: id })
    
    res.json({ success: true, message: 'Router deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete router', success: false })
  }
})

// ==================== VOUCHERS ====================

app.get('/api/vouchers', authenticateToken, (req, res) => {
  const userVouchers = db.vouchers.filter(v => v.companyId === req.user.id)
  res.json({ success: true, data: userVouchers })
})

app.post('/api/vouchers', authenticateToken, async (req, res) => {
  try {
    const { code, duration, dataLimit, speedLimit, price, quantity } = req.body
    
    if (!code) {
      return res.status(400).json({ error: 'Voucher code required', success: false })
    }
    
    const vouchers = []
    const qty = quantity || 1
    
    for (let i = 0; i < qty; i++) {
      const voucherCode = quantity > 1 ? `${code}-${String(i + 1).padStart(3, '0')}` : code
      
      const exists = db.vouchers.find(v => v.code === voucherCode)
      if (exists) continue
      
      const voucher = {
        id: uuidv4(),
        code: voucherCode,
        duration: duration || 0,
        dataLimit: dataLimit || 0,
        speedLimit: speedLimit || '',
        price: price || 0,
        isUsed: false,
        usedBy: '',
        usedAt: null,
        companyId: req.user.id,
        createdAt: new Date().toISOString(),
        expiresAt: duration ? new Date(Date.now() + (duration * 24 * 60 * 60 * 1000)).toISOString() : null
      }
      vouchers.push(voucher)
    }
    
    db.vouchers.push(...vouchers)
    saveDB()
    
    logActivity(req.user.id, 'VOUCHERS_CREATED', { count: vouchers.length })
    
    res.json({ 
      success: true, 
      message: `Created ${vouchers.length} voucher(s)`,
      data: vouchers.length === 1 ? vouchers[0] : vouchers
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create voucher', success: false })
  }
})

app.put('/api/vouchers/:id/use', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { usedBy } = req.body
    
    const voucherIndex = db.vouchers.findIndex(v => v.id === id && v.companyId === req.user.id)
    
    if (voucherIndex === -1) {
      return res.status(404).json({ error: 'Voucher not found', success: false })
    }
    
    if (db.vouchers[voucherIndex].isUsed) {
      return res.status(400).json({ error: 'Voucher already used', success: false })
    }
    
    db.vouchers[voucherIndex].isUsed = true
    db.vouchers[voucherIndex].usedBy = usedBy || ''
    db.vouchers[voucherIndex].usedAt = new Date().toISOString()
    saveDB()
    
    logActivity(req.user.id, 'VOUCHER_USED', { voucherId: id, code: db.vouchers[voucherIndex].code })
    
    res.json({ success: true, message: 'Voucher marked as used' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to use voucher', success: false })
  }
})

app.delete('/api/vouchers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const voucherIndex = db.vouchers.findIndex(v => v.id === id && v.companyId === req.user.id)
    
    if (voucherIndex === -1) {
      return res.status(404).json({ error: 'Voucher not found', success: false })
    }
    
    db.vouchers.splice(voucherIndex, 1)
    saveDB()
    
    logActivity(req.user.id, 'VOUCHER_DELETED', { voucherId: id })
    
    res.json({ success: true, message: 'Voucher deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete voucher', success: false })
  }
})

// ==================== BACKGROUNDS ====================

app.get('/api/backgrounds', authenticateToken, (req, res) => {
  const userBackgrounds = db.backgrounds.filter(b => b.companyId === req.user.id)
  res.json({ success: true, data: userBackgrounds })
})

app.post('/api/backgrounds', authenticateToken, async (req, res) => {
  try {
    const { name, imageUrl, category, isDefault } = req.body
    
    if (!name || !imageUrl) {
      return res.status(400).json({ error: 'Name and image URL required', success: false })
    }
    
    const background = {
      id: uuidv4(),
      name,
      imageUrl,
      category: category || 'general',
      isDefault: isDefault || false,
      companyId: req.user.id,
      createdAt: new Date().toISOString()
    }
    
    db.backgrounds.push(background)
    saveDB()
    
    logActivity(req.user.id, 'BACKGROUND_CREATED', { backgroundId: background.id })
    
    res.json({ success: true, message: 'Background added', data: background })
  } catch (error) {
    res.status(500).json({ error: 'Failed to add background', success: false })
  }
})

app.put('/api/backgrounds/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const bgIndex = db.backgrounds.findIndex(b => b.id === id && b.companyId === req.user.id)
    
    if (bgIndex === -1) {
      return res.status(404).json({ error: 'Background not found', success: false })
    }
    
    const allowedFields = ['name', 'imageUrl', 'category', 'isDefault']
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        db.backgrounds[bgIndex][field] = req.body[field]
      }
    })
    
    db.backgrounds[bgIndex].updatedAt = new Date().toISOString()
    saveDB()
    
    res.json({ success: true, message: 'Background updated', data: db.backgrounds[bgIndex] })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update background', success: false })
  }
})

app.delete('/api/backgrounds/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const bgIndex = db.backgrounds.findIndex(b => b.id === id && b.companyId === req.user.id)
    
    if (bgIndex === -1) {
      return res.status(404).json({ error: 'Background not found', success: false })
    }
    
    db.backgrounds.splice(bgIndex, 1)
    saveDB()
    
    res.json({ success: true, message: 'Background deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete background', success: false })
  }
})

// ==================== PRINT CARDS ====================

app.get('/api/print-cards', authenticateToken, (req, res) => {
  const userCards = db.printCards.filter(c => c.companyId === req.user.id)
  res.json({ success: true, data: userCards })
})

app.post('/api/print-cards', authenticateToken, async (req, res) => {
  try {
    const { title, template, voucherCode, duration, dataLimit, speedLimit, price,
            logoUrl, primaryColor, secondaryColor, fontFamily, showLogo, showQR, notes } = req.body
    
    if (!title || !template) {
      return res.status(400).json({ error: 'Title and template required', success: false })
    }
    
    const printCard = {
      id: uuidv4(),
      title,
      template,
      voucherCode: voucherCode || '',
      duration: duration || 0,
      dataLimit: dataLimit || 0,
      speedLimit: speedLimit || '',
      price: price || 0,
      logoUrl: logoUrl || '',
      primaryColor: primaryColor || '#3b82f6',
      secondaryColor: secondaryColor || '#8b5cf6',
      fontFamily: fontFamily || 'Tajawal',
      showLogo: showLogo !== undefined ? showLogo : true,
      showQR: showQR !== undefined ? showQR : true,
      notes: notes || '',
      printCount: 0,
      companyId: req.user.id,
      createdAt: new Date().toISOString()
    }
    
    db.printCards.push(printCard)
    saveDB()
    
    res.json({ success: true, message: 'Print card created', data: printCard })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create print card', success: false })
  }
})

app.put('/api/print-cards/:id/print', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const cardIndex = db.printCards.findIndex(c => c.id === id && c.companyId === req.user.id)
    
    if (cardIndex === -1) {
      return res.status(404).json({ error: 'Print card not found', success: false })
    }
    
    db.printCards[cardIndex].printCount = (db.printCards[cardIndex].printCount || 0) + 1
    db.printCards[cardIndex].lastPrintedAt = new Date().toISOString()
    saveDB()
    
    res.json({ success: true, message: 'Print count updated', data: db.printCards[cardIndex] })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update print count', success: false })
  }
})

app.delete('/api/print-cards/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const cardIndex = db.printCards.findIndex(c => c.id === id && c.companyId === req.user.id)
    
    if (cardIndex === -1) {
      return res.status(404).json({ error: 'Print card not found', success: false })
    }
    
    db.printCards.splice(cardIndex, 1)
    saveDB()
    
    res.json({ success: true, message: 'Print card deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete print card', success: false })
  }
})

// ==================== HOTSPOT PAGES ====================

app.get('/api/hotspot-pages', authenticateToken, (req, res) => {
  const userPages = db.hotspotPages.filter(p => p.companyId === req.user.id)
  res.json({ success: true, data: userPages })
})

app.get('/api/hotspot-pages/:id/public', async (req, res) => {
  try {
    const { id } = req.params
    const page = db.hotspotPages.find(p => p.id === id && p.isActive)
    
    if (!page) {
      return res.status(404).json({ error: 'Page not found', success: false })
    }
    
    page.viewCount = (page.viewCount || 0) + 1
    page.lastViewedAt = new Date().toISOString()
    saveDB()
    
    res.json({ success: true, data: page })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get page', success: false })
  }
})

app.post('/api/hotspot-pages', authenticateToken, async (req, res) => {
  try {
    const { name, title, subtitle, backgroundImage, backgroundColor, logoUrl,
            welcomeMessage, instructions, termsText, showTerms, showLogo,
            showVoucherInput, showPhoneInput, primaryColor, secondaryColor,
            fontFamily, buttonText, footerText, isActive } = req.body
    
    if (!name || !title) {
      return res.status(400).json({ error: 'Name and title required', success: false })
    }
    
    const hotspotPage = {
      id: uuidv4(),
      name,
      title,
      subtitle: subtitle || '',
      backgroundImage: backgroundImage || '',
      backgroundColor: backgroundColor || '#0f172a',
      logoUrl: logoUrl || '',
      welcomeMessage: welcomeMessage || 'مرحباً بك في شبكتنا',
      instructions: instructions || 'أدخل كود القسيمة للاتصال',
      termsText: termsText || 'باستخدامك لهذه الخدمة، فإنك توافق على الشروط والأحكام',
      showTerms: showTerms !== undefined ? showTerms : true,
      showLogo: showLogo !== undefined ? showLogo : true,
      showVoucherInput: showVoucherInput !== undefined ? showVoucherInput : true,
      showPhoneInput: showPhoneInput !== undefined ? showPhoneInput : false,
      primaryColor: primaryColor || '#3b82f6',
      secondaryColor: secondaryColor || '#8b5cf6',
      fontFamily: fontFamily || 'Tajawal',
      buttonText: buttonText || 'اتصل الآن',
      footerText: footerText || '',
      isActive: isActive !== undefined ? isActive : true,
      viewCount: 0,
      companyId: req.user.id,
      createdAt: new Date().toISOString()
    }
    
    db.hotspotPages.push(hotspotPage)
    saveDB()
    
    res.json({ success: true, message: 'Hotspot page created', data: hotspotPage })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create hotspot page', success: false })
  }
})

app.put('/api/hotspot-pages/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const pageIndex = db.hotspotPages.findIndex(p => p.id === id && p.companyId === req.user.id)
    
    if (pageIndex === -1) {
      return res.status(404).json({ error: 'Hotspot page not found', success: false })
    }
    
    const allowedFields = ['name', 'title', 'subtitle', 'backgroundImage', 'backgroundColor',
      'logoUrl', 'welcomeMessage', 'instructions', 'termsText', 'showTerms', 'showLogo',
      'showVoucherInput', 'showPhoneInput', 'primaryColor', 'secondaryColor', 'fontFamily',
      'buttonText', 'footerText', 'isActive']
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        db.hotspotPages[pageIndex][field] = req.body[field]
      }
    })
    
    db.hotspotPages[pageIndex].updatedAt = new Date().toISOString()
    saveDB()
    
    res.json({ success: true, message: 'Hotspot page updated', data: db.hotspotPages[pageIndex] })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update hotspot page', success: false })
  }
})

app.delete('/api/hotspot-pages/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const pageIndex = db.hotspotPages.findIndex(p => p.id === id && p.companyId === req.user.id)
    
    if (pageIndex === -1) {
      return res.status(404).json({ error: 'Hotspot page not found', success: false })
    }
    
    db.hotspotPages.splice(pageIndex, 1)
    saveDB()
    
    res.json({ success: true, message: 'Hotspot page deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete hotspot page', success: false })
  }
})

// ==================== MIKROTIK LIVE STATS ====================

app.post('/api/routers/live-stats', authenticateToken, async (req, res) => {
  try {
    const { ipAddress, port, username, password } = req.body
    
    if (!ipAddress || !username) {
      return res.status(400).json({ 
        success: false, 
        error: 'Router IP address and username are required' 
      })
    }
    
    console.log(`📡 Fetching live stats from MikroTik: ${ipAddress}:${port || 8728}`)
    
    // Use MikroTik Manager to get live statistics
    const result = await MikroTikManager.getLiveStats(
      ipAddress,
      username,
      password || '',
      port || 8728
    )
    
    if (result.success) {
      console.log(`✅ Successfully fetched stats from ${ipAddress}`)
      res.json(result)
    } else {
      console.error(`❌ Failed to fetch stats from ${ipAddress}:`, result.error)
      res.status(500).json(result)
    }
  } catch (error) {
    console.error('❌ Error fetching MikroTik stats:', error)
    res.status(500).json({ 
      success: false, 
      error: `Server error: ${error.message}` 
    })
  }
})

// Test MikroTik connection
app.post('/api/routers/test-connection', authenticateToken, async (req, res) => {
  try {
    const { ipAddress, port, username, password } = req.body
    
    if (!ipAddress || !username) {
      return res.status(400).json({ 
        success: false, 
        error: 'Router IP address and username are required' 
      })
    }
    
    console.log(`🧪 Testing connection to MikroTik: ${ipAddress}:${port || 8728}`)
    
    const result = await MikroTikManager.testConnection(
      ipAddress,
      username,
      password || '',
      port || 8728
    )
    
    if (result.success) {
      console.log(`✅ Connection test successful for ${ipAddress}`)
      res.json(result)
    } else {
      console.error(`❌ Connection test failed for ${ipAddress}:`, result.error)
      res.status(400).json(result)
    }
  } catch (error) {
    console.error('❌ Error testing MikroTik connection:', error)
    res.status(500).json({ 
      success: false, 
      error: `Server error: ${error.message}` 
    })
  }
})

// Get router system information
app.post('/api/routers/system-info', authenticateToken, async (req, res) => {
  try {
    const { ipAddress, port, username, password } = req.body
    
    if (!ipAddress || !username) {
      return res.status(400).json({ 
        success: false, 
        error: 'Router IP address and username are required' 
      })
    }
    
    console.log(`ℹ️  Fetching system info from MikroTik: ${ipAddress}:${port || 8728}`)
    
    const result = await MikroTikManager.getSystemInfo(
      ipAddress,
      username,
      password || '',
      port || 8728
    )
    
    if (result.success) {
      console.log(`✅ Successfully fetched system info from ${ipAddress}`)
      res.json(result)
    } else {
      console.error(`❌ Failed to fetch system info from ${ipAddress}:`, result.error)
      res.status(500).json(result)
    }
  } catch (error) {
    console.error('❌ Error fetching MikroTik system info:', error)
    res.status(500).json({ 
      success: false, 
      error: `Server error: ${error.message}` 
    })
  }
})

// ==================== FINGERPRINT DEVICES ====================

app.get('/api/fingerprint', authenticateToken, (req, res) => {
  const userDevices = db.fingerprintDevices.filter(d => d.companyId === req.user.id)
  res.json({ success: true, data: userDevices })
})

app.post('/api/fingerprint', authenticateToken, async (req, res) => {
  try {
    const { name, ipAddress, port, model, serialNumber, location } = req.body
    const device = {
      id: uuidv4(),
      name,
      ipAddress,
      port: port || 4370,
      status: 'offline',
      model,
      serialNumber,
      location,
      totalUsers: 0,
      companyId: req.user.id,
      createdAt: new Date().toISOString()
    }
    db.fingerprintDevices.push(device)
    saveDB()
    res.json({ success: true, data: device })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create device', success: false })
  }
})

// ==================== FINGERPRINT DEVICES ====================

app.get('/api/fingerprint', authenticateToken, (req, res) => {
  const userDevices = db.fingerprintDevices.filter(d => d.companyId === req.user.id)
  res.json({ success: true, data: userDevices })
})

app.post('/api/fingerprint', authenticateToken, async (req, res) => {
  try {
    const { name, ipAddress, port, model, serialNumber, location } = req.body
    const device = {
      id: uuidv4(),
      name,
      ipAddress,
      port: port || 4370,
      status: 'offline',
      model,
      serialNumber,
      location,
      totalUsers: 0,
      companyId: req.user.id,
      createdAt: new Date().toISOString()
    }
    db.fingerprintDevices.push(device)
    saveDB()
    res.json({ success: true, data: device })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create device', success: false })
  }
})

// Test fingerprint device connection
app.post('/api/fingerprint/test-connection', authenticateToken, async (req, res) => {
  try {
    const { ipAddress, port } = req.body
    
    if (!ipAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Device IP address is required' 
      })
    }
    
    console.log(`🧪 Testing connection to fingerprint device: ${ipAddress}:${port || 4370}`)
    
    const result = await FingerprintManager.testConnection(
      ipAddress,
      port || 4370
    )
    
    if (result.success) {
      console.log(`✅ Connection test successful for fingerprint device ${ipAddress}`)
      res.json(result)
    } else {
      console.error(`❌ Connection test failed for fingerprint device ${ipAddress}:`, result.error)
      res.status(400).json(result)
    }
  } catch (error) {
    console.error('❌ Error testing fingerprint connection:', error)
    res.status(500).json({ 
      success: false, 
      error: `Server error: ${error.message}` 
    })
  }
})

// Get fingerprint device info
app.post('/api/fingerprint/device-info', authenticateToken, async (req, res) => {
  try {
    const { ipAddress, port } = req.body
    
    if (!ipAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Device IP address is required' 
      })
    }
    
    console.log(`ℹ️  Fetching device info from fingerprint device: ${ipAddress}:${port || 4370}`)
    
    const result = await FingerprintManager.getDeviceInfo(
      ipAddress,
      port || 4370
    )
    
    if (result.success) {
      console.log(`✅ Successfully fetched device info from ${ipAddress}`)
      res.json(result)
    } else {
      console.error(`❌ Failed to fetch device info from ${ipAddress}:`, result.error)
      res.status(500).json(result)
    }
  } catch (error) {
    console.error('❌ Error fetching fingerprint device info:', error)
    res.status(500).json({ 
      success: false, 
      error: `Server error: ${error.message}` 
    })
  }
})

// Get fingerprint device users
app.post('/api/fingerprint/users', authenticateToken, async (req, res) => {
  try {
    const { ipAddress, port } = req.body
    
    if (!ipAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Device IP address is required' 
      })
    }
    
    console.log(`👥 Fetching users from fingerprint device: ${ipAddress}:${port || 4370}`)
    
    const result = await FingerprintManager.getUsers(
      ipAddress,
      port || 4370
    )
    
    if (result.success) {
      console.log(`✅ Successfully fetched users from ${ipAddress}`)
      res.json(result)
    } else {
      console.error(`❌ Failed to fetch users from ${ipAddress}:`, result.error)
      res.status(500).json(result)
    }
  } catch (error) {
    console.error('❌ Error fetching fingerprint users:', error)
    res.status(500).json({ 
      success: false, 
      error: `Server error: ${error.message}` 
    })
  }
})

// Get fingerprint attendance records
app.post('/api/fingerprint/attendance', authenticateToken, async (req, res) => {
  try {
    const { ipAddress, port, startDate, endDate } = req.body
    
    if (!ipAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Device IP address is required' 
      })
    }
    
    console.log(`📋 Fetching attendance from fingerprint device: ${ipAddress}:${port || 4370}`)
    
    const result = await FingerprintManager.getAttendance(
      ipAddress,
      port || 4370,
      startDate,
      endDate
    )
    
    if (result.success) {
      console.log(`✅ Successfully fetched attendance from ${ipAddress}`)
      res.json(result)
    } else {
      console.error(`❌ Failed to fetch attendance from ${ipAddress}:`, result.error)
      res.status(500).json(result)
    }
  } catch (error) {
    console.error('❌ Error fetching fingerprint attendance:', error)
    res.status(500).json({ 
      success: false, 
      error: `Server error: ${error.message}` 
    })
  }
})

app.put('/api/fingerprint/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const index = db.fingerprintDevices.findIndex(d => d.id === id && d.companyId === req.user.id)
    if (index === -1) return res.status(404).json({ error: 'Device not found', success: false })
    db.fingerprintDevices[index] = { ...db.fingerprintDevices[index], ...req.body, updatedAt: new Date().toISOString() }
    saveDB()
    res.json({ success: true, data: db.fingerprintDevices[index] })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update device', success: false })
  }
})

app.delete('/api/fingerprint/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const index = db.fingerprintDevices.findIndex(d => d.id === id && d.companyId === req.user.id)
    if (index === -1) return res.status(404).json({ error: 'Device not found', success: false })
    db.fingerprintDevices.splice(index, 1)
    saveDB()
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete device', success: false })
  }
})

// ==================== DVR CAMERAS ====================

app.get('/api/dvr', authenticateToken, (req, res) => {
  const userCameras = db.dvrCameras.filter(c => c.companyId === req.user.id)
  res.json({ success: true, data: userCameras })
})

app.post('/api/dvr', authenticateToken, async (req, res) => {
  try {
    const { name, ipAddress, port, model, channel, username, password, location, streamUrl } = req.body
    const camera = {
      id: uuidv4(),
      name,
      ipAddress,
      port: port || 80,
      status: 'offline',
      model,
      channel: channel || 1,
      username: username || 'admin',
      password,
      location,
      streamUrl,
      companyId: req.user.id,
      createdAt: new Date().toISOString()
    }
    db.dvrCameras.push(camera)
    saveDB()
    res.json({ success: true, data: camera })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create camera', success: false })
  }
})

// ==================== DVR CAMERAS ====================

app.get('/api/dvr', authenticateToken, (req, res) => {
  const userCameras = db.dvrCameras.filter(c => c.companyId === req.user.id)
  res.json({ success: true, data: userCameras })
})

app.post('/api/dvr', authenticateToken, async (req, res) => {
  try {
    const { name, ipAddress, port, model, channel, username, password, location, streamUrl } = req.body
    const camera = {
      id: uuidv4(),
      name,
      ipAddress,
      port: port || 80,
      status: 'offline',
      model,
      channel: channel || 1,
      username: username || 'admin',
      password,
      location,
      streamUrl,
      companyId: req.user.id,
      createdAt: new Date().toISOString()
    }
    db.dvrCameras.push(camera)
    saveDB()
    res.json({ success: true, data: camera })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create camera', success: false })
  }
})

// Test DVR camera connection
app.post('/api/dvr/test-connection', authenticateToken, async (req, res) => {
  try {
    const { ipAddress, port, username, password, model } = req.body
    
    if (!ipAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Camera IP address is required' 
      })
    }
    
    // Test connection using DVRManager
    const testResult = await dvrManager.testConnection({
      ipAddress,
      port: port || 80,
      username: username || 'admin',
      password,
      model: model || 'Hikvision'
    })
    
    if (testResult) {
      res.json({ 
        success: true, 
        message: 'Connection successful',
        data: { status: 'online' }
      })
    } else {
      res.json({ 
        success: false, 
        error: 'Connection failed - Check IP, port, username and password',
        data: { status: 'offline' }
      })
    }
    
  } catch (error) {
    console.error('DVR connection test error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Connection test failed: ' + error.message 
    })
  }
})

// Get camera stream URL
app.post('/api/dvr/stream-url', authenticateToken, (req, res) => {
  try {
    const { cameraId, channel, quality } = req.body
    const camera = db.dvrCameras.find(c => c.id === cameraId && c.companyId === req.user.id)
    
    if (!camera) {
      return res.status(404).json({ 
        success: false, 
        error: 'Camera not found' 
      })
    }
    
    const streamUrl = dvrManager.getStreamUrl(camera, channel || 1, quality || 'main')
    
    res.json({ 
      success: true, 
      data: { streamUrl }
    })
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get stream URL: ' + error.message 
    })
  }
})

// Control PTZ (Pan, Tilt, Zoom)
app.post('/api/dvr/ptz-control', authenticateToken, async (req, res) => {
  try {
    const { cameraId, command, value } = req.body
    const camera = db.dvrCameras.find(c => c.id === cameraId && c.companyId === req.user.id)
    
    if (!camera) {
      return res.status(404).json({ 
        success: false, 
        error: 'Camera not found' 
      })
    }
    
    const result = await dvrManager.controlPTZ(cameraId, command, value)
    
    if (result.success) {
      res.json(result)
    } else {
      res.status(400).json(result)
    }
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'PTZ control failed: ' + error.message 
    })
  }
})

// Start recording
app.post('/api/dvr/start-recording', authenticateToken, async (req, res) => {
  try {
    const { cameraId, duration } = req.body
    const camera = db.dvrCameras.find(c => c.id === cameraId && c.companyId === req.user.id)
    
    if (!camera) {
      return res.status(404).json({ 
        success: false, 
        error: 'Camera not found' 
      })
    }
    
    const result = await dvrManager.startRecording(cameraId, duration || 3600)
    res.json(result)
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to start recording: ' + error.message 
    })
  }
})

// Stop recording
app.post('/api/dvr/stop-recording', authenticateToken, async (req, res) => {
  try {
    const { recordingId } = req.body
    const result = await dvrManager.stopRecording(recordingId)
    res.json(result)
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to stop recording: ' + error.message 
    })
  }
})

// Get camera statistics
app.get('/api/dvr/stats', authenticateToken, (req, res) => {
  try {
    const userCameras = db.dvrCameras.filter(c => c.companyId === req.user.id)
    const stats = {
      total: userCameras.length,
      online: userCameras.filter(c => c.status === 'online').length,
      offline: userCameras.filter(c => c.status === 'offline').length,
      recording: userCameras.filter(c => c.isRecording).length
    }
    
    stats.onlinePercentage = stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0
    
    res.json({ 
      success: true, 
      data: stats 
    })
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get stats: ' + error.message 
    })
  }
})
    
    console.log(`🧪 Testing connection to DVR camera: ${ipAddress}:${port || 80}`)
    
    const result = await DVRManager.testConnection(
      ipAddress,
      port || 80,
      username || 'admin',
      password || ''
    )
    
    if (result.success) {
      console.log(`✅ Connection test successful for DVR camera ${ipAddress}`)
      res.json(result)
    } else {
      console.error(`❌ Connection test failed for DVR camera ${ipAddress}:`, result.error)
      res.status(400).json(result)
    }
  } catch (error) {
    console.error('❌ Error testing DVR connection:', error)
    res.status(500).json({ 
      success: false, 
      error: `Server error: ${error.message}` 
    })
  }
})

// Get DVR camera info
app.post('/api/dvr/device-info', authenticateToken, async (req, res) => {
  try {
    const { ipAddress, port, username, password } = req.body
    
    if (!ipAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Camera IP address is required' 
      })
    }
    
    console.log(`ℹ️  Fetching device info from DVR camera: ${ipAddress}:${port || 80}`)
    
    const result = await DVRManager.getDeviceInfo(
      ipAddress,
      port || 80,
      username || 'admin',
      password || ''
    )
    
    if (result.success) {
      console.log(`✅ Successfully fetched device info from DVR camera ${ipAddress}`)
      res.json(result)
    } else {
      console.error(`❌ Failed to fetch device info from DVR camera ${ipAddress}:`, result.error)
      res.status(500).json(result)
    }
  } catch (error) {
    console.error('❌ Error fetching DVR device info:', error)
    res.status(500).json({ 
      success: false, 
      error: `Server error: ${error.message}` 
    })
  }
})

// Get DVR camera stream URL
app.post('/api/dvr/stream-url', authenticateToken, async (req, res) => {
  try {
    const { ipAddress, port, username, password, channel, protocol } = req.body
    
    if (!ipAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Camera IP address is required' 
      })
    }
    
    console.log(`📹 Generating stream URL for DVR camera: ${ipAddress}:${port || 80}`)
    
    const result = await DVRManager.getStreamUrl(
      ipAddress,
      port || 80,
      username || 'admin',
      password || '',
      channel || 1,
      protocol || 'rtsp'
    )
    
    if (result.success) {
      console.log(`✅ Successfully generated stream URL for DVR camera ${ipAddress}`)
      res.json(result)
    } else {
      console.error(`❌ Failed to generate stream URL for DVR camera ${ipAddress}:`, result.error)
      res.status(500).json(result)
    }
  } catch (error) {
    console.error('❌ Error generating DVR stream URL:', error)
    res.status(500).json({ 
      success: false, 
      error: `Server error: ${error.message}` 
    })
  }
})

// Get DVR camera snapshot
app.post('/api/dvr/snapshot', authenticateToken, async (req, res) => {
  try {
    const { ipAddress, port, username, password, channel } = req.body
    
    if (!ipAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Camera IP address is required' 
      })
    }
    
    console.log(`📸 Getting snapshot from DVR camera: ${ipAddress}:${port || 80}`)
    
    const result = await DVRManager.getSnapshot(
      ipAddress,
      port || 80,
      username || 'admin',
      password || '',
      channel || 1
    )
    
    if (result.success) {
      console.log(`✅ Successfully got snapshot from DVR camera ${ipAddress}`)
      res.json(result)
    } else {
      console.error(`❌ Failed to get snapshot from DVR camera ${ipAddress}:`, result.error)
      res.status(500).json(result)
    }
  } catch (error) {
    console.error('❌ Error getting DVR snapshot:', error)
    res.status(500).json({ 
      success: false, 
      error: `Server error: ${error.message}` 
    })
  }
})

// Control camera PTZ
app.post('/api/dvr/ptz-control', authenticateToken, async (req, res) => {
  try {
    const { ipAddress, port, username, password, channel, command } = req.body
    
    if (!ipAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Camera IP address is required' 
      })
    }
    
    console.log(`🎮 Controlling PTZ for DVR camera: ${ipAddress}:${port || 80}, Command: ${command || 'home'}`)
    
    const result = await DVRManager.controlPtz(
      ipAddress,
      port || 80,
      username || 'admin',
      password || '',
      channel || 1,
      command || 'home'
    )
    
    if (result.success) {
      console.log(`✅ Successfully controlled PTZ for DVR camera ${ipAddress}`)
      res.json(result)
    } else {
      console.error(`❌ Failed to control PTZ for DVR camera ${ipAddress}:`, result.error)
      res.status(500).json(result)
    }
  } catch (error) {
    console.error('❌ Error controlling DVR PTZ:', error)
    res.status(500).json({ 
      success: false, 
      error: `Server error: ${error.message}` 
    })
  }
})

// Get motion detection status
app.post('/api/dvr/motion-status', authenticateToken, async (req, res) => {
  try {
    const { ipAddress, port, username, password, channel } = req.body
    
    if (!ipAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Camera IP address is required' 
      })
    }
    
    console.log(`🚨 Getting motion status for DVR camera: ${ipAddress}:${port || 80}`)
    
    const result = await DVRManager.getMotionStatus(
      ipAddress,
      port || 80,
      username || 'admin',
      password || '',
      channel || 1
    )
    
    if (result.success) {
      console.log(`✅ Successfully got motion status for DVR camera ${ipAddress}`)
      res.json(result)
    } else {
      console.error(`❌ Failed to get motion status for DVR camera ${ipAddress}:`, result.error)
      res.status(500).json(result)
    }
  } catch (error) {
    console.error('❌ Error getting DVR motion status:', error)
    res.status(500).json({ 
      success: false, 
      error: `Server error: ${error.message}` 
    })
  }
})

// Get device logs
app.post('/api/dvr/device-logs', authenticateToken, async (req, res) => {
  try {
    const { ipAddress, port, username, password, limit } = req.body
    
    if (!ipAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Camera IP address is required' 
      })
    }
    
    console.log(`📋 Getting device logs for DVR camera: ${ipAddress}:${port || 80}`)
    
    const result = await DVRManager.getDeviceLogs(
      ipAddress,
      port || 80,
      username || 'admin',
      password || '',
      limit || 50
    )
    
    if (result.success) {
      console.log(`✅ Successfully got device logs for DVR camera ${ipAddress}`)
      res.json(result)
    } else {
      console.error(`❌ Failed to get device logs for DVR camera ${ipAddress}:`, result.error)
      res.status(500).json(result)
    }
  } catch (error) {
    console.error('❌ Error getting DVR device logs:', error)
    res.status(500).json({ 
      success: false, 
      error: `Server error: ${error.message}` 
    })
  }
})

app.put('/api/dvr/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const index = db.dvrCameras.findIndex(c => c.id === id && c.companyId === req.user.id)
    if (index === -1) return res.status(404).json({ error: 'Camera not found', success: false })
    db.dvrCameras[index] = { ...db.dvrCameras[index], ...req.body, updatedAt: new Date().toISOString() }
    saveDB()
    res.json({ success: true, data: db.dvrCameras[index] })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update camera', success: false })
  }
})

app.delete('/api/dvr/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const index = db.dvrCameras.findIndex(c => c.id === id && c.companyId === req.user.id)
    if (index === -1) return res.status(404).json({ error: 'Camera not found', success: false })
    db.dvrCameras.splice(index, 1)
    saveDB()
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete camera', success: false })
  }
})

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Sira Software Pro API is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    services: {
      mikrotik: 'enabled',
      fingerprint: 'enabled',
      database: 'connected'
    }
  })
})

// ==================== ACTIVITY LOGS ====================

app.get('/api/activity', authenticateToken, (req, res) => {
  const userLogs = db.activityLogs.filter(l => l.userId === req.user.id).slice(0, 50)
  res.json({ success: true, data: userLogs })
})

// ==================== SETTINGS ====================

app.get('/api/settings', authenticateToken, (req, res) => {
  const userSettings = db.settings[req.user.id] || {}
  res.json({ success: true, data: userSettings })
})

app.put('/api/settings', authenticateToken, (req, res) => {
  db.settings[req.user.id] = { ...db.settings[req.user.id], ...req.body }
  saveDB()
  res.json({ success: true, data: db.settings[req.user.id] })
})

// ==================== START SERVER ====================

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('')
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║            🚀 SIRA SOFTWARE PRO v2.0.0 🚀                  ║')
  console.log('║       Advanced Network Management & Hotspot Billing        ║')
  console.log('╠════════════════════════════════════════════════════════════╣')
  console.log(`║  📡 Server: http://0.0.0.0:${PORT}                             ║`)
  console.log(`║  🔐 Admin: admin@sira.software / admin123                  ║`)
  console.log(`║  🌍 Environment: ${process.env.NODE_ENV || 'development'}                             ║`)
  console.log(`║  ⏰ Started: ${new Date().toLocaleString()}                     ║`)
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('')
})

// Catch-all route for SPA
app.get('*', (req, res) => {
  const indexPath = join(__dirname, '../dist/index.html')
  const publicIndexPath = join(__dirname, '../public/index.html')
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else if (fs.existsSync(publicIndexPath)) {
    res.sendFile(publicIndexPath)
  } else {
    res.status(404).send('Frontend not built yet')
  }
})

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received, shutting down gracefully...')
  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('📴 SIGINT received, shutting down gracefully...')
  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})
