import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config'

interface JwtPayload {
  userId: number
  mobile: string
}

interface AdminJwtPayload {
  adminId: number
  username: string
  role: string
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req)
  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required' })
    return
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload
    req.userId = payload.userId
    req.userMobile = payload.mobile
    next()
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req)
  if (!token) {
    res.status(401).json({ success: false, message: 'Admin authentication required' })
    return
  }

  try {
    const payload = jwt.verify(token, config.adminJwt.secret) as AdminJwtPayload
    req.adminId = payload.adminId
    next()
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired admin token' })
  }
}

// Optional auth — sets userId if present but doesn't block
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req)
  if (token) {
    try {
      const payload = jwt.verify(token, config.jwt.secret) as JwtPayload
      req.userId = payload.userId
      req.userMobile = payload.mobile
    } catch {
      // ignore
    }
  }
  next()
}

function extractToken(req: Request): string | null {
  const auth = req.headers.authorization
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  return null
}
