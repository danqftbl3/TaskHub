const TEXT_EXT = ['txt', 'md', 'markdown', 'text', 'csv'];
const MAX_PAGES = 80;

/** Extract text locally in the browser. Nothing is uploaded anywhere. */
export async function extractText(file) {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (file.type.startsWith('image/')) {
    return { text: '', kind: 'image', warning: "Photos can't be read offline yet, so the picture isn't kept. Type or paste what it says below and we'll build your guide from that." };
  }
  if (ext === 'pdf' || file.type === 'application/pdf') {
    const pdfjs = await import('pdfjs-dist');
    const worker = (await import('pdfjs-dist/build/pdf.worker.min.js?url')).default;
    pdfjs.GlobalWorkerOptions.workerSrc = worker;
    const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    let text = '';
    for (let p = 1; p <= Math.min(doc.numPages, MAX_PAGES); p++) {
      const items = (await (await doc.getPage(p)).getTextContent()).items;
      for (const it of items) {
        text += it.str;
        text += it.hasEOL && /[.!?:]\s*$/.test(it.str) ? '\n' : ' ';
      }
      text += '\n';
    }
    if (text.replace(/\s/g, '').length < 20) {
      return { text: '', kind: 'pdf', warning: 'No selectable text found (this may be a scanned PDF). Paste the text below instead.' };
    }
    return { text, kind: 'pdf', truncated: doc.numPages > MAX_PAGES };
  }
  if (TEXT_EXT.includes(ext) || file.type.startsWith('text/')) return { text: await file.text(), kind: 'text' };
  throw new Error(`"${file.name}" isn't supported. Use a PDF, .txt, .md or an image.`);
}
