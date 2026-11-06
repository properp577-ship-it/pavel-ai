import { b64, fromUtf8, hex, kdf, open, rnd, seal, unb64, utf8 } from './crypto';
import { Data, Shift } from '../types';
const MAGIC = 'PAVELAI-BACKUP', ITER = 150000;
export type Restored = { data: Data; shifts: Shift[]; createdAt: string };
export async function makeBackupText(pass: string, data: Data, shifts: Shift[]) {
  const plain = utf8(JSON.stringify({ createdAt: new Date().toISOString(), data, shifts })); const salt = rnd(16);
  return JSON.stringify({ magic: MAGIC, v: 1, n: ITER, salt: b64(salt), sha256: hex(plain), blob: b64(seal(await kdf(pass, salt, ITER), plain)) });
}
const arr = (x: unknown) => Array.isArray(x) && x.every(i => i && typeof (i as { id?: unknown }).id === 'string');
export async function parseBackupText(text: string, pass: string): Promise<Restored> {
  let f: { magic?: string; v?: number; n?: number; salt?: string; sha256?: string; blob?: string };
  try { f = JSON.parse(text); } catch { throw new Error('Файл не является резервной копией'); }
  if (f.magic !== MAGIC || f.v !== 1 || !f.salt || !f.blob || !f.n || !f.sha256) throw new Error('Файл не является резервной копией Павел AI');
  let plain: Uint8Array;
  try { plain = open(await kdf(pass, unb64(f.salt), f.n), unb64(f.blob)); } catch { throw new Error('Неверный пароль или файл повреждён'); }
  if (hex(plain) !== f.sha256) throw new Error('Контрольная сумма не совпала: файл повреждён');
  const p = JSON.parse(fromUtf8(plain)) as { createdAt: string; data: Partial<Data>; shifts: Shift[] };
  const d = p.data ?? {};
  if (!arr(d.events) || !arr(d.journal) || !arr(d.plans) || !arr(d.students) || !arr(p.shifts) || (d.docs !== undefined && !arr(d.docs)) || (d.library !== undefined && !arr(d.library)) || (d.favs !== undefined && !Array.isArray(d.favs))) throw new Error('Структура резервной копии некорректна');
  return { data: { events: d.events!, journal: d.journal!, plans: d.plans!, students: d.students!, docs: d.docs ?? [], library: d.library ?? [], favs: d.favs ?? [] }, shifts: p.shifts, createdAt: p.createdAt };
}
