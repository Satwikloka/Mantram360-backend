import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    })
    return
  }

  if (err instanceof Error) {
    console.error('[Error]', err.message)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    })
    return
  }

  res.status(500).json({ success: false, message: 'Internal server error' })
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ success: false, message: 'Route not found' })
}
