import { Platform } from 'react-native';
import { File } from 'expo-file-system';
import { inflate } from 'pako';

export interface Extracted { text: string; kind: 'text' | 'pdf' | 'image'; warning?: string }
const MAX_CHARS = 200000;

async function readBytes(uri: string, webFile?: Blob): Promise<Uint8Array> {
  if (Platform.OS === 'web') {
    const buf = webFile ? await webFile.arrayBuffer() : await (await fetch(uri)).arrayBuffer();
    return new Uint8Array(buf);
  }
  return new Uint8Array(await new File(uri).arrayBuffer());
}
const decodeLatin = (b: Uint8Array): string => { let s = ''; for (let i = 0; i < b.length; i += 8192) s += String.fromCharCode(...b.subarray(i, i + 8192)); return s; };

function unescapePdf(s: string): string {
  return s.replace(/\\([nrtbf()\\]|[0-7]{1,3})/g, (_, c: string) => {
    if (/^[0-7]+$/.test(c)) return String.fromCharCode(parseInt(c, 8));
    return ({ n: '\n', r: '\n', t: ' ', b: '', f: '' } as Record<string, string>)[c] ?? c;
  });
}

/** Best-effort PDF text: inflates FlateDecode streams and reads Tj/TJ text operators. Scanned or exotic-font PDFs yield nothing. */
export function pdfToText(bytes: Uint8Array): string {
  const raw = decodeLatin(bytes);
  const parts: string[] = [];
  const re = /stream\r?\n/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    const start = m.index + m[0].length, end = raw.indexOf('endstream', start);
    if (end < 0) break;
    const header = raw.slice(Math.max(0, m.index - 300), m.index);
    let body = raw.slice(start, end);
    if (/FlateDecode/.test(header)) {
      try { body = decodeLatin(inflate(bytes.subarray(start, end))); } catch { continue; }
    }
    if (!/BT[\s\S]*ET/.test(body)) continue;
    for (const block of body.match(/BT[\s\S]*?ET/g) || []) {
      let line = '';
      for (const t of block.matchAll(/\[((?:[^\]\\]|\\.)*)\]\s*TJ|\(((?:[^()\\]|\\.)*)\)\s*(?:Tj|'|")|\b(T\*|Td|TD|ET)\b/g)) {
        if (t[1] !== undefined) line += [...t[1].matchAll(/\(((?:[^()\\]|\\.)*)\)|(-?\d+(?:\.\d+)?)/g)].map((x) => (x[1] !== undefined ? unescapePdf(x[1]) : Number(x[2]) < -200 ? ' ' : '')).join('');
        else if (t[2] !== undefined) line += unescapePdf(t[2]);
        else if (t[3]) { if (line.trim()) parts.push(line.trim()); line = ''; }
      }
      if (line.trim()) parts.push(line.trim());
    }
  }
  return parts.join('\n');
}

export async function extractFromAsset(asset: { uri: string; name: string; mimeType?: string; file?: File | Blob }): Promise<Extracted> {
  const ext = (asset.name.split('.').pop() || '').toLowerCase();
  const mime = asset.mimeType || '';
  if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'heic', 'webp', 'gif'].includes(ext)) {
    return { text: '', kind: 'image', warning: "Photos can't be read on this device yet, so nothing was saved. Type or paste what the picture says into the note box instead." };
  }
  if (ext === 'pdf' || mime === 'application/pdf') {
    const text = pdfToText(await readBytes(asset.uri, asset.file as Blob | undefined)).slice(0, MAX_CHARS);
    if (text.replace(/\s/g, '').length < 20) {
      return { text: '', kind: 'pdf', warning: "We couldn't pull text out of this PDF (it may be scanned or use special fonts). Please paste the text into the note box instead." };
    }
    return { text, kind: 'pdf' };
  }
  if (['txt', 'md', 'markdown', 'text', 'csv'].includes(ext) || mime.startsWith('text/')) {
    const text = Platform.OS === 'web' ? await ((asset.file as Blob | undefined)?.text() ?? (await fetch(asset.uri)).text()) : await new File(asset.uri).text();
    return { text: text.slice(0, MAX_CHARS), kind: 'text' };
  }
  throw new Error(`"${asset.name}" isn't supported. Choose a .txt, .md or .pdf file, or paste your notes.`);
}
