import AsyncStorage from '@react-native-async-storage/async-storage';
import { fromUtf8, open, seal, unb64, b64, utf8 } from './crypto';
import { getKey } from './auth';
const P = 'enc1:';
export async function saveEnc(key: string, obj: unknown) { await AsyncStorage.setItem(key, P + b64(seal(getKey(), utf8(JSON.stringify(obj))))); }
export async function loadEnc<T>(key: string): Promise<T | null> {
  const v = await AsyncStorage.getItem(key); if (v === null) return null;
  if (!v.startsWith(P)) throw new Error('Неизвестный формат хранилища');
  try { return JSON.parse(fromUtf8(open(getKey(), unb64(v.slice(P.length))))) as T; }
  catch { throw new Error('Данные не удалось расшифровать (повреждены или другой ключ)'); }
}
// Миграция: старые данные (открытый JSON) шифруются, проверяются обратным чтением и только потом удаляются.
export async function loadOrMigrate<T>(newKey: string, oldKey: string): Promise<T | null> {
  const enc = await loadEnc<T>(newKey); if (enc) return enc;
  const old = await AsyncStorage.getItem(oldKey); if (!old) return null;
  const obj = JSON.parse(old) as T; await saveEnc(newKey, obj);
  const chk = await loadEnc<T>(newKey);
  if (JSON.stringify(chk) !== JSON.stringify(obj)) throw new Error('Проверка миграции не пройдена; старые данные сохранены');
  await AsyncStorage.removeItem(oldKey); return obj;
}
