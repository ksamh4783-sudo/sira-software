import * as client from 'openid-client'
import passport from 'passport'
import { Strategy } from 'openid-client/passport'
import session from 'express-session'
import MemoryStore from 'memorystore'
import memoize from 'memoizee'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

const MemoryStoreSession = MemoryStore(session)

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? 'https://replit.com/oidc'),
      process.env.REPL_ID
    )
  },
  { maxAge: 3600 * 1000 }
)

export function createSession() {
  return session({
    secret: process.env.SESSION_SECRET || 'sira-session-secret-fallback',
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({ checkPeriod: 86400000 }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
}

const registeredStrategies = new Set()

function ensureStrategy(domain, config) {
  const strategyName = `replitauth:${domain}`
  if (!registeredStrategies.has(strategyName)) {
    const strategy = new Strategy(
      {
        name: strategyName,
        config,
        scope: 'openid email profile offline_access',
        callbackURL: `https://${domain}/api/callback`,
      },
      async (tokens, verified) => {
        const user = {}
        user.claims = tokens.claims()
        user.access_token = tokens.access_token
        user.refresh_token = tokens.refresh_token
        user.expires_at = user.claims?.exp
        verified(null, user)
      }
    )
    passport.use(strategy)
    registeredStrategies.add(strategyName)
  }
}

export async function setupReplitAuth(app, db, saveDB, logActivity) {
  app.set('trust proxy', 1)
  app.use(createSession())
  app.use(passport.initialize())
  app.use(passport.session())

  passport.serializeUser((user, cb) => cb(null, user))
  passport.deserializeUser((user, cb) => cb(null, user))

  const JWT_SECRET = process.env.JWT_SECRET || 'sira-pro-secret-key-2024'

  app.get('/api/login', async (req, res, next) => {
    try {
      const config = await getOidcConfig()
      ensureStrategy(req.hostname, config)
      passport.authenticate(`replitauth:${req.hostname}`, {
        prompt: 'login consent',
        scope: ['openid', 'email', 'profile', 'offline_access'],
      })(req, res, next)
    } catch (err) {
      next(err)
    }
  })

  app.get('/api/callback', async (req, res, next) => {
    try {
      const config = await getOidcConfig()
      ensureStrategy(req.hostname, config)
      passport.authenticate(`replitauth:${req.hostname}`, {
        failureRedirect: '/login?error=replit_auth_failed',
      })(req, res, async (err) => {
        if (err) return next(err)

        const claims = req.user?.claims
        if (!claims) return res.redirect('/login?error=no_claims')

        const replitId = claims.sub
        const email = claims.email || `${replitId}@replit.user`
        const firstName = claims.first_name || ''
        const lastName = claims.last_name || ''
        const name = [firstName, lastName].filter(Boolean).join(' ') || `Replit User ${replitId.slice(0, 6)}`
        const avatar = claims.profile_image_url || ''

        let user = db.users.find(u => u.replitId === replitId)
        if (!user && email) user = db.users.find(u => u.email === email && !u.replitId)

        if (!user) {
          const hashedPassword = await bcrypt.hash(uuidv4(), 10)
          user = {
            id: uuidv4(),
            email,
            name,
            password: hashedPassword,
            role: 'admin',
            isActive: true,
            replitId,
            avatar,
            companyName: '',
            phone: '',
            address: '',
            subscriptionPlan: 'basic',
            subscriptionStatus: 'active',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          }
          db.users.push(user)
        } else {
          user.replitId = replitId
          if (avatar) user.avatar = avatar
          user.lastLogin = new Date().toISOString()
        }

        saveDB()
        logActivity(user.id, 'REPLIT_LOGIN', { email: user.email })

        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: '7d' }
        )

        const userData = encodeURIComponent(JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          subscriptionPlan: user.subscriptionPlan,
          subscriptionStatus: user.subscriptionStatus,
        }))

        res.redirect(`/auth-callback?token=${token}&user=${userData}`)
      })
    } catch (err) {
      next(err)
    }
  })
}
