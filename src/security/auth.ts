// PIN не хранится: ключ данных (DEK, 32 случайных байта) зашифрован ключом из PIN и лежит в Keychain (SecureStore).
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { b64, kdf, open, rnd, seal, unb64 } from './crypto';
const ITER = 50000;
const OPT = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
const put = (k: string, v: string) => SecureStore.setItemAsync(k, v, OPT);
let dek: Uint8Array | null = null;
export const getKey = () => { if (!dek) throw new Error('Приложение заблокировано'); return dek; };
export const lockKey = () => { dek = null; };
export const hasPin = async () => !!(await SecureStore.getItemAsync('auth_v1'));
async function wrap(pin: string, k: Uint8Array) { const salt = rnd(16); const kek = await kdf(pin, salt, ITER);
  return JSON.stringify({ v:1, n: ITER, salt: b64(salt), w: b64(seal(kek, k)) }); }
export async function setupPin(pin: string) { const k = rnd(32); await put('auth_v1', await wrap(pin, k)); dek = k; }
async function tryUnwrap(pin: string): Promise<Uint8Array | null> {
  const f = JSON.parse((await SecureStore.getItemAsync('fails_v1')) ?? '{"n":0,"until":0}') as { n: number; until: number };
  if (f.until > Date.now()) throw new Error(`Слишком много попыток. Подождите ${Math.ceil((f.until - Date.now()) / 1000)} с.`);
  const a = JSON.parse((await SecureStore.getItemAsync('auth_v1')) ?? 'null') as { n: number; salt: string; w: string } | null;
  if (!a) throw new Error('PIN-код не создан');
  try { const k = open(await kdf(pin, unb64(a.salt), a.n), unb64(a.w)); await SecureStore.deleteItemAsync('fails_v1'); return k; }
  catch { const n = f.n + 1; const wait = n >= 5 ? Math.min(900, 30 * 2 ** (n - 5)) : 0;
    await put('fails_v1', JSON.stringify({ n, until: Date.now() + wait * 1000 })); return null; }
}
export async function unlock(pin: string) { const k = await tryUnwrap(pin); if (k) dek = k; return !!k; }
export async function changePin(oldPin: string, newPin: string) {
  const k = await tryUnwrap(oldPin); if (!k) throw new Error('Текущий PIN-код неверен'); await put('auth_v1', await wrap(newPin, k)); // данные не перешифровываются: ключ тот же
}
export async function bioAvailable() { try { return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync()); } catch { return false; } }
export const bioEnabled = async () => (await SecureStore.getItemAsync('bio_on')) === '1';
export async function enableBio() {
  await SecureStore.setItemAsync('dek_bio', b64(getKey()), { ...OPT, requireAuthentication: true, authenticationPrompt: 'Включить Face ID' });
  await put('bio_on', '1');
}
export async function disableBio() { await SecureStore.deleteItemAsync('dek_bio'); await SecureStore.deleteItemAsync('bio_on'); }
export async function unlockBio() {
  try { const v = await SecureStore.getItemAsync('dek_bio', { requireAuthentication: true, authenticationPrompt: 'Вход в Павел AI' });
    if (!v) return false; dek = unb64(v); return true; } catch { return false; }
}
