import DOMPurify from 'dompurify';

const HTML_TAG_RE = /<\/?[a-z][\s\S]*>/i;

/** Inline images from the rich text editor use data URLs; allow only image/* base64. */
const SAFE_DATA_IMAGE_SRC = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/i;

const SAFE_IMG_DIM_ATTR = /^\d+(\.\d+)?(px|%)?$/;

function isSafeImgInlineStyle(value: string) {
  if (!value || value.length > 4000) return false;
  if (/expression|url\s*\(|javascript|@import|behavior|moz-binding|<\/?/i.test(value)) return false;
  return /^[\w\s\-:;.%(),#]+$/i.test(value);
}

function allowImgAttributesUponSanitizeAttribute(
  node: Element,
  data: { attrName: string; attrValue: string; keepAttr?: boolean },
) {
  if (node.nodeName !== 'IMG' || typeof data.attrValue !== 'string') {
    return;
  }
  if (data.attrName === 'src' && SAFE_DATA_IMAGE_SRC.test(data.attrValue)) {
    data.keepAttr = true;
    return;
  }
  if (data.attrName === 'style' && isSafeImgInlineStyle(data.attrValue)) {
    data.keepAttr = true;
    return;
  }
  if (
    (data.attrName === 'width' || data.attrName === 'height') &&
    SAFE_IMG_DIM_ATTR.test(data.attrValue.trim())
  ) {
    data.keepAttr = true;
  }
}

export function isProbablyHtml(value: unknown) {
  if (typeof value !== 'string') return false;
  return HTML_TAG_RE.test(value);
}

export function sanitizeRichTextHtml(html: string) {
  DOMPurify.addHook('uponSanitizeAttribute', allowImgAttributesUponSanitizeAttribute);
  try {
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
    });
  } finally {
    DOMPurify.removeHook('uponSanitizeAttribute', allowImgAttributesUponSanitizeAttribute);
  }
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

