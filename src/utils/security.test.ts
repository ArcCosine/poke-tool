import { describe, expect, it } from 'vitest';
import {
  calculateRankingScore,
  canModifyParty,
  isValidArticleUrl,
  normalizeRankingQuery,
  signToken,
  verifyToken,
} from './security';

describe('Security and Validation Utilities', () => {
  describe('isValidArticleUrl', () => {
    it('should accept valid https URLs', () => {
      expect(isValidArticleUrl('https://note.com/user/n/n12345')).toBe(true);
      expect(isValidArticleUrl('https://x.com/user/status/123')).toBe(true);
      expect(isValidArticleUrl('https://example.hatenablog.com/entry/2026/01/01/000000')).toBe(true);
    });

    it('should reject non-https URLs', () => {
      expect(isValidArticleUrl('http://insecure.example.com')).toBe(false);
      expect(isValidArticleUrl('javascript:alert(1)')).toBe(false);
      expect(isValidArticleUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(isValidArticleUrl('ftp://ftp.example.com')).toBe(false);
    });

    it('should reject URLs exceeding 255 characters or malformed strings', () => {
      const longUrl = `https://example.com/${'a'.repeat(250)}`;
      expect(isValidArticleUrl(longUrl)).toBe(false);
      expect(isValidArticleUrl('')).toBe(false);
      expect(isValidArticleUrl('not-a-url')).toBe(false);
    });
  });

  describe('HMAC-SHA256 Token Signing and Verification', () => {
    const SECRET = 'test-secret-key-12345678901234567890';

    it('should sign and verify valid payload', async () => {
      const payload = 'anon:550e8400-e29b-41d4-a716-446655440000';
      const token = await signToken(payload, SECRET);
      expect(token).toContain('.');

      const verified = await verifyToken(token, SECRET);
      expect(verified).toBe(payload);
    });

    it('should reject tampered tokens', async () => {
      const payload = 'anon:550e8400-e29b-41d4-a716-446655440000';
      const token = await signToken(payload, SECRET);
      const [data, sig] = token.split('.');

      // Tamper data
      const tamperedDataToken = `anon:tampered.${sig}`;
      expect(await verifyToken(tamperedDataToken, SECRET)).toBeNull();

      // Tamper signature
      const tamperedSigToken = `${data}.invalidsig123`;
      expect(await verifyToken(tamperedSigToken, SECRET)).toBeNull();

      // Wrong secret
      expect(await verifyToken(token, 'different-secret')).toBeNull();
    });

    it('should reject malformed token strings', async () => {
      expect(await verifyToken('no-dot-token', SECRET)).toBeNull();
      expect(await verifyToken('', SECRET)).toBeNull();
    });
  });

  describe('calculateRankingScore', () => {
    it('should calculate weighted score correctly (auth=1.0, anon=0.2)', () => {
      expect(calculateRankingScore(0, 0)).toBe(0);
      expect(calculateRankingScore(10, 0)).toBe(10);
      expect(calculateRankingScore(0, 10)).toBe(2);
      expect(calculateRankingScore(5, 5)).toBe(6);
      expect(calculateRankingScore(12, 7)).toBe(13.4);
    });
  });

  describe('canModifyParty', () => {
    it('should allow modification only when user_id matches party owner', () => {
      expect(canModifyParty('user_123', 'user_123')).toBe(true);
      expect(canModifyParty('user_123', 'user_456')).toBe(false);
      expect(canModifyParty(undefined, 'user_123')).toBe(false);
      expect(canModifyParty('', 'user_123')).toBe(false);
    });
  });

  describe('normalizeRankingQuery', () => {
    it('should keep only allowed parameters and sort keys for cache consistency', () => {
      const query = new URLSearchParams('page=2&sort=popular&reg=reg-g&rand=12345&utm_source=twitter');
      const normalized = normalizeRankingQuery(query);
      expect(normalized).toBe('page=2&reg=reg-g&sort=popular');
    });

    it('should apply default values when parameters are missing', () => {
      const query = new URLSearchParams('');
      const normalized = normalizeRankingQuery(query);
      expect(normalized).toBe('page=1&reg=all&sort=score');
    });
  });
});
