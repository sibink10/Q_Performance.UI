import DOMPurify from 'dompurify';

const HTML_TAG_RE = /<\/?[a-z][\s\S]*>/i;

export function isProbablyHtml(value: unknown) {
  if (typeof value !== 'string') return false;
  return HTML_TAG_RE.test(value);
}

export function sanitizeRichTextHtml(html: string) {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
  });
}

export function richTextHtmlToPlainText(html: string) {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || '').replace(/\u00A0/g, ' ').trim();
}

export function plainTextToHtml(text: string) {
  const safe = DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return safe.replace(/\n/g, '<br/>');
}

export function normalizeQuestionTextToHtml(value: unknown) {
  const s = typeof value === 'string' ? value : '';
  if (!s.trim()) return '';
  if (isProbablyHtml(s)) return s;
  return plainTextToHtml(s);
}

