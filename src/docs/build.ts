// Чистые функции без зависимостей от Expo: Word, Excel (zip без сжатия), HTML для PDF.
export type Blk = { t: 'h1' | 'h2' | 'p' | 'tbl'; text?: string; rows?: string[][] };
export function parse(text: string): Blk[] {
  const out: Blk[] = [];
  for (const raw of text.split('\n')) {
    const l = raw.trimEnd(); if (!l.trim()) continue;
    if (l.startsWith('## ')) out.push({ t:'h2', text: l.slice(3) });
    else if (l.startsWith('# ')) out.push({ t:'h1', text: l.slice(2) });
    else if (l.startsWith('| ') && l.endsWith(' |')) { const row = l.slice(2, -2).split(' | ');
      const last = out[out.length - 1]; if (last && last.t === 'tbl') last.rows!.push(row); else out.push({ t:'tbl', rows: [row] }); }
    else out.push({ t:'p', text: l });
  }
  return out;
}
export const hasTables = (text: string) => parse(text).some(b => b.t === 'tbl');
export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export function utf8(s: string): Uint8Array {
  const o: number[] = [];
  for (const ch of s) { const p = ch.codePointAt(0)!;
    if (p < 128) o.push(p); else if (p < 2048) o.push(192 | (p >> 6), 128 | (p & 63));
    else if (p < 65536) o.push(224 | (p >> 12), 128 | ((p >> 6) & 63), 128 | (p & 63));
    else o.push(240 | (p >> 18), 128 | ((p >> 12) & 63), 128 | ((p >> 6) & 63), 128 | (p & 63)); }
  return Uint8Array.from(o);
}
const T: number[] = []; for (let n = 0; n < 256; n++) { let k = n; for (let j = 0; j < 8; j++) k = k & 1 ? 0xedb88320 ^ (k >>> 1) : k >>> 1; T[n] = k >>> 0; }
const crc = (d: Uint8Array) => { let k = 0xffffffff; for (let i = 0; i < d.length; i++) k = T[(k ^ d[i]) & 255] ^ (k >>> 8); return (k ^ 0xffffffff) >>> 0; };
const u16 = (n: number) => [n & 255, (n >> 8) & 255];
const u32 = (n: number) => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
export function zip(files: { name: string; text: string }[]): Uint8Array {
  const parts: number[][] = [], cen: number[][] = []; let off = 0;
  for (const f of files) {
    const nm = Array.from(utf8(f.name)), d = utf8(f.text), c = crc(d);
    const head = [...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(33), ...u32(c), ...u32(d.length), ...u32(d.length), ...u16(nm.length), ...u16(0), ...nm];
    cen.push([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(33), ...u32(c), ...u32(d.length), ...u32(d.length), ...u16(nm.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(off), ...nm]);
    parts.push(head, Array.from(d)); off += head.length + d.length;
  }
  const cs = cen.reduce((a, b) => a + b.length, 0);
  const all = [...parts, ...cen, [...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cs), ...u32(off), ...u16(0)]];
  const out = new Uint8Array(all.reduce((a, b) => a + b.length, 0)); let p = 0; for (const a of all) { out.set(a, p); p += a.length; } return out;
}
const B = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
export function base64(d: Uint8Array) {
  let s = ''; for (let i = 0; i < d.length; i += 3) { const n = (d[i] << 16) | ((d[i + 1] ?? 0) << 8) | (d[i + 2] ?? 0);
    s += B[n >> 18] + B[(n >> 12) & 63] + (i + 1 < d.length ? B[(n >> 6) & 63] : '=') + (i + 2 < d.length ? B[n & 63] : '='); } return s;
}
const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const PKG = 'http://schemas.openxmlformats.org/package/2006/relationships';
export function docx(blks: Blk[]): Uint8Array {
  const run = (t: string, b: boolean, sz = 28) => `<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>${b ? '<w:b/>' : ''}<w:sz w:val="${sz}"/></w:rPr><w:t xml:space="preserve">${esc(t)}</w:t></w:r>`;
  const para = (t: string, b = false, center = false) => `<w:p><w:pPr>${center ? '<w:jc w:val="center"/>' : '<w:jc w:val="both"/>'}<w:spacing w:after="120"/></w:pPr>${run(t, b)}</w:p>`;
  const bd = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(s => `<w:${s} w:val="single" w:sz="4" w:space="0" w:color="000000"/>`).join('');
  const body = blks.map(b => b.t === 'h1' ? para(b.text!, true, true) : b.t === 'h2' ? para(b.text!, true) : b.t === 'p' ? para(b.text!)
    : `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders>${bd}</w:tblBorders></w:tblPr>${b.rows!.map((r, i) =>
      `<w:tr>${r.map(c => `<w:tc><w:p>${run(c, i === 0, 24)}</w:p></w:tc>`).join('')}</w:tr>`).join('')}</w:tbl><w:p/>`).join('');
  return zip([
    { name:'[Content_Types].xml', text: `${XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>` },
    { name:'_rels/.rels', text: `${XML}<Relationships xmlns="${PKG}"><Relationship Id="rId1" Type="${REL}/officeDocument" Target="word/document.xml"/></Relationships>` },
    { name:'word/document.xml', text: `${XML}<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="850" w:bottom="1134" w:left="1701" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr></w:body></w:document>` }]);
}
export function xlsx(blks: Blk[]): Uint8Array {
  const rows: string[][] = []; blks.filter(b => b.t === 'tbl').forEach((b, i) => { if (i) rows.push([]); rows.push(...b.rows!); });
  const sheet = rows.map((r, i) => `<row r="${i + 1}">${r.map((v, j) => `<c r="${String.fromCharCode(65 + j)}${i + 1}" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`).join('')}</row>`).join('');
  return zip([
    { name:'[Content_Types].xml', text: `${XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>` },
    { name:'_rels/.rels', text: `${XML}<Relationships xmlns="${PKG}"><Relationship Id="rId1" Type="${REL}/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
    { name:'xl/workbook.xml', text: `${XML}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="${REL}"><sheets><sheet name="Данные" sheetId="1" r:id="rId1"/></sheets></workbook>` },
    { name:'xl/_rels/workbook.xml.rels', text: `${XML}<Relationships xmlns="${PKG}"><Relationship Id="rId1" Type="${REL}/worksheet" Target="worksheets/sheet1.xml"/></Relationships>` },
    { name:'xl/worksheets/sheet1.xml', text: `${XML}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheet}</sheetData></worksheet>` }]);
}
export function html(blks: Blk[]) {
  const b = blks.map(x => x.t === 'h1' ? `<h1>${esc(x.text!)}</h1>` : x.t === 'h2' ? `<h2>${esc(x.text!)}</h2>` : x.t === 'p' ? `<p>${esc(x.text!)}</p>`
    : `<table>${x.rows!.map((r, i) => `<tr>${r.map(c => `<${i ? 'td' : 'th'}>${esc(c)}</${i ? 'td' : 'th'}>`).join('')}</tr>`).join('')}</table>`).join('');
  return `<html><head><meta charset="utf-8"/><style>body{font-family:'Times New Roman',serif;font-size:14pt;padding:20px}h1{text-align:center;font-size:16pt}h2{font-size:14pt}p{text-align:justify;margin:6px 0}table{border-collapse:collapse;width:100%;margin:8px 0}td,th{border:1px solid #000;padding:4px;font-size:12pt}</style></head><body>${b}</body></html>`;
}
