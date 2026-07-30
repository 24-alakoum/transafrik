import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * Configure les limiteurs de requêtes via Upstash Redis.
 * Utilisé dans le middleware et les Server Actions sensibles.
 */

// Initialisation globale pour réutiliser la connexion Redis
const redis = Redis.fromEnv()

// ── Rate Limiters spécifiques ────────────────────────

const createSafeLimiter = (limiter: Ratelimit) => {
  return {
    limit: async (ip: string) => {
      try {
        return await limiter.limit(ip);
      } catch (e) {
        console.warn('Redis rate limit error, bypassing for', ip);
        return { success: true };
      }
    }
  }
}

export const rateLimiters = {
  // Limiteur global pour l'API (100 requêtes / minute)
  api: createSafeLimiter(new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
    prefix: '@upstash/ratelimit/api',
  })),

  // Limiteur pour l'authentification (5 tentatives / 15 minutes)
  login: createSafeLimiter(new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    analytics: true,
    prefix: '@upstash/ratelimit/login',
  })),

  // Limiteur pour l'inscription (3 inscriptions / heure)
  register: createSafeLimiter(new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 h'),
    analytics: true,
    prefix: '@upstash/ratelimit/register',
  })),

  // Limiteur pour les emails (10 emails / heure / company)
  email: createSafeLimiter(new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'),
    analytics: true,
    prefix: '@upstash/ratelimit/email',
  })),

  // Limiteur pour l'export RGPD (2 exports / 24h)
  export: createSafeLimiter(new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(2, '24 h'),
    analytics: true,
    prefix: '@upstash/ratelimit/export',
  })),
}
