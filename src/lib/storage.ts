import { put, del } from '@vercel/blob';
import { randomUUID } from 'crypto';

export const WEB_PROJECT_EXTENSIONS = ['.html', '.htm', '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2'];
export const WEB_PROJECT_MIME = [
  'text/html', 'text/css', 'application/javascript', 'text/javascript',
  'image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'font/woff', 'font/woff2'
];

export const REPORT_EXTENSIONS = ['.doc', '.docx', '.pdf', '.png', '.jpeg', '.jpg', '.txt', '.ppt', '.pptx'];
export const REPORT_MIME = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/pdf',
  'image/png', 'image/jpeg',
  'text/plain',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
];

export const MAX_WEB_FILE_BYTES = 3 * 1024 * 1024; // 3 MB / fayl
export const MAX_REPORT_FILE_BYTES = 25 * 1024 * 1024; // 25 MB / fayl

function getExtension(fileName: string): string {
  const idx = fileName.lastIndexOf('.');
  return idx === -1 ? '' : fileName.slice(idx).toLowerCase();
}

/** Fayl nomi va turini ruxsat etilgan ro'yxatga qarshi tekshiradi. Path traversalni ham bloklaydi. */
export function validateUpload(
  fileName: string,
  mimeType: string,
  sizeBytes: number,
  kind: 'web' | 'report'
): { ok: true } | { ok: false; error: string } {
  // Path traversal himoyasi — fayl nomida "/" , ".." yoki backslash bo'lmasin
  if (fileName.includes('..') || fileName.includes('\\') || fileName.startsWith('/')) {
    return { ok: false, error: "Fayl nomi noto'g'ri formatda." };
  }

  const ext = getExtension(fileName);
  const allowedExt = kind === 'web' ? WEB_PROJECT_EXTENSIONS : REPORT_EXTENSIONS;
  const allowedMime = kind === 'web' ? WEB_PROJECT_MIME : REPORT_MIME;
  const maxSize = kind === 'web' ? MAX_WEB_FILE_BYTES : MAX_REPORT_FILE_BYTES;

  if (!allowedExt.includes(ext)) {
    return { ok: false, error: `"${ext}" kengaytmasiga ruxsat berilmagan.` };
  }
  if (!allowedMime.includes(mimeType)) {
    return { ok: false, error: 'Fayl turi (MIME) ruxsat etilmagan yoki nomga mos kelmaydi.' };
  }
  if (sizeBytes <= 0 || sizeBytes > maxSize) {
    return { ok: false, error: `Fayl hajmi ruxsat etilgan limitdan (${Math.round(maxSize / 1024 / 1024)} MB) oshib ketdi.` };
  }

  return { ok: true };
}

/** Faylni Vercel Blob'ga random kalit bilan yuklaydi — original fayl nomi serverda saqlanmaydi. */
export async function uploadToBlob(fileName: string, file: Buffer | Blob, contentType: string) {
  const ext = getExtension(fileName);
  const randomKey = `${randomUUID()}${ext}`;
  const blob = await put(randomKey, file, {
    access: 'public',
    contentType,
    addRandomSuffix: false
  });
  return { storageKey: randomKey, url: blob.url };
}

export async function deleteFromBlob(url: string) {
  try {
    await del(url);
  } catch (err) {
    console.error('Blob delete xatosi:', err);
  }
}
