/**
 * Token Blacklist Service
 * Manages revoked JWT tokens using an in-memory Set
 *
 * NOTE: For production with multiple server instances, use Redis instead
 */

// Store blacklisted tokens (token hash -> expiration timestamp)
const blacklistedTokens = new Map<string, number>()

// Cleanup interval: remove expired tokens every hour
const CLEANUP_INTERVAL = 60 * 60 * 1000 // 1 hour
setInterval(() => {
  const now = Date.now()
  for (const [token, expiry] of blacklistedTokens.entries()) {
    if (expiry < now) {
      blacklistedTokens.delete(token)
    }
  }
}, CLEANUP_INTERVAL)

/**
 * Add a token to the blacklist
 * @param token - The JWT token to blacklist
 * @param expiresAt - When the token naturally expires (in milliseconds)
 */
export function blacklistToken(token: string, expiresAt: number): void {
  blacklistedTokens.set(token, expiresAt)
}

/**
 * Check if a token is blacklisted
 * @param token - The JWT token to check
 * @returns true if the token is blacklisted
 */
export function isTokenBlacklisted(token: string): boolean {
  const expiry = blacklistedTokens.get(token)

  if (!expiry) {
    return false
  }

  // If token has expired naturally, remove from blacklist and return false
  if (expiry < Date.now()) {
    blacklistedTokens.delete(token)
    return false
  }

  return true
}

/**
 * Clear all blacklisted tokens (useful for testing)
 */
export function clearBlacklist(): void {
  blacklistedTokens.clear()
}

/**
 * Get blacklist stats (useful for monitoring)
 */
export function getBlacklistStats(): { count: number; oldestExpiry: number | null } {
  const count = blacklistedTokens.size
  const expiries = Array.from(blacklistedTokens.values())
  const oldestExpiry = expiries.length > 0 ? Math.min(...expiries) : null

  return { count, oldestExpiry }
}
