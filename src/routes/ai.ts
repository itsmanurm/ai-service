import { Router } from 'express';
import { ItemSchema, FeedbackSchema, SummarizeSchema } from '../ai/schema';
import { categorize } from '../ai/service';
import { appendJsonl } from '../utils/jsonl';

const r = Router();

/** POST /ai/categorize (single) */
r.post('/categorize', async (req, res) => {
  const parse = ItemSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ ok:false, error:'Bad request', details: parse.error.issues });
  }
  const out = await categorize(parse.data);
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
    const p = ItemSchema.safeParse(it || {});
    if (!p.success) {
      out.push({ ok:false, error:'Bad item', details: p.error.issues, echo: it });
      continue;
    }
    const pred = await categorize(p.data);
    out.push({ ok:true, ...pred });
  }
  return res.json({ ok:true, items: out });
});

/** POST /ai/feedback  -> guarda una línea en data/feedback.jsonl */
r.post('/feedback', async (req, res) => {
  const parsed = FeedbackSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ ok:false, error:'Bad request', details: parsed.error.issues });
  }
  const payload = {
    ...parsed.data,
    ts: new Date().toISOString()
  };
  await appendJsonl('feedback.jsonl', payload);
  return res.json({ ok:true, saved: 1 });
});

/** POST /ai/summarize -> mini informe con o sin clasificar faltantes */
r.post('/summarize', async (req, res) => {
  const parsed = SummarizeSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ ok:false, error:'Bad request', details: parsed.error.issues });
  }

  const { items, classifyMissing, currency, periodLabel } = parsed.data;

  // 1) Completar categorías faltantes (opcional)
  const enriched: Array<{ amount:number; category:string; merchant?:string }> = [];
  for (const it of items) {
    let cat = it.category;
    if (!cat && classifyMissing) {
      const pred = await categorize(it);
      cat = pred.category;
    }
    enriched.push({ amount: it.amount, category: cat ?? 'Sin clasificar', merchant: it.merchant });
  }

  // 2) Agregados
  let totalIncome = 0, totalExpense = 0;
  const byCategory = new Map<string, number>();
  const byMerchant = new Map<string, number>();

  for (const it of enriched) {
    if (it.amount >= 0) totalIncome += it.amount;
    else totalExpense += it.amount;

    byCategory.set(it.category, (byCategory.get(it.category) ?? 0) + it.amount);
    if (it.merchant) {
      byMerchant.set(it.merchant, (byMerchant.get(it.merchant) ?? 0) + it.amount);
    }
  }

  const net = totalIncome + totalExpense;
  const catArr = Array.from(byCategory.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a,b) => Math.abs(b.total) - Math.abs(a.total))
    .slice(0, 8);

  const merchArr = Array.from(byMerchant.entries())
    .map(([merchant, total]) => ({ merchant, total }))
    .sort((a,b) => Math.abs(b.total) - Math.abs(a.total))
    .slice(0, 8);

  // 3) Sugerencias simples
  const totalAbs = Math.abs(totalExpense) + Math.abs(totalIncome);
  const tips: string[] = [];
  const catTop = catArr[0];
  if (catTop && catTop.category.toLowerCase().includes('transporte') && Math.abs(catTop.total) > 0.3 * Math.abs(totalExpense)) {
    tips.push('Tu gasto en Transporte es alto este período ( >30% de los egresos ). Considerá optimizar traslados.');
  }
  const subCandidates = merchArr.filter(m => /netflix|spotify|disney|youtube/i.test(m.merchant ?? ''));
  if (subCandidates.length >= 2) tips.push('Detectamos múltiples suscripciones. Revisá si las usás todas.');
  if (net < 0) tips.push('Cerraste el período con balance negativo. Evaluá reducir rubros con mayor peso.');

  return res.json({
    ok: true,
    period: periodLabel ?? null,
    currency,
    totals: {
      income: Number(totalIncome.toFixed(2)),
      expense: Number(totalExpense.toFixed(2)),
      net: Number(net.toFixed(2))
    },
    topCategories: catArr.map(x => ({ ...x, total: Number(x.total.toFixed(2)) })),
    topMerchants: merchArr.map(x => ({ ...x, total: Number(x.total.toFixed(2)) })),
    suggestions: tips
  });
});

export default r;
