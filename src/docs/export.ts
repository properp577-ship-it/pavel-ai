import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { base64, docx, html, parse, xlsx } from './build';
export type Fmt = 'docx' | 'pdf' | 'xlsx';
const META: Record<Fmt, { mime: string; uti: string }> = {
  docx: { mime:'application/vnd.openxmlformats-officedocument.wordprocessingml.document', uti:'org.openxmlformats.wordprocessingml.document' },
  xlsx: { mime:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', uti:'org.openxmlformats.spreadsheetml.sheet' },
  pdf: { mime:'application/pdf', uti:'com.adobe.pdf' } };
// Создаёт файл и открывает стандартное меню iPhone «Поделиться» / «Сохранить в Файлы».
export async function exportDoc(title: string, text: string, fmt: Fmt) {
  const blks = parse(text); const name = (title.replace(/[\\/:*?"<>|]/g, '_').trim().slice(0, 60) || 'Документ') + '.' + fmt;
  const to = (FileSystem.cacheDirectory ?? '') + name;
  if (fmt === 'pdf') { const r = await Print.printToFileAsync({ html: html(blks), width: 595, height: 842 });
    await FileSystem.deleteAsync(to, { idempotent: true }); await FileSystem.moveAsync({ from: r.uri, to }); }
  else await FileSystem.writeAsStringAsync(to, base64(fmt === 'docx' ? docx(blks) : xlsx(blks)), { encoding: FileSystem.EncodingType.Base64 });
  if (!(await Sharing.isAvailableAsync())) throw new Error('Отправка файлов недоступна на этом устройстве');
  await Sharing.shareAsync(to, { mimeType: META[fmt].mime, UTI: META[fmt].uti, dialogTitle: name });
}
