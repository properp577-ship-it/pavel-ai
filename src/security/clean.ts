import * as FileSystem from 'expo-file-system/legacy';
// Удаляет временные файлы экспорта (в них открытый текст документов) из кэша.
export async function cleanExports() {
  try { const d = FileSystem.cacheDirectory; if (!d) return;
    await FileSystem.deleteAsync(d + 'open/', { idempotent: true });
    for (const n of await FileSystem.readDirectoryAsync(d)) if (/\.(docx|pdf|xlsx|pavelbak)$/i.test(n)) await FileSystem.deleteAsync(d + n, { idempotent: true }); } catch { /* не критично */ }
}
