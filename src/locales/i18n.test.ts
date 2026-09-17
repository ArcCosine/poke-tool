import { describe, expect, it } from 'vitest';
import en from './en.json';
import ja from './ja.json';
import ko from './ko.json';
import zhHans from './zh-Hans.json';
import zhHant from './zh-Hant.json';

// Utility to recursively get all dot-separated keys
function getDeepKeys(obj: Record<string, any>, prefix = ''): string[] {
  let keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys = keys.concat(getDeepKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

describe('i18n Locales Master Data and Keys', () => {
  it('should load ja.json, en.json, ko.json, zh-Hant.json, and zh-Hans.json', () => {
    expect(ja).toBeDefined();
    expect(en).toBeDefined();
    expect(ko).toBeDefined();
    expect(zhHant).toBeDefined();
    expect(zhHans).toBeDefined();
  });

  it('should have parity of keys between all 5 languages', () => {
    const jaKeys = getDeepKeys(ja).sort();
    const enKeys = getDeepKeys(en).sort();
    const koKeys = getDeepKeys(ko).sort();
    const zhHantKeys = getDeepKeys(zhHant).sort();
    const zhHansKeys = getDeepKeys(zhHans).sort();

    expect(
      jaKeys.filter((k) => !enKeys.includes(k)),
      'Keys in ja missing in en'
    ).toEqual([]);
    expect(
      enKeys.filter((k) => !jaKeys.includes(k)),
      'Keys in en missing in ja'
    ).toEqual([]);

    expect(
      jaKeys.filter((k) => !koKeys.includes(k)),
      'Keys in ja missing in ko'
    ).toEqual([]);
    expect(
      koKeys.filter((k) => !jaKeys.includes(k)),
      'Keys in ko missing in ja'
    ).toEqual([]);

    expect(
      jaKeys.filter((k) => !zhHantKeys.includes(k)),
      'Keys in ja missing in zh-Hant'
    ).toEqual([]);
    expect(
      zhHantKeys.filter((k) => !jaKeys.includes(k)),
      'Keys in zh-Hant missing in ja'
    ).toEqual([]);

    expect(
      jaKeys.filter((k) => !zhHansKeys.includes(k)),
      'Keys in ja missing in zh-Hans'
    ).toEqual([]);
    expect(
      zhHansKeys.filter((k) => !jaKeys.includes(k)),
      'Keys in zh-Hans missing in ja'
    ).toEqual([]);
  });

  it('should contain expected top-level and nested structure for all languages', () => {
    expect(ja.common.cancel).toBe('キャンセル');
    expect(en.common.cancel).toBe('Cancel');
    expect(ko.common.cancel).toBe('취소');
    expect(zhHant.common.cancel).toBe('取消');
    expect(zhHans.common.cancel).toBe('取消');

    expect(ja.evCalculator.title).toBe('努力値計算ツール');
    expect(en.evCalculator.title).toBe('EV Calculator');
    expect(ko.evCalculator.title).toBe('노력치 계산기');
    expect(zhHant.evCalculator.title).toBe('努力值計算器');
    expect(zhHans.evCalculator.title).toBe('努力值计算器');

    // cookieConsent checks
    expect(ja.cookieConsent.title).toBe('Cookieの使用について');
    expect(en.cookieConsent.title).toBe('Cookie Notice');
    expect(ko.cookieConsent.title).toBe('쿠키 사용 안내');
    expect(zhHant.cookieConsent.title).toBe('Cookie 使用說明');
    expect(zhHans.cookieConsent.title).toBe('Cookie 使用说明');
  });

  it('should localize legal texts (privacy policy, disclaimer, terms of service) in Korean, Traditional Chinese, and Simplified Chinese without Japanese remnants', () => {
    const jpKanaRegex = /[\u3041-\u3096\u30A1-\u30FA]/;

    // Korean legal text checks
    expect(ko.legal.privacyPolicyText).not.toMatch(jpKanaRegex);
    expect(ko.legal.privacyPolicyText).toContain('[소개]');
    expect(ko.privacyPolicyText).not.toMatch(jpKanaRegex);
    expect(ko.legal.disclaimerText).not.toMatch(jpKanaRegex);
    expect(ko.legal.disclaimerText).toContain('[공식 관계자와의 관계]');
    expect(ko.disclaimerText).not.toMatch(jpKanaRegex);
    expect(ko.legal.termsOfServiceText).not.toMatch(jpKanaRegex);
    expect(ko.legal.termsOfServiceText).toContain('[제1조 (약관의 적용)]');
    expect(ko.termsOfServiceText).not.toMatch(jpKanaRegex);

    // Traditional Chinese legal text checks
    expect(zhHant.legal.privacyPolicyText).not.toMatch(jpKanaRegex);
    expect(zhHant.legal.privacyPolicyText).toContain('【前言】');
    expect(zhHant.privacyPolicyText).not.toMatch(jpKanaRegex);
    expect(zhHant.legal.disclaimerText).not.toMatch(jpKanaRegex);
    expect(zhHant.legal.disclaimerText).toContain('【與官方相關機構之關係】');
    expect(zhHant.disclaimerText).not.toMatch(jpKanaRegex);
    expect(zhHant.legal.termsOfServiceText).not.toMatch(jpKanaRegex);
    expect(zhHant.legal.termsOfServiceText).toContain(
      '【第1條（條款之適用）】'
    );
    expect(zhHant.termsOfServiceText).not.toMatch(jpKanaRegex);

    // Simplified Chinese legal text checks
    expect(zhHans.legal.privacyPolicyText).not.toMatch(jpKanaRegex);
    expect(zhHans.legal.privacyPolicyText).toContain('【前言】');
    expect(zhHans.privacyPolicyText).not.toMatch(jpKanaRegex);
    expect(zhHans.legal.disclaimerText).not.toMatch(jpKanaRegex);
    expect(zhHans.legal.disclaimerText).toContain('【与官方相关机构之关系】');
    expect(zhHans.disclaimerText).not.toMatch(jpKanaRegex);
    expect(zhHans.legal.termsOfServiceText).not.toMatch(jpKanaRegex);
    expect(zhHans.legal.termsOfServiceText).toContain(
      '【第1条（条款之适用）】'
    );
    expect(zhHans.termsOfServiceText).not.toMatch(jpKanaRegex);
  });

  it('should include updated legal clauses for authentication, cloud sync, and party ranking across all locales', () => {
    // Japanese
    expect(ja.legal.privacyPolicyText).toMatch(/アカウント|OAuth/);
    expect(ja.legal.privacyPolicyText).toContain('Cookie');
    expect(ja.legal.disclaimerText).toMatch(/ユーザー投稿|公開パーティ|ランキング/);
    expect(ja.legal.termsOfServiceText).toMatch(/ランキング|スコア/);

    // English
    expect(en.legal.privacyPolicyText).toMatch(/OAuth|Account/i);
    expect(en.legal.privacyPolicyText).toContain('Cookie');
    expect(en.legal.disclaimerText).toMatch(/User-Generated|Ranking/i);
    expect(en.legal.termsOfServiceText).toMatch(/Ranking|Score/i);

    // Korean
    expect(ko.legal.privacyPolicyText).toMatch(/계정|OAuth/);
    expect(ko.legal.privacyPolicyText).toMatch(/Cookie|쿠키/);
    expect(ko.legal.disclaimerText).toMatch(/사용자 콘텐츠|공개 파티|랭킹/);
    expect(ko.legal.termsOfServiceText).toMatch(/랭킹|점수/);

    // Traditional Chinese
    expect(zhHant.legal.privacyPolicyText).toMatch(/帳號|OAuth/);
    expect(zhHant.legal.privacyPolicyText).toContain('Cookie');
    expect(zhHant.legal.disclaimerText).toMatch(/使用者生成內容|公開隊伍|排行榜/);
    expect(zhHant.legal.termsOfServiceText).toMatch(/排行榜|分數/);

    // Simplified Chinese
    expect(zhHans.legal.privacyPolicyText).toMatch(/账号|OAuth/);
    expect(zhHans.legal.privacyPolicyText).toContain('Cookie');
    expect(zhHans.legal.disclaimerText).toMatch(/用户生成内容|公开队伍|排行榜/);
    expect(zhHans.legal.termsOfServiceText).toMatch(/排行榜|分数/);
  });
});
