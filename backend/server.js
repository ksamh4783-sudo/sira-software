import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import { RouterOSAPI } from 'node-routeros'
import FingerprintManager from './fingerprint-api.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000
const JWT_SECRET = process.env.JWT_SECRET || 'sira-pro-secret-key-2024'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@sira.software'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

// Security Middleware
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }))
app.use(cors({ origin: '*', credentials: true }))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true }))

// Rate Limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
})

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
  const exists = db.users.find(u => u.email === ADMIN_EMAIL)
  if (!exists) {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 12)
    db.users.push({
      id: uuidv4(),
      email: ADMIN_EMAIL,
      password: hash,
      name: 'المشرف',
      role: 'admin',
      avatar: '',
      subscriptionPlan: 'enterprise',
      subscriptionStatus: 'active',
      createdAt: new Date().toISOString(),
      lastLogin: null,
      isActive: true
    })
    saveDB()
    console.log('✅ Admin user created')
  }
}

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' })
  }
}

// ==================== AUTH ====================

// Login
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body
    
    const user = db.users.find(u => u.email === email)
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is disabled' })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    user.lastLogin = new Date().toISOString()
    saveDB()

    logActivity(user.id, 'LOGIN', { email: user.email })

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          subscriptionPlan: user.subscriptionPlan,
          subscriptionStatus: user.subscriptionStatus
        }
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

// Register
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { email, password, name, companyName, phone, address } = req.body
    
    const existingUser = db.users.find(u => u.email === email)
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    
    const newUser = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      name,
      role: 'user',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      companyName: companyName || '',
      phone: phone || '',
      address: address || '',
      subscriptionPlan: 'basic',
      subscriptionStatus: 'active',
      subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      lastLogin: null,
      isActive: true
    }

    db.users.push(newUser)
    saveDB()

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    logActivity(newUser.id, 'REGISTER', { email: newUser.email })

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          avatar: newUser.avatar,
          subscriptionPlan: newUser.subscriptionPlan,
          subscriptionStatus: newUser.subscriptionStatus
        }
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = db.users.find(u => u.id === req.user.id)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
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
      address: user.address,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionExpiry: user.subscriptionExpiry
    }
  })
})

// Update profile
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = db.users.find(u => u.id === req.user.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const { name, companyName, phone, address, avatar } = req.body
    
    if (name !== undefined) user.name = name
    if (companyName !== undefined) user.companyName = companyName
    if (phone !== undefined) user.phone = phone
    if (address !== undefined) user.address = address
    if (avatar !== undefined) user.avatar = avatar

    saveDB()

    logActivity(user.id, 'PROFILE_UPDATED', { name: user.name })

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        companyName: user.companyName,
        phone: user.phone,
        address: user.address,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus
      }
    })
  } catch (error) {
    console.error('Profile update error:', error)
    res.status(500).json({ error: 'Profile update failed' })
  }
})

// Change password
app.put('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const user = db.users.find(u => u.id === req.user.id)
    if (!user) return res.status(404).json({ error: 'User not found' })

    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' })
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' })
    }

    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) return res.status(401).json({ error: 'Current password is incorrect' })

    user.password = await bcrypt.hash(newPassword, 10)
    saveDB()
    logActivity(user.id, 'PASSWORD_CHANGED', {})
    res.json({ success: true, message: 'Password changed successfully' })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ error: 'Failed to change password' })
  }
})

// ==================== SETTINGS ====================

app.get('/api/settings', authenticateToken, (req, res) => {
  if (!db.settings) db.settings = {}
  const userSettings = db.settings[req.user.id] || {}
  res.json({ success: true, data: userSettings })
})

app.put('/api/settings', authenticateToken, (req, res) => {
  if (!db.settings) db.settings = {}
  db.settings[req.user.id] = { ...db.settings[req.user.id], ...req.body }
  saveDB()
  res.json({ success: true, data: db.settings[req.user.id] })
})

// ==================== DASHBOARD ====================

app.get('/api/dashboard', authenticateToken, (req, res) => {
  try {
    const userCameras = db.dvrCameras.filter(c => c.companyId === req.user.id)
    const userVouchers = db.vouchers.filter(v => v.companyId === req.user.id)
    const userBackgrounds = db.backgrounds.filter(b => b.companyId === req.user.id)
    const userPrintCards = db.printCards.filter(p => p.companyId === req.user.id)
    const userHotspotPages = db.hotspotPages.filter(h => h.companyId === req.user.id)
    const userFingerprintDevices = db.fingerprintDevices.filter(f => f.companyId === req.user.id)
    
    const recentActivity = db.activityLogs
      .filter(log => log.userId === req.user.id)
      .slice(0, 10)

    // Calculate monthly revenue
    const monthlyRevenue = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthYear = date.toISOString().slice(0, 7)
      
      const monthVouchers = userVouchers.filter(v => 
        v.createdAt.startsWith(monthYear)
      )
      
      const revenue = monthVouchers
        .filter(v => v.isUsed)
        .reduce((sum, v) => sum + (v.price || 0), 0)
      
      monthlyRevenue.push({
        month: monthYear,
        revenue,
        count: monthVouchers.length
      })
    }

    const stats = {
      totalRouters: db.routers.filter(r => r.companyId === req.user.id).length,
      activeRouters: db.routers.filter(r => r.companyId === req.user.id && r.status === 'online').length,
      totalVouchers: userVouchers.length,
      usedVouchers: userVouchers.filter(v => v.isUsed).length,
      unusedVouchers: userVouchers.filter(v => !v.isUsed).length,
      revenue: userVouchers.filter(v => v.isUsed).reduce((sum, v) => sum + (v.price || 0), 0),
      totalBackgrounds: userBackgrounds.length,
      totalPrintCards: userPrintCards.length,
      totalHotspotPages: userHotspotPages.length,
      activeHotspotPages: userHotspotPages.filter(h => h.isActive).length,
      totalFingerprintDevices: userFingerprintDevices.length,
      activeFingerprintDevices: userFingerprintDevices.filter(f => f.status === 'online').length,
      totalDVRCameras: userCameras.length,
      activeDVRCameras: userCameras.filter(c => c.status === 'online').length,
      monthlyRevenue,
      recentActivity,
      systemHealth: {
        status: 'excellent',
        uptime: process.uptime(),
        lastBackup: new Date().toISOString()
      }
    }

    res.json({ success: true, data: stats })
  } catch (error) {
    console.error('Dashboard error:', error)
    res.status(500).json({ error: 'Failed to get dashboard data' })
  }
})

// ==================== ROUTERS ====================

app.get('/api/routers', authenticateToken, (req, res) => {
  const userRouters = db.routers.filter(r => r.companyId === req.user.id)
  res.json({ success: true, data: userRouters })
})

app.post('/api/routers', authenticateToken, async (req, res) => {
  try {
    const { name, ipAddress, port, username, password, location, macAddress } = req.body
    
    const router = {
      id: uuidv4(),
      name,
      ipAddress,
      port: port || 8728,
      username: username || 'admin',
      password,
      location: location || '',
      macAddress: macAddress || '',
      status: 'offline',
      companyId: req.user.id,
      lastSeen: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    db.routers.push(router)
    saveDB()

    logActivity(req.user.id, 'ROUTER_CREATED', { name: router.name, ip: router.ipAddress })

    res.json({ success: true, data: router })
  } catch (error) {
    console.error('Router creation error:', error)
    res.status(500).json({ error: 'Failed to create router' })
  }
})

app.put('/api/routers/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params
    const router = db.routers.find(r => r.id === id && r.companyId === req.user.id)
    
    if (!router) {
      return res.status(404).json({ error: 'Router not found' })
    }

    const updates = { ...req.body, updatedAt: new Date().toISOString() }
    Object.assign(router, updates)
    saveDB()

    logActivity(req.user.id, 'ROUTER_UPDATED', { name: router.name, ip: router.ipAddress })

    res.json({ success: true, data: router })
  } catch (error) {
    console.error('Router update error:', error)
    res.status(500).json({ error: 'Failed to update router' })
  }
})

app.delete('/api/routers/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params
    const index = db.routers.findIndex(r => r.id === id && r.companyId === req.user.id)
    
    if (index === -1) {
      return res.status(404).json({ error: 'Router not found' })
    }

    const router = db.routers[index]
    db.routers.splice(index, 1)
    saveDB()

    logActivity(req.user.id, 'ROUTER_DELETED', { name: router.name, ip: router.ipAddress })

    res.json({ success: true })
  } catch (error) {
    console.error('Router deletion error:', error)
    res.status(500).json({ error: 'Failed to delete router' })
  }
})

// Test router connection
app.post('/api/routers/test-connection', authenticateToken, async (req, res) => {
  try {
    const { ipAddress, port, username, password } = req.body
    
    if (!ipAddress) {
      return res.status(400).json({ error: 'Router IP address is required' })
    }

    const api = new RouterOSAPI({
      host: ipAddress,
      port: port || 8728,
      user: username || 'admin',
      password: password
    })

    await api.connect()
    await api.close()

    res.json({ success: true, message: 'Connection successful' })
  } catch (error) {
    console.error('Router connection test error:', error)
    res.status(500).json({ error: 'Connection failed: ' + error.message })
  }
})

// Get router live statistics
app.post('/api/routers/live-stats', authenticateToken, async (req, res) => {
  try {
    const { ipAddress, port, username, password } = req.body
    
    if (!ipAddress) {
      return res.status(400).json({ error: 'Router IP address is required' })
    }

    const api = new RouterOSAPI({
      host: ipAddress,
      port: port || 8728,
      user: username || 'admin',
      password: password
    })

    await api.connect()
    
    // Get hotspot active users
    const hotspotUsers = await api.write('/ip/hotspot/active/print')
    const hotspotActiveCount = Array.isArray(hotspotUsers) ? hotspotUsers.length : 0

    // Get PPPoE active connections
    const pppoeConnections = await api.write('/interface/pppoe-client/print')
    const pppoeActiveCount = Array.isArray(pppoeConnections) ? pppoeConnections.filter(c => c['running'] === 'true').length : 0

    // Get system resource
    const systemResource = await api.write('/system/resource/print')
    const cpuLoad = systemResource && systemResource[0] && systemResource[0]['cpu-load'] ? parseInt(systemResource[0]['cpu-load']) : 0

    await api.close()

    res.json({
      success: true,
      data: {
        hotspotActiveCount,
        pppoeActiveCount,
        cpuLoad
      }
    })
  } catch (error) {
    console.error('Router live stats error:', error)
    res.status(500).json({ error: 'Failed to get live stats: ' + error.message })
  }
})

// ==================== VOUCHERS ====================

app.get('/api/vouchers', authenticateToken, (req, res) => {
  const userVouchers = db.vouchers.filter(v => v.companyId === req.user.id)
  res.json({ success: true, data: userVouchers })
})

app.post('/api/vouchers', authenticateToken, async (req, res) => {
  try {
    const { quantity = 1, ...voucherData } = req.body
    const vouchers = []
    
    for (let i = 0; i < quantity; i++) {
      const voucher = {
        id: uuidv4(),
        code: Math.random().toString(36).substring(2, 10).toUpperCase(),
        duration: voucherData.duration || '1h',
        dataLimit: voucherData.dataLimit || 0,
        speedLimit: voucherData.speedLimit || 0,
        price: voucherData.price || 0,
        isUsed: false,
        usedBy: '',
        usedAt: null,
        companyId: req.user.id,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + (voucherData.durationHours || 24) * 60 * 60 * 1000).toISOString()
      }
      
      vouchers.push(voucher)
      db.vouchers.push(voucher)
    }

    saveDB()

    logActivity(req.user.id, 'VOUCHERS_CREATED', { quantity, code: vouchers[0].code })

    res.json({ success: true, data: quantity === 1 ? vouchers[0] : vouchers })
  } catch (error) {
    console.error('Voucher creation error:', error)
    res.status(500).json({ error: 'Failed to create vouchers' })
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

app.post('/api/backgrounds', authenticateToken, (req, res) => {
  try {
    const { name, imageUrl, category, isDefault } = req.body
    
    const background = {
      id: uuidv4(),
      name,
      imageUrl,
      category: category || 'default',
      isDefault: isDefault || false,
      companyId: req.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    db.backgrounds.push(background)
    saveDB()

    logActivity(req.user.id, 'BACKGROUND_CREATED', { name: background.name })

    res.json({ success: true, data: background })
  } catch (error) {
    console.error('Background creation error:', error)
    res.status(500).json({ error: 'Failed to create background' })
  }
})

app.put('/api/backgrounds/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params
    const background = db.backgrounds.find(b => b.id === id && b.companyId === req.user.id)
    
    if (!background) {
      return res.status(404).json({ error: 'Background not found' })
    }

    const updates = { ...req.body, updatedAt: new Date().toISOString() }
    Object.assign(background, updates)
    saveDB()

    logActivity(req.user.id, 'BACKGROUND_UPDATED', { name: background.name })

    res.json({ success: true, data: background })
  } catch (error) {
    console.error('Background update error:', error)
    res.status(500).json({ error: 'Failed to update background' })
  }
})

app.delete('/api/backgrounds/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params
    const index = db.backgrounds.findIndex(b => b.id === id && b.companyId === req.user.id)
    
    if (index === -1) {
      return res.status(404).json({ error: 'Background not found' })
    }

    const background = db.backgrounds[index]
    db.backgrounds.splice(index, 1)
    saveDB()

    logActivity(req.user.id, 'BACKGROUND_DELETED', { name: background.name })

    res.json({ success: true })
  } catch (error) {
    console.error('Background deletion error:', error)
    res.status(500).json({ error: 'Failed to delete background' })
  }
})

// ==================== PRINT CARDS ====================

app.get('/api/print-cards', authenticateToken, (req, res) => {
  const userPrintCards = db.printCards.filter(p => p.companyId === req.user.id)
  res.json({ success: true, data: userPrintCards })
})

app.post('/api/print-cards', authenticateToken, (req, res) => {
  try {
    const { title, template, voucherCode, duration, dataLimit, speedLimit, price, logoUrl, primaryColor, secondaryColor, fontFamily, showLogo, showQR, notes } = req.body
    
    const printCard = {
      id: uuidv4(),
      title,
      template: template || 'default',
      voucherCode: voucherCode || '',
      duration: duration || '1h',
      dataLimit: dataLimit || 0,
      speedLimit: speedLimit || 0,
      price: price || 0,
      logoUrl: logoUrl || '',
      primaryColor: primaryColor || '#3B82F6',
      secondaryColor: secondaryColor || '#1E40AF',
      fontFamily: fontFamily || 'Arial',
      showLogo: showLogo !== false,
      showQR: showQR !== false,
      notes: notes || '',
      printCount: 0,
      lastPrintedAt: null,
      companyId: req.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    db.printCards.push(printCard)
    saveDB()

    logActivity(req.user.id, 'PRINT_CARD_CREATED', { title: printCard.title })

    res.json({ success: true, data: printCard })
  } catch (error) {
    console.error('Print card creation error:', error)
    res.status(500).json({ error: 'Failed to create print card' })
  }
})

app.put('/api/print-cards/:id/print', authenticateToken, (req, res) => {
  try {
    const { id } = req.params
    const printCard = db.printCards.find(p => p.id === id && p.companyId === req.user.id)
    
    if (!printCard) {
      return res.status(404).json({ error: 'Print card not found' })
    }

    printCard.printCount = (printCard.printCount || 0) + 1
    printCard.lastPrintedAt = new Date().toISOString()
    saveDB()

    logActivity(req.user.id, 'PRINT_CARD_PRINTED', { title: printCard.title })

    res.json({ success: true, data: printCard })
  } catch (error) {
    console.error('Print card print error:', error)
    res.status(500).json({ error: 'Failed to print card' })
  }
})

app.put('/api/print-cards/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params
    const printCard = db.printCards.find(p => p.id === id && p.companyId === req.user.id)
    
    if (!printCard) {
      return res.status(404).json({ error: 'Print card not found' })
    }

    const updates = { ...req.body, updatedAt: new Date().toISOString() }
    Object.assign(printCard, updates)
    saveDB()

    logActivity(req.user.id, 'PRINT_CARD_UPDATED', { title: printCard.title })

    res.json({ success: true, data: printCard })
  } catch (error) {
    console.error('Print card update error:', error)
    res.status(500).json({ error: 'Failed to update print card' })
  }
})

app.delete('/api/print-cards/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params
    const index = db.printCards.findIndex(p => p.id === id && p.companyId === req.user.id)
    
    if (index === -1) {
      return res.status(404).json({ error: 'Print card not found' })
    }

    const printCard = db.printCards[index]
    db.printCards.splice(index, 1)
    saveDB()

    logActivity(req.user.id, 'PRINT_CARD_DELETED', { title: printCard.title })

    res.json({ success: true })
  } catch (error) {
    console.error('Print card deletion error:', error)
    res.status(500).json({ error: 'Failed to delete print card' })
  }
})

// ==================== HOTSPOT PAGES ====================

app.get('/api/hotspot-pages', authenticateToken, (req, res) => {
  const userHotspotPages = db.hotspotPages.filter(h => h.companyId === req.user.id)
  res.json({ success: true, data: userHotspotPages })
})

app.get('/api/hotspot-pages/:id/public', (req, res) => {
  try {
    const { id } = req.params
    const hotspotPage = db.hotspotPages.find(h => h.id === id && h.isActive)
    
    if (!hotspotPage) {
      return res.status(404).json({ error: 'Hotspot page not found or inactive' })
    }

    hotspotPage.viewCount = (hotspotPage.viewCount || 0) + 1
    hotspotPage.lastViewedAt = new Date().toISOString()
    saveDB()

    res.json({ success: true, data: hotspotPage })
  } catch (error) {
    console.error('Hotspot page fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch hotspot page' })
  }
})

app.post('/api/hotspot-pages', authenticateToken, (req, res) => {
  try {
    const { name, title, subtitle, backgroundImage, backgroundColor, logoUrl, welcomeMessage, instructions, termsText, showTerms, showLogo, showVoucherInput, showPhoneInput, primaryColor, secondaryColor, fontFamily, buttonText, footerText, isActive } = req.body
    
    const hotspotPage = {
      id: uuidv4(),
      name,
      title,
      subtitle: subtitle || '',
      backgroundImage: backgroundImage || '',
      backgroundColor: backgroundColor || '#ffffff',
      logoUrl: logoUrl || '',
      welcomeMessage: welcomeMessage || 'Welcome to our WiFi service',
      instructions: instructions || 'Please enter your voucher code to access the internet',
      termsText: termsText || 'By using this service, you agree to our terms and conditions.',
      showTerms: showTerms !== false,
      showLogo: showLogo !== false,
      showVoucherInput: showVoucherInput !== false,
      showPhoneInput: showPhoneInput !== false,
      primaryColor: primaryColor || '#3B82F6',
      secondaryColor: secondaryColor || '#1E40AF',
      fontFamily: fontFamily || 'Arial',
      buttonText: buttonText || 'Connect',
      footerText: footerText || 'Powered by Sira Software',
      isActive: isActive !== false,
      viewCount: 0,
      lastViewedAt: null,
      companyId: req.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    db.hotspotPages.push(hotspotPage)
    saveDB()

    logActivity(req.user.id, 'HOTSPOT_PAGE_CREATED', { name: hotspotPage.name })

    res.json({ success: true, data: hotspotPage })
  } catch (error) {
    console.error('Hotspot page creation error:', error)
    res.status(500).json({ error: 'Failed to create hotspot page' })
  }
})

app.put('/api/hotspot-pages/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params
    const hotspotPage = db.hotspotPages.find(h => h.id === id && h.companyId === req.user.id)
    
    if (!hotspotPage) {
      return res.status(404).json({ error: 'Hotspot page not found' })
    }

    const updates = { ...req.body, updatedAt: new Date().toISOString() }
    Object.assign(hotspotPage, updates)
    saveDB()

    logActivity(req.user.id, 'HOTSPOT_PAGE_UPDATED', { name: hotspotPage.name })

    res.json({ success: true, data: hotspotPage })
  } catch (error) {
    console.error('Hotspot page update error:', error)
    res.status(500).json({ error: 'Failed to update hotspot page' })
  }
})

app.delete('/api/hotspot-pages/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params
    const index = db.hotspotPages.findIndex(h => h.id === id && h.companyId === req.user.id)
    
    if (index === -1) {
      return res.status(404).json({ error: 'Hotspot page not found' })
    }

    const hotspotPage = db.hotspotPages[index]
    db.hotspotPages.splice(index, 1)
    saveDB()

    logActivity(req.user.id, 'HOTSPOT_PAGE_DELETED', { name: hotspotPage.name })

    res.json({ success: true })
  } catch (error) {
    console.error('Hotspot page deletion error:', error)
    res.status(500).json({ error: 'Failed to delete hotspot page' })
  }
})

// ==================== FINGERPRINT DEVICES ====================

app.get('/api/fingerprint', authenticateToken, (req, res) => {
  const userDevices = db.fingerprintDevices.filter(d => d.companyId === req.user.id)
  res.json({ success: true, data: userDevices })
})

app.post('/api/fingerprint', authenticateToken, (req, res) => {
  try {
    const { name, ipAddress, port, model, serialNumber, location } = req.body
    const device = {
      id: uuidv4(),
      name,
      ipAddress,
      port: port || 4370,
      status: 'offline',
      model: model || 'ZKTeco',
      serialNumber: serialNumber || '',
      location: location || '',
      totalUsers: 0,
      lastSync: null,
      companyId: req.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    db.fingerprintDevices.push(device)
    saveDB()

    logActivity(req.user.id, 'FINGERPRINT_DEVICE_CREATED', { name: device.name, ip: device.ipAddress })

    res.json({ success: true, data: device })
  } catch (error) {
    console.error('Fingerprint device creation error:', error)
    res.status(500).json({ error: 'Failed to create fingerprint device' })
  }
})

app.put('/api/fingerprint/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params
    const device = db.fingerprintDevices.find(d => d.id === id && d.companyId === req.user.id)
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' })
    }

    const updates = { ...req.body, updatedAt: new Date().toISOString() }
    Object.assign(device, updates)
    saveDB()

    logActivity(req.user.id, 'FINGERPRINT_DEVICE_UPDATED', { name: device.name, ip: device.ipAddress })

    res.json({ success: true, data: device })
  } catch (error) {
    console.error('Fingerprint device update error:', error)
    res.status(500).json({ error: 'Failed to update device' })
  }
})

app.delete('/api/fingerprint/:id', authenticateToken, (req, res) => {
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

// Test fingerprint device connection
app.post('/api/fingerprint/:id/test-connection', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const device = db.fingerprintDevices.find(d => d.id === id && d.companyId === req.user.id)
    if (!device) return res.status(404).json({ error: 'Device not found', success: false })

    const result = await FingerprintManager.testConnection(device.ipAddress, device.port || 4370)

    device.status = result.success ? 'online' : 'offline'
    device.lastSync = new Date().toISOString()
    saveDB()

    res.json({ success: result.success, message: result.message || (result.success ? 'Connection successful' : 'Connection failed'), data: result })
  } catch (error) {
    console.error('Fingerprint test connection error:', error)
    res.status(500).json({ error: 'Test connection failed', success: false })
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

app.put('/api/dvr/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params
    const camera = db.dvrCameras.find(c => c.id === id && c.companyId === req.user.id)
    
    if (!camera) {
      return res.status(404).json({ error: 'Camera not found' })
    }

    const updates = { ...req.body, updatedAt: new Date().toISOString() }
    Object.assign(camera, updates)
    saveDB()

    res.json({ success: true, data: camera })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update camera' })
  }
})

app.delete('/api/dvr/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params
    const index = db.dvrCameras.findIndex(c => c.id === id && c.companyId === req.user.id)
    
    if (index === -1) {
      return res.status(404).json({ error: 'Camera not found' })
    }

    db.dvrCameras.splice(index, 1)
    saveDB()

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete camera' })
  }
})

// ==================== ACTIVITY LOGS ====================

app.get('/api/activity', authenticateToken, (req, res) => {
  const userActivity = db.activityLogs
    .filter(log => log.userId === req.user.id)
    .slice(0, 50)
  
  res.json({ success: true, data: userActivity })
})

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Sira Software API is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  })
})

// ==================== INITIALIZATION ====================

// Initialize admin user
initAdmin().then(() => {
  // Start server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n╔══════════════════════════════════════════════════════════════╗`)
    console.log(`║                    SIRA SOFTWARE PRO                        ║`)
    console.log(`║============================================================║`)
    console.log(`║ 🚀 Server running on: http://0.0.0.0:${PORT}`)
    console.log(`║ 🔗 API URL: http://localhost:${PORT}`)
    console.log(`║ 📝 Version: 2.0.0`)
    console.log(`║ 📍 Environment: ${process.env.NODE_ENV || 'development'}`)
    console.log(`╚══════════════════════════════════════════════════════════════╝\n`)
  })
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  process.exit(0)
})