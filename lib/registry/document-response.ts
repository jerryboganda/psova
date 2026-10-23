// One place for how decrypted files leave the server: never cached, never sniffed, no active
// content. Images render inline; PDFs download.

const asciiFallback = (name: string) => name.replace(/[^\x20-\x7e]/g, '_').replace(/"/g, '');

export function documentResponse(doc: { bytes: Buffer; mime: string; fileName: string }): Response {
  const inline = doc.mime.startsWith('image/');
  return new Response(new Uint8Array(doc.bytes), {
    headers: {
      'Content-Type': doc.mime,
      'Content-Length': String(doc.bytes.length),
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${asciiFallback(doc.fileName)}"; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`,
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
      'Cache-Control': 'private, no-store',
    },
  });
}
