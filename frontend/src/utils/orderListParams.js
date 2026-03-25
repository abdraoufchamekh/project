const ALLOWED = new Set([
  'page',
  'limit',
  'search',
  'status',
  'excludeStatus',
  'wilaya',
  'date',
  'source'
]);

/** Keep only backend-supported query params for GET /orders. */
export function sanitizeOrderListParams(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const o = {};
  for (const k of ALLOWED) {
    if (raw[k] !== undefined) o[k] = raw[k];
  }
  return o;
}

/** Stable JSON for React Query keys (key order independent). */
export function stableOrderListKey(params) {
  const s = sanitizeOrderListParams(params);
  if (!s) return null;
  const sorted = {};
  Object.keys(s)
    .sort()
    .forEach((k) => {
      sorted[k] = s[k];
    });
  return JSON.stringify(sorted);
}
