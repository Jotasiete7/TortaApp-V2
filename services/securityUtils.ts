/**
 * securityUtils.ts
 * Utilities for sanitizing sensitive data before public display
 */

/**
 * Removes authentication tokens from text
 * Patterns: @TORTA_*, @TORTA-*, @tortaapp*
 */
export const removeAuthTokens = (text: string): string => {
  if (!text) return text;
  
  return text
    .replace(/@TORTA_[A-Z0-9#]+/gi, '')
    .replace(/@TORTA-[A-Z0-9#]+/gi, '')
    .replace(/@tortaapp\s+\d+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const sanitizeItemName = (name: string): string => {
  if (!name) return 'Unknown Item';
  let sanitized = removeAuthTokens(name);
  if (!sanitized || sanitized.length < 2) return 'Unknown Item';
  return sanitized;
};

export const sanitizeSeller = (seller: string): string => {
  if (!seller) return 'Unknown';
  let sanitized = removeAuthTokens(seller);
  if (!sanitized || sanitized.length < 2) return 'Unknown';
  return sanitized;
};
