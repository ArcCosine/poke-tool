import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

describe('OGP Image and Meta Tags Verification', () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const rootDir = path.resolve(__dirname, '..');
  const publicOgpPath = path.join(rootDir, 'public', 'ogp.png');

  it('should have public/ogp.png generated and non-empty', () => {
    expect(fs.existsSync(publicOgpPath)).toBe(true);
    const stats = fs.statSync(publicOgpPath);
    expect(stats.size).toBeGreaterThan(1000); // Should be a valid PNG file > 1KB
  });

  const htmlFiles = [
    { file: 'index.html', title: 'Poke-Tool - Pokémon Champions Analytics' },
    { file: 'party.html', title: 'パーティ編成 - Poke-Tool' },
    { file: 'ev-calculator.html', title: '努力値計算 - Poke-Tool' },
    { file: 'ranking.html', title: 'ランキング - Poke-Tool' },
    { file: 'privacy.html', title: 'プライバシーポリシー - Poke-Tool' },
    { file: 'terms.html', title: '利用規約 - Poke-Tool' },
    { file: 'disclaimer.html', title: '免責事項 - Poke-Tool' },
  ];

  for (const { file, title } of htmlFiles) {
    it(`should include OGP and Twitter Card meta tags in ${file}`, () => {
      const filePath = path.join(rootDir, file);
      expect(fs.existsSync(filePath)).toBe(true);

      const content = fs.readFileSync(filePath, 'utf-8');

      // Check essential OGP tags
      expect(content).toContain('<meta property="og:type" content="website"');
      expect(content).toContain(
        '<meta property="og:image" content="https://poke-tool.pages.dev/ogp.png"'
      );
      expect(content).toContain(
        '<meta property="og:image:width" content="1200"'
      );
      expect(content).toContain(
        '<meta property="og:image:height" content="630"'
      );
      expect(content).toContain(
        '<meta property="og:site_name" content="Poke-Tool"'
      );

      // Check Twitter Card tags
      expect(content).toContain(
        '<meta name="twitter:card" content="summary_large_image"'
      );
      expect(content).toContain(
        '<meta name="twitter:image" content="https://poke-tool.pages.dev/ogp.png"'
      );

      // Check title presence
      expect(content).toContain(`<title>${title}</title>`);
      expect(content).toContain(`content="${title}"`);
    });
  }
});
