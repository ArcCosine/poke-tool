import { describe, expect, it } from 'vitest';
import en from './en.json';
import ja from './ja.json';
import ko from './ko.json';
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
  it('should load ja.json, en.json, ko.json, and zh-Hant.json', () => {
    expect(ja).toBeDefined();
    expect(en).toBeDefined();
    expect(ko).toBeDefined();
    expect(zhHant).toBeDefined();
  });

  it('should have parity of keys between all 4 languages', () => {
    const jaKeys = getDeepKeys(ja).sort();
    const enKeys = getDeepKeys(en).sort();
    const koKeys = getDeepKeys(ko).sort();
    const zhHantKeys = getDeepKeys(zhHant).sort();

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
  });

  it('should contain expected top-level and nested structure for all languages', () => {
    expect(ja.common.cancel).toBe('キャンセル');
    expect(en.common.cancel).toBe('Cancel');
    expect(ko.common.cancel).toBe('취소');
    expect(zhHant.common.cancel).toBe('取消');

    expect(ja.evCalculator.title).toBe('努力値計算ツール');
    expect(en.evCalculator.title).toBe('EV Calculator');
    expect(ko.evCalculator.title).toBe('노력치 계산기');
    expect(zhHant.evCalculator.title).toBe('努力值計算器');
  });

  it('should localize legal texts (privacy policy, disclaimer, terms of service) in Korean and Traditional Chinese without Japanese remnants', () => {
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
  });
});
