import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

async function ensureDir() {
  try { await fs.mkdir(DATA_DIR, { recursive: true }); } catch {}
}

export async function appendJsonl(filename: string, obj: unknown) {
  await ensureDir();
  const p = path.join(DATA_DIR, filename);
  const line = JSON.stringify(obj) + '\n';
  await fs.appendFile(p, line, 'utf8');
}

export async function countLines(filename: string): Promise<number> {
  const p = path.join(process.cwd(), 'data', filename);
  try {
    const buf = await fs.readFile(p, 'utf8');
    // rápido y suficiente para nuestros tamaños
    return buf === '' ? 0 : buf.split('\n').filter(Boolean).length;
  } catch {
    return 0;
  }
}
