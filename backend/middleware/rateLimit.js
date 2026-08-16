/**
 * Minimal in-memory fixed-window rate limiter.
 *
 * State lives in this process, which is correct for a single backend instance.
 * If the service is ever scaled to multiple replicas each one keeps its own
 * counter, so move this to Redis before horizontal scaling.
 */
function rateLimit({ windowMs, max, message, keyFactory }) {
  const hits = new Map();

  // Drop expired entries periodically so the map cannot grow without bound.
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (now > entry.resetAt) hits.delete(key);
    }
  }, windowMs);

  // Don't hold the event loop open just for the sweep.
  if (typeof sweep.unref === 'function') sweep.unref();

  return (req, res, next) => {
    const key = keyFactory ? keyFactory(req) : req.ip;
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || now > entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        error: message,
        retry_after_seconds: retryAfter,
      });
    }

    next();
  };
}

module.exports = rateLimit;
