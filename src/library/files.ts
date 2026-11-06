import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { b64, open, rnd, seal, unb64 } from '../security/crypto';
import { getKey } from '../security/auth';
import { LibFile } from '../types';
const DIR = (FileSystem.documentDirectory ?? '') + 'lib/', MAX = 3 * 1024 * 1024;
// Файлы хранятся только в зашифрованном виде (AES-256-GCM, ключ из защищённого хранилища).
export async function addFile(): Promise<LibFile | null> {
  const r = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, type: '*/*' }); if (r.canceled) return null;
  const a = r.assets[0]; if ((a.size ?? 0) > MAX) throw new Error('Файл больше 3 МБ. Выберите файл меньшего размера.');
  const plain = unb64(await FileSystem.readAsStringAsync(a.uri, { encoding: FileSystem.EncodingType.Base64 }));
  await FileSystem.makeDirectoryAsync(DIR, { intermediates: true }).catch(() => {});
  const id = b64(rnd(9)).replace(/[+/]/g, 'x');
  await FileSystem.writeAsStringAsync(DIR + id + '.enc', b64(seal(getKey(), plain)), { encoding: FileSystem.EncodingType.Base64 });
  await FileSystem.deleteAsync(a.uri, { idempotent: true });
  return { id, name: a.name, size: plain.length };
}
export async function openFile(f: LibFile) {
  const plain = open(getKey(), unb64(await FileSystem.readAsStringAsync(DIR + f.id + '.enc', { encoding: FileSystem.EncodingType.Base64 })));
  const tmp = (FileSystem.cacheDirectory ?? '') + 'open/'; await FileSystem.makeDirectoryAsync(tmp, { intermediates: true }).catch(() => {});
  const to = tmp + f.name.replace(/[\\/:*?"<>|]/g, '_'); await FileSystem.writeAsStringAsync(to, b64(plain), { encoding: FileSystem.EncodingType.Base64 });
  if (!(await Sharing.isAvailableAsync())) throw new Error('Открытие файлов недоступно'); await Sharing.shareAsync(to);
}
export const removeFile = (id: string) => FileSystem.deleteAsync(DIR + id + '.enc', { idempotent: true });
