import { API_BASE_URL } from './constants';

/**
 * Cloudinary delivery URL with auto format/quality and bounded dimensions (list / cards).
 * Full-size / download uses getPhotoUrlOriginal.
 */
export function getPhotoUrl(filename, options = {}) {
  if (!filename) return '';
  const { width = 1200 } = options;

  if (filename.startsWith('http')) {
    const m = filename.match(/^(https?:\/\/res\.cloudinary\.com\/[^/]+\/(?:image|video)\/upload\/)(.+)$/);
    if (m) {
      const [, prefix, rest] = m;
      if (/^(f_|q_|w_|c_)/.test(rest)) return filename;
      return `${prefix}f_auto,q_auto,w_${width},c_limit/${rest}`;
    }
    return filename;
  }

  return `${API_BASE_URL.replace('/api', '')}/uploads/${filename}`;
}

export function getPhotoUrlThumbnail(filename) {
  return getPhotoUrl(filename, { width: 400, quality: 'auto:low' });
}

export function getPhotoUrlOriginal(filename) {
  if (!filename) return '';
  if (filename.startsWith('http')) return filename;
  return `${API_BASE_URL.replace('/api', '')}/uploads/${filename}`;
}
