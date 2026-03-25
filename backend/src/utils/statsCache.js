/** Short-lived in-memory cache for aggregated stats (reduces repeated GROUP BY load). */
let statsCache = { data: null, expiresAt: 0 };
const TTL_MS = parseInt(process.env.STATS_CACHE_TTL_MS || '30000', 10);

function getCachedStats() {
  if (statsCache.data && Date.now() < statsCache.expiresAt) {
    return statsCache.data;
  }
  return null;
}

function setCachedStats(data) {
  statsCache = { data, expiresAt: Date.now() + TTL_MS };
}

function invalidateStatsCache() {
  statsCache = { data: null, expiresAt: 0 };
}

module.exports = { getCachedStats, setCachedStats, invalidateStatsCache };
