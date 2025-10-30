import { Router } from 'express';
import { categorize } from '../ai/service';

const r = Router();

/** POST /ai/categorize (single) */
r.post('/categorize', async (req, res) => {
  const { description, merchant, amount, currency, when, accountLast4, bankMessageId } = req.body || {};
  if (!description || typeof amount !== 'number' || !currency) {
    return res.status(400).json({ ok:false, error:'Campos requeridos: description, amount:number, currency: ARS|USD' });
  }
  const out = await categorize({ description, merchant, amount, currency, when, accountLast4, bankMessageId });
  return res.json({ ok:true, ...out });
});

/** POST /ai/categorize/batch (array de items) */
r.post('/categorize/batch', async (req, res) => {
  const arr = Array.isArray(req.body) ? req.body : req.body?.items;
  if (!Array.isArray(arr)) {
    return res.status(400).json({ ok:false, error:'Se espera un array en el body o { items: [...] }' });
  }

  const out: any[] = [];

  for (const it of arr) {
    const { description, merchant, amount, currency, when, accountLast4, bankMessageId } = it || {};
    if (!description || typeof amount !== 'number' || !currency) {
      out.push({ ok:false, error:'Faltan campos', echo: it });
      continue;
    }
    const pred = await categorize({ description, merchant, amount, currency, when, accountLast4, bankMessageId });
    out.push({ ok:true, ...pred });
  }

  return res.json({ ok:true, items: out });
});

export default r;
