import { createHash } from 'crypto';

export function dedupHash(v: {
  amount: number;
  when?: string;               // ISO (ej: 2025-10-30T11:30:00-03:00)
  merchant_clean?: string;     // normalizado
  accountLast4?: string;       // últimos 4 (opcional)
  bankMessageId?: string;      // id único del mail (opcional)
}) {
  const parts = [
    Math.abs(Number(v.amount)).toFixed(2),
    (v.when ?? '').slice(0, 10),       // YYYY-MM-DD
    (v.merchant_clean ?? '').toLowerCase(),
    (v.accountLast4 ?? '').trim(),
    (v.bankMessageId ?? '').trim()
  ];
  const s = parts.join('|');
  return createHash('sha1').update(s).digest('hex');
}
