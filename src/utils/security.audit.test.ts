import { describe, expect, it } from 'vitest';
import {
  calculateRankingScore,
  canModifyParty,
  isValidArticleUrl,
  normalizeRankingQuery,
  signToken,
  verifyToken,
} from './security';

describe('Security Audit & Penetration Resilience Tests', () => {
  describe('Attack Scenario 1: Stored XSS & Malicious Link Injection via article_url', () => {
    it('blocks dangerous URL schemes (javascript:, data:, vbscript:, file:)', () => {
      const maliciousPayloads = [
        'javascript:alert(document.cookie)',
        'JAVASCRIPT:alert(1)',
        'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
        'vbscript:msgbox("hello")',
        'file:///etc/passwd',
        'http://insecure-phishing.com/login',
        '//protocol-relative-url.com',
      ];

      for (const payload of maliciousPayloads) {
        expect(isValidArticleUrl(payload), `Expected ${payload} to be blocked`).toBe(false);
      }
    });

    it('allows only secure https URLs of safe length', () => {
      expect(isValidArticleUrl('https://note.com/pokemon/n/12345')).toBe(true);
      expect(isValidArticleUrl('https://x.com/poke_master/status/987654321')).toBe(true);
      expect(isValidArticleUrl('https://pokemon-champions.hatenablog.com/entry/2026/01/01/000000')).toBe(true);
    });
  });

  describe('Attack Scenario 2: BOLA / IDOR (Unauthorized party modification/deletion)', () => {
    it('strictly forbids users from modifying or deleting parties they do not own', () => {
      const attackerId = 'usr_attacker_666';
      const victimId = 'usr_victim_111';

      expect(canModifyParty(attackerId, victimId)).toBe(false);
      expect(canModifyParty('', victimId)).toBe(false);
      expect(canModifyParty(undefined, victimId)).toBe(false);
      expect(canModifyParty(victimId, victimId)).toBe(true);
    });
  });

  describe('Attack Scenario 3: Cache-Busting Economic DoS against D1 Quotas', () => {
    it('normalizes queries by stripping random cache-buster parameters (?rand=123, &t=...)', () => {
      const attackQuery1 = new URLSearchParams('page=1&sort=score&reg=all&rand=987234&_t=1726000000');
      const attackQuery2 = new URLSearchParams('rand=999999&reg=all&sort=score&page=1');

      const normalized1 = normalizeRankingQuery(attackQuery1);
      const normalized2 = normalizeRankingQuery(attackQuery2);

      // Both attack variations should collapse into the exact same normalized cache key
      expect(normalized1).toBe('page=1&reg=all&sort=score');
      expect(normalized2).toBe('page=1&reg=all&sort=score');
      expect(normalized1).toBe(normalized2);
    });
  });

  describe('Attack Scenario 4: Sybil / Bot Like Inflation (Weighted Scoring Resilience)', () => {
    it('drastically diminishes the impact of anonymous likes (0.2pt vs 1.0pt)', () => {
      const honestScore = calculateRankingScore(50, 0); // 50 authenticated likes
      const botSpoofedScore = calculateRankingScore(0, 50); // 50 anonymous bot likes

      expect(honestScore).toBe(50.0);
      expect(botSpoofedScore).toBe(10.0); // Only 20% influence
      expect(honestScore).toBeGreaterThan(botSpoofedScore);
    });
  });

  describe('Attack Scenario 5: Anonymous Session & OAuth State Tampering', () => {
    it('rejects forged HMAC-SHA256 signatures with 100% precision', async () => {
      const secret = 'production-secret-key-32-chars-long!!';
      const legitimatePayload = 'anon:valid-device-uuid-123';
      const signedToken = await signToken(legitimatePayload, secret);

      // Attempt to tamper device id
      const forgedToken = signedToken.replace('valid-device-uuid-123', 'admin-injected-id-999');
      expect(await verifyToken(forgedToken, secret)).toBeNull();
    });
  });
});
