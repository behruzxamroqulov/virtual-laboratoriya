/**
 * Talaba yuklagan ko'p faylli (index.html + style.css + script.js + rasmlar)
 * web-loyihasini bitta, tashqi so'rovlarga muhtoj bo'lmagan HTML matniga
 * birlashtiradi. Natija <iframe sandbox="allow-scripts"> ichiga `srcdoc`
 * sifatida beriladi — shu sababli u har doim "null" originda ishlaydi va
 * asosiy platformaning cookie/tokenlariga umuman kira olmaydi.
 *
 * Nega inline qilamiz: sandbox="allow-scripts" (allow-same-origin'siz)
 * berilganda, iframe ichidagi kod nisbiy manzillar (masalan style.css)
 * bo'yicha tarmoq so'rovi yubora olmaydi/yubora olsa ham xavfli bo'lardi —
 * shuning uchun CSS va JS to'g'ridan-to'g'ri HTML ichiga, rasmlar esa
 * data: URI sifatida joylashtiriladi.
 */

export type ProjectFile = {
  fileName: string;
  url: string;
  mimeType: string;
};

async function fetchAsText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) return `/* fayl yuklanmadi: ${url} */`;
  return res.text();
}

async function fetchAsDataUri(url: string, mimeType: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) return '';
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:${mimeType};base64,${buf.toString('base64')}`;
}

function isImage(mime: string) {
  return mime.startsWith('image/') || mime.includes('font');
}

export async function buildSandboxDocument(files: ProjectFile[]): Promise<string> {
  const indexFile = files.find((f) => f.fileName.toLowerCase() === 'index.html') || files.find((f) => f.mimeType === 'text/html');

  if (!indexFile) {
    return wrapError('index.html topilmadi. Iltimos, loyihangizda index.html fayli bo\'lishini tekshiring.');
  }

  let html = await fetchAsText(indexFile.url);

  // Rasm/font fayllarni data: URI'ga aylantirib, nisbiy yo'llarni almashtiramiz
  const assetFiles = files.filter((f) => isImage(f.mimeType));
  for (const asset of assetFiles) {
    const dataUri = await fetchAsDataUri(asset.url, asset.mimeType);
    if (!dataUri) continue;
    const base = asset.fileName.split('/').pop() || asset.fileName;
    const pattern = new RegExp(`(["'\\(])(?:\\./)?(?:assets/|images/)?${escapeRegExp(base)}(["'\\)])`, 'g');
    html = html.replace(pattern, `$1${dataUri}$2`);
  }

  // Alohida CSS fayllarni <style> sifatida <head> ichiga joylaymiz
  const cssFiles = files.filter((f) => f.mimeType === 'text/css');
  let inlineStyles = '';
  for (const cssFile of cssFiles) {
    const cssText = await fetchAsText(cssFile.url);
    inlineStyles += `\n<style data-source="${escapeHtml(cssFile.fileName)}">\n${cssText}\n</style>\n`;
  }
  // <link rel="stylesheet" href="style.css"> qatorlarini olib tashlaymiz (endi inline)
  html = html.replace(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi, '');
  html = html.includes('</head>') ? html.replace('</head>', `${inlineStyles}</head>`) : inlineStyles + html;

  // Alohida JS fayllarni <script> sifatida joylaymiz
  const jsFiles = files.filter((f) => f.mimeType === 'application/javascript' || f.mimeType === 'text/javascript');
  let inlineScripts = '';
  for (const jsFile of jsFiles) {
    const jsText = await fetchAsText(jsFile.url);
    inlineScripts += `\n<script data-source="${escapeHtml(jsFile.fileName)}">\n${jsText}\n</script>\n`;
  }
  html = html.replace(/<script[^>]+src=["'][^"']*\.js["'][^>]*>\s*<\/script>/gi, '');
  html = html.includes('</body>') ? html.replace('</body>', `${inlineScripts}</body>`) : html + inlineScripts;

  return html;
}

function wrapError(message: string): string {
  return `<!doctype html><html><body style="font-family:sans-serif;color:#b91c1c;padding:24px;">${escapeHtml(message)}</body></html>`;
}

function escapeHtml(str: string) {
  return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
