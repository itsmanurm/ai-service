import { Router } from 'express';
import patterns from '../ai/patterns.json';
import pkg from '../../package.json'; // ✅ sin assert ni require
import { countLines } from '../utils/jsonl';

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

r.get('/version', async (_req, res) => {
  const feedbackCount = await countLines('feedback.jsonl');
  res.json({ ok: true, version: '1.0.0', patterns: 17, feedbackCount });
});

export default r;
