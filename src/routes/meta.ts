import { Router } from 'express';
import patterns from '../ai/patterns.json';
import pkg from '../../package.json'; // ✅ sin assert ni require

const r = Router();

r.get('/ping', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

r.get('/version', (_req, res) => {
  res.json({
    ok: true,
    version: pkg.version,
    patterns: Array.isArray(patterns) ? patterns.length : 0
  });
});

export default r;
