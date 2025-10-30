import { normalizeMerchant } from './merchant-normalizer';
import { rulesCategory } from './rule-engine';
import { createHash } from 'crypto';

type Currency = 'ARS' | 'USD';

export interface CategorizeInput {
  description: string;
  merchant?: string;
  amount: number;
  currency: Currency;
  when?: string;
  accountLast4?: string;
  bankMessageId?: string;
}

export interface CategorizeOutput {
  category: string;
  confidence: number;
  reasons: string[];
  merchant_clean: string;
  dedupHash: string;
}

function dedupHash(v: {
  amount: number;
  when?: string;
  merchant_clean?: string;
  accountLast4?: string;
  bankMessageId?: string;
}) {
  const parts = [
    Math.abs(Number(v.amount)).toFixed(2),
    (v.when ?? '').slice(0,10),
    (v.merchant_clean ?? '').toLowerCase(),
    (v.accountLast4 ?? '').trim(),
    (v.bankMessageId ?? '').trim()
  ];
  return createHash('sha1').update(parts.join('|')).digest('hex');
}

export async function categorize(input: CategorizeInput): Promise<CategorizeOutput> {
  const merchant_clean = normalizeMerchant(input.merchant || '');
  const bag = [merchant_clean, input.description].filter(Boolean).join(' ').trim();

  const rule = rulesCategory(bag);
  const common = {
    merchant_clean,
    dedupHash: dedupHash({
      amount: input.amount,
      when: input.when,
      merchant_clean,
      accountLast4: input.accountLast4,
      bankMessageId: input.bankMessageId
    })
  };

const minConf = Number(process.env.AI_MIN_CONFIDENCE ?? 0.6);

if ((rule as any).hit) {
  const conf = Math.min(1, (rule as any).strength);
  const category = conf >= minConf ? (rule as any).category : 'Sin clasificar';
  return {
    category,
    confidence: conf,
    reasons: [(rule as any).reason],
    ...common
  };
}

const isExpense = Number(input.amount) < 0;
const defaultCat = isExpense ? 'Sin clasificar' : 'Ingresos';
return {
  category: defaultCat,
  confidence: 0.4,
  reasons: ['fallback:heuristic'],
  ...common
};
}
