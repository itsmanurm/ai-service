import type { Request, Response, NextFunction } from 'express';

const keys = (process.env.API_KEYS ?? '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  // Dejar pasar /health sin auth
  if (req.path === '/health') return next();

  const key = (req.header('x-api-key') || '').trim();
  if (!key || !keys.includes(key)) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  next();
}
