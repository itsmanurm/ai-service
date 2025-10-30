import patterns from './patterns.json';

export function rulesCategory(text: string) {
  const t = text.toLowerCase();
  for (const r of patterns as any[]) {
    const re = new RegExp(r.re, 'i');
    if (re.test(t)) {
      return { hit: true, category: r.category as string, reason: `rule:${r.name}`, strength: r.strength ?? 0.8 };
    }
  }
  return { hit: false as const };
}
