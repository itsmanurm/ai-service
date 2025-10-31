import { Router } from 'express';
import { categorize } from '../ai/service';
import { ItemSchema } from '../ai/schema';

const r = Router();

/** POST /ai/categorize (single) */
r.post('/categorize', async (req, res) => {
  const parsed = ItemSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ ok:false, error:'Bad request', details: parsed.error.issues });
  }
  const out = await categorize(parsed.data);
  return res.json({ ok:true, ...out });
});

/** POST /ai/categorize/batch (array o {items:[]}) */
r.post('/categorize/batch', async (req, res) => {
  const arr = Array.isArray(req.body) ? req.body : req.body?.items;
  if (!Array.isArray(arr)) {
    return res.status(400).json({ ok:false, error:'Se espera un array en el body o { items: [...] }' });
  }
  const out: any[] = [];
  for (const it of arr) {
    const parsed = ItemSchema.safeParse(it || {});
    if (!parsed.success) {
      out.push({ ok:false, error:'Bad item', details: parsed.error.issues, echo: it });
      continue;
    }
    const pred = await categorize(parsed.data);
    out.push({ ok:true, ...pred });
  }
  return res.json({ ok:true, items: out });
});

export default r;
