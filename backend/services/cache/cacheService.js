/**
 * Unified Cache Service for AyurSutra
 * 
 * Provides high-performance Cache-Aside pattern with:
 * - In-process memory store with per-key TTL and LRU max-key eviction (zero infrastructure cost)
 * - Safe pattern-based invalidation (e.g., 'analytics:*', 'availability:123:*')
 * - Automatic graceful degradation (errors never crash the app)
 * - Cache metrics observability (hits, misses, sets, evictions)
 */

class CacheService {
  constructor(options = {}) {
    this.maxEntries = options.maxEntries || 5000;
    this.defaultTTL = options.defaultTTL || 300; // 5 minutes default
    this.store = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };

    // Periodic sweep for expired keys every 60 seconds
    this.cleanupInterval = setInterval(() => {
      this._sweepExpired();
    }, 60000);

    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref(); // Don't block process exit
    }
  }

  /**
   * Get cached item if present and not expired
   */
  get(key) {
    if (!key) return null;
    const entry = this.store.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();
    if (entry.expiresAt && entry.expiresAt <= now) {
      this.store.delete(key);
      this.stats.misses++;
      return null;
    }

    // Refresh access order (LRU touch)
    this.store.delete(key);
    this.store.set(key, entry);

    this.stats.hits++;
    return entry.value;
  }

  /**
   * Store item with TTL in seconds
   */
  set(key, value, ttlSeconds = this.defaultTTL) {
    if (!key || value === undefined) return false;

    // Enforce max capacity (evict oldest inserted/accessed entry)
    if (this.store.size >= this.maxEntries && !this.store.has(key)) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) {
        this.store.delete(oldestKey);
        this.stats.evictions++;
      }
    }

    const expiresAt = ttlSeconds > 0 ? Date.now() + (ttlSeconds * 1000) : null;
    this.store.set(key, { value, expiresAt });
    this.stats.sets++;
    return true;
  }

  /**
   * Delete specific key
   */
  del(key) {
    if (!key) return false;
    const deleted = this.store.delete(key);
    if (deleted) this.stats.deletes++;
    return deleted;
  }

  /**
   * Delete keys matching a wildcard pattern (e.g., 'analytics:*' or 'availability:123:*')
   */
  delPattern(pattern) {
    if (!pattern) return 0;
    let count = 0;
    const regexPattern = '^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$';
    const regex = new RegExp(regexPattern);

    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        count++;
      }
    }

    this.stats.deletes += count;
    return count;
  }

  /**
   * Cache-Aside Helper:
   * Check cache -> on hit return -> on miss call fetchFn() -> set cache -> return
   */
  async wrap(key, ttlSeconds, fetchFn) {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    try {
      const freshValue = await fetchFn();
      if (freshValue !== undefined && freshValue !== null) {
        this.set(key, freshValue, ttlSeconds);
      }
      return freshValue;
    } catch (err) {
      // Re-throw database/business errors without caching errors
      throw err;
    }
  }

  /**
   * Evict expired keys from storage
   */
  _sweepExpired() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt && entry.expiresAt <= now) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.store.clear();
  }

  /**
   * Get metrics and health
   */
  getMetrics() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? Number(((this.stats.hits / totalRequests) * 100).toFixed(1)) : 0;
    return {
      size: this.store.size,
      maxEntries: this.maxEntries,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: `${hitRate}%`,
      sets: this.stats.sets,
      deletes: this.stats.deletes,
      evictions: this.stats.evictions
    };
  }
}

// Export singleton instance
module.exports = new CacheService();
