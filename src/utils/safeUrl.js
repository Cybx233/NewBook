const SAFE_PROTOCOLS = ['http:', 'https:', 'ftp:']

/**
 * Validate that a URL uses a safe protocol.
 * Blocks javascript:, data:, vbscript: and other dangerous schemes.
 * @param {string} url
 * @returns {boolean}
 */
export function isSafeUrl(url) {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return SAFE_PROTOCOLS.includes(parsed.protocol)
  } catch {
    return false
  }
}
