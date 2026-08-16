import { describe, expect, it } from 'vitest';
import {
  calculateDamageIndex,
  calculateMaxDamage,
  calculateMaxDurability,
  calculateStat,
} from './calculator';
import type { MoveMaster, PokemonMaster } from './db';

describe('calculator utilities', () => {
  describe('calculateStat', () => {
    it('should calculate HP correctly at level 50', () => {
      // Blastoise (HP base: 79), IV: 31, EV: 252 -> Max HP
      const hp = calculateStat('hp', 79, 31, 252, 50);
      expect(hp).toBe(186); // 79 + 75 + 63 = 186
    });

    it('should calculate other stats with neutral nature correctly', () => {
      // Blastoise (Sp.Atk base: 85), IV: 31, EV: 252, Nature: 1.0
      const stat = calculateStat('sp_attack', 85, 31, 252, 50, 1.0);
      expect(stat).toBe(137); // floor(85 + 20 + 63) * 1.0 = 168 / 137?
      // Wait, let's verify formula:
      // stat = floor( (base * 2 + iv + floor(ev/4)) * level / 100 ) + 5
      // For level 50, iv 31, ev 252:
      // floor( (85 * 2 + 31 + 63) * 0.5 ) + 5 = floor( (170 + 94) * 0.5 ) + 5 = floor(264 * 0.5) + 5 = 132 + 5 = 137. Yes!
    });

    it('should calculate other stats with positive nature correctly', () => {
      // Blastoise (Sp.Atk base: 85), IV: 31, EV: 252, Nature: 1.1 (max stat)
      const stat = calculateStat('sp_attack', 85, 31, 252, 50, 1.1);
      expect(stat).toBe(150); // floor(137 * 1.1) = 150
    });
  });

  describe('calculateDamageIndex', () => {
    it('should calculate damage index with STAB', () => {
      const index = calculateDamageIndex(150, 120, true);
      expect(index).toBe(27000); // 150 * 120 * 1.5 = 27000
    });

    it('should calculate damage index without STAB', () => {
      const index = calculateDamageIndex(150, 120, false);
      expect(index).toBe(18000); // 150 * 120 * 1.0 = 18000
    });
  });

  describe('calculateMaxDamage', () => {
    it('should find maximum damage index for a pokemon based on its learnable moves', () => {
      const mockPokemon: PokemonMaster = {
        id: 9,
        name: { ja: 'カメックス', en: 'Blastoise' },
        types: ['water'],
        base_stats: {
          hp: 79,
          attack: 83,
          defense: 100,
          sp_attack: 85,
          sp_defense: 105,
          speed: 78,
        },
        abilities: [{ ja: 'げきりゅう', en: 'torrent' }],
        regulations: ['M-A'],
        learnable_moves: [1, 2], // Hydro Pump (water, power 110), Ice Beam (ice, power 90)
      };

      const mockMoves: MoveMaster[] = [
        {
          id: 1,
          name: { ja: 'ハイドロポンプ', en: 'Hydro Pump' },
          type: 'water',
          category: 'special',
          power: 110,
          accuracy: 80,
          pp: 5,
        },
        {
          id: 2,
          name: { ja: 'れいとうビーム', en: 'Ice Beam' },
          type: 'ice',
          category: 'special',
          power: 90,
          accuracy: 100,
          pp: 10,
        },
      ];

      const maxDmg = calculateMaxDamage(mockPokemon, mockMoves);
      // Sp.Atk max is 150 (neutral 137 * 1.1).
      // Hydro Pump power 110, Torrent -> 110 * 1.5 = 165. STAB: true -> 165 * 1.5 = 247.5. Damage: 150 * 247.5 = 37125
      expect(maxDmg[0].value).toBe(37125);
      expect(maxDmg[0].moveName.ja).toBe('ハイドロポンプ');
      expect(maxDmg[0].abilityName.ja).toBe('げきりゅう');
    });

    it('should apply Technician correctly for moves with power <= 60', () => {
      const mockPokemon: PokemonMaster = {
        id: 212,
        name: { ja: 'ハッサム', en: 'Scizor' },
        types: ['bug', 'steel'],
        base_stats: {
          hp: 70,
          attack: 130,
          defense: 100,
          sp_attack: 55,
          sp_defense: 80,
          speed: 65,
        },
        abilities: [{ ja: 'テクニシャン', en: 'Technician' }],
        regulations: ['M-A'],
        learnable_moves: [1, 2],
      };

      const mockMoves: MoveMaster[] = [
        {
          id: 1,
          name: { ja: 'バレットパンチ', en: 'Bullet Punch' },
          type: 'steel',
          category: 'physical',
          power: 40,
          accuracy: 100,
          pp: 30,
        },
        {
          id: 2,
          name: { ja: 'アイアンヘッド', en: 'Iron Head' },
          type: 'steel',
          category: 'physical',
          power: 80,
          accuracy: 100,
          pp: 15,
        },
      ];

      // Attack max is 200 (base 130: neutral 182 * 1.1 = 200.2 -> 200).
      // Bullet Punch: power 40 <= 60 -> Technician -> 40 * 1.5 = 60. STAB -> 60 * 1.5 = 90. Damage index = 200 * 90 = 18000.
      // Iron Head: power 80 > 60 -> No Technician -> 80 * 1.5 = 120. Damage index = 200 * 120 = 24000.
      // Iron Head is stronger.
      const maxDmg = calculateMaxDamage(mockPokemon, mockMoves);
      expect(maxDmg[0].value).toBe(24000);
      expect(maxDmg[0].abilityName.ja).toBe('テクニシャン');
    });

    it('should make Bullet Punch stronger with Technician if other moves are weaker', () => {
      const mockPokemon: PokemonMaster = {
        id: 212,
        name: { ja: 'ハッサム', en: 'Scizor' },
        types: ['bug', 'steel'],
        base_stats: {
          hp: 70,
          attack: 130,
          defense: 100,
          sp_attack: 55,
          sp_defense: 80,
          speed: 65,
        },
        abilities: [{ ja: 'テクニシャン', en: 'Technician' }],
        regulations: ['M-A'],
        learnable_moves: [1, 3],
      };

      const mockMoves: MoveMaster[] = [
        {
          id: 1,
          name: { ja: 'バレットパンチ', en: 'Bullet Punch' },
          type: 'steel',
          category: 'physical',
          power: 40,
          accuracy: 100,
          pp: 30,
        },
        {
          id: 3,
          name: { ja: 'メタルクロー', en: 'Metal Claw' },
          type: 'steel',
          category: 'physical',
          power: 50,
          accuracy: 95,
          pp: 35,
        },
      ];

      // Bullet Punch: 40 * 1.5 * 1.5 * 200 = 18000
      // Metal Claw: 50 * 1.5 * 1.5 * 200 = 22500
      const maxDmg = calculateMaxDamage(mockPokemon, mockMoves);
      expect(maxDmg[0].value).toBe(22500);
      expect(maxDmg[0].moveName.ja).toBe('メタルクロー');
      expect(maxDmg[0].abilityName.ja).toBe('テクニシャン');
    });

    it('should apply Huge Power correctly', () => {
      const mockPokemon: PokemonMaster = {
        id: 184,
        name: { ja: 'マリルリ', en: 'Azumarill' },
        types: ['water', 'fairy'],
        base_stats: {
          hp: 100,
          attack: 50,
          defense: 80,
          sp_attack: 60,
          sp_defense: 80,
          speed: 50,
        },
        abilities: [{ ja: 'ちからもち', en: 'Huge Power' }],
        regulations: ['M-A'],
        learnable_moves: [1],
      };

      const mockMoves: MoveMaster[] = [
        {
          id: 1,
          name: { ja: 'じゃれつく', en: 'Play Rough' },
          type: 'fairy',
          category: 'physical',
          power: 90,
          accuracy: 90,
          pp: 10,
        },
      ];

      // Attack base 50 max: neutral 102 * 1.1 = 112
      // Huge Power: Attack stat is doubled -> 112 * 2 = 224
      // Play Rough: power 90. STAB -> 90 * 1.5 = 135
      // Index = 224 * 135 = 30240
      const maxDmg = calculateMaxDamage(mockPokemon, mockMoves);
      expect(maxDmg[0].value).toBe(30240);
      expect(maxDmg[0].abilityName.ja).toBe('ちからもち');
    });

    it('should apply Sand Force correctly', () => {
      const mockPokemon: PokemonMaster = {
        id: 526,
        name: { ja: 'ギガイアス', en: 'Gigalith' },
        types: ['rock'],
        base_stats: {
          hp: 85,
          attack: 135,
          defense: 130,
          sp_attack: 60,
          sp_defense: 80,
          speed: 25,
        },
        abilities: [{ ja: 'すなのちから', en: 'Sand Force' }],
        regulations: ['M-A'],
        learnable_moves: [1],
      };

      const mockMoves: MoveMaster[] = [
        {
          id: 1,
          name: { ja: 'いわなだれ', en: 'Rock Slide' },
          type: 'rock',
          category: 'physical',
          power: 75,
          accuracy: 90,
          pp: 10,
        },
      ];

      // Attack base 135 max: neutral 187 * 1.1 = 205
      // Rock Slide: power 75 * 1.3 (Sand Force) = 97.5. STAB -> 97.5 * 1.5 = 146.25
      // 205 * 146.25 = 29981.25 -> 29981
      const maxDmg = calculateMaxDamage(mockPokemon, mockMoves);
      expect(maxDmg[0].value).toBe(29981);
      expect(maxDmg[0].abilityName.ja).toBe('すなのちから');
    });

    it('should apply Adaptability correctly', () => {
      const mockPokemon: PokemonMaster = {
        id: 691,
        name: { ja: 'ドラミドロ', en: 'Dragalge' },
        types: ['poison', 'dragon'],
        base_stats: {
          hp: 65,
          attack: 75,
          defense: 90,
          sp_attack: 97,
          sp_defense: 123,
          speed: 44,
        },
        abilities: [{ ja: 'てきおうりょく', en: 'Adaptability' }],
        regulations: ['M-A'],
        learnable_moves: [1],
      };

      const mockMoves: MoveMaster[] = [
        {
          id: 1,
          name: { ja: 'りゅうせいぐん', en: 'Draco Meteor' },
          type: 'dragon',
          category: 'special',
          power: 130,
          accuracy: 90,
          pp: 5,
        },
      ];

      // Sp.Atk base 97 max: neutral 149 * 1.1 = 163
      // Draco Meteor: power 130. Adaptability STAB -> 130 * 2.0 = 260
      // 163 * 260 = 42380
      const maxDmg = calculateMaxDamage(mockPokemon, mockMoves);
      expect(maxDmg[0].value).toBe(42380);
      expect(maxDmg[0].abilityName.ja).toBe('てきおうりょく');
    });

    it('should choose the highest damage among multiple abilities', () => {
      const mockPokemon: PokemonMaster = {
        id: 184,
        name: { ja: 'マリルリ', en: 'Azumarill' },
        types: ['water', 'fairy'],
        base_stats: {
          hp: 100,
          attack: 50,
          defense: 80,
          sp_attack: 60,
          sp_defense: 80,
          speed: 50,
        },
        abilities: [
          { ja: 'あついしぼう', en: 'Thick Fat' },
          { ja: 'ち力もち', en: 'Huge Power' }, // wait, earlier we had 'ちからもち', en: 'Huge Power' in our implementation, let's keep it 'ちからもち'
          { ja: 'そうしょく', en: 'Sap Sipper' },
        ],
        regulations: ['M-A'],
        learnable_moves: [1],
      };
      // Note: let's fix the typo 'ち力もち' back to 'ちからもち' since that was the mock data from the previous replace tool output
      mockPokemon.abilities[1].ja = 'ちからもち';

      const mockMoves: MoveMaster[] = [
        {
          id: 1,
          name: { ja: 'じゃれつく', en: 'Play Rough' },
          type: 'fairy',
          category: 'physical',
          power: 90,
          accuracy: 90,
          pp: 10,
        },
      ];

      // Thick Fat / Sap Sipper: Attack 112 * 90 * 1.5 = 15120
      // Huge Power: Attack 224 * 90 * 1.5 = 30240
      const maxDmg = calculateMaxDamage(mockPokemon, mockMoves);
      expect(maxDmg[0].value).toBe(30240);
    });

    it('should apply Swarm correctly for Bug type moves', () => {
      const mockPokemon: PokemonMaster = {
        id: 212,
        name: { ja: 'ハッサム', en: 'Scizor' },
        types: ['bug', 'steel'],
        base_stats: {
          hp: 70,
          attack: 130,
          defense: 100,
          sp_attack: 55,
          sp_defense: 80,
          speed: 65,
        },
        abilities: [{ ja: 'むしのしらせ', en: 'Swarm' }],
        regulations: ['M-A'],
        learnable_moves: [1, 2],
      };

      const mockMoves: MoveMaster[] = [
        {
          id: 1,
          name: { ja: 'シザークロス', en: 'X-Scissor' },
          type: 'bug',
          category: 'physical',
          power: 80,
          accuracy: 100,
          pp: 15,
        },
        {
          id: 2,
          name: { ja: 'ギガインパクト', en: 'Giga Impact' },
          type: 'normal',
          category: 'physical',
          power: 150,
          accuracy: 90,
          pp: 5,
        },
      ];

      // Attack max is 200.
      // X-Scissor: power 80. Swarm -> 80 * 1.5 = 120. STAB -> 120 * 1.5 = 180. index = 200 * 180 = 36000.
      // Giga Impact: power 150. No Swarm (normal type). No STAB -> index = 200 * 150 = 30000.
      // X-Scissor should be chosen because Swarm makes it stronger than Giga Impact.
      const maxDmg = calculateMaxDamage(mockPokemon, mockMoves);
      expect(maxDmg[0].value).toBe(36000);
      expect(maxDmg[0].moveName.ja).toBe('シザークロス');
      expect(maxDmg[0].abilityName.ja).toBe('むしのしらせ');
    });

    it('should return all moves sorted by damage descending', () => {
      const mockPokemon: PokemonMaster = {
        id: 1,
        name: { ja: 'テスト', en: 'Test' },
        types: ['normal'],
        base_stats: {
          hp: 100,
          attack: 100,
          defense: 100,
          sp_attack: 100,
          sp_defense: 100,
          speed: 100,
        },
        abilities: [],
        regulations: ['M-A'],
        learnable_moves: [1, 2, 3, 4, 5, 6, 7],
      };

      const mockMoves: MoveMaster[] = [
        {
          id: 1,
          name: { ja: '技1', en: 'Move1' },
          type: 'normal',
          category: 'physical',
          power: 10,
          accuracy: 100,
          pp: 10,
        },
        {
          id: 2,
          name: { ja: '技2', en: 'Move2' },
          type: 'normal',
          category: 'physical',
          power: 20,
          accuracy: 100,
          pp: 10,
        },
        {
          id: 3,
          name: { ja: '技3', en: 'Move3' },
          type: 'normal',
          category: 'physical',
          power: 30,
          accuracy: 100,
          pp: 10,
        },
        {
          id: 4,
          name: { ja: '技4', en: 'Move4' },
          type: 'normal',
          category: 'physical',
          power: 40,
          accuracy: 100,
          pp: 10,
        },
        {
          id: 5,
          name: { ja: '技5', en: 'Move5' },
          type: 'normal',
          category: 'physical',
          power: 50,
          accuracy: 100,
          pp: 10,
        },
        {
          id: 6,
          name: { ja: '技6', en: 'Move6' },
          type: 'normal',
          category: 'physical',
          power: 60,
          accuracy: 100,
          pp: 10,
        },
        {
          id: 7,
          name: { ja: '技7', en: 'Move7' },
          type: 'normal',
          category: 'physical',
          power: 70,
          accuracy: 100,
          pp: 10,
        },
      ];

      const res = calculateMaxDamage(mockPokemon, mockMoves);
      expect(res.length).toBe(7);
      expect(res[0].moveName.ja).toBe('技7');
      expect(res[6].moveName.ja).toBe('技1');
      expect(res[0].value).toBeGreaterThan(res[1].value);
    });

    it('should expand Last Respects and Rage Fist into multiple variations', () => {
      const mockPokemon: PokemonMaster = {
        id: 999,
        name: { ja: 'テストポケモン', en: 'Test Pokemon' },
        types: ['ghost'],
        base_stats: {
          hp: 100,
          attack: 100, // max physical attack at L50: base 100 -> neutral 120 -> positive 132 (EV 252, Nature 1.1)
          defense: 100,
          sp_attack: 100,
          sp_defense: 100,
          speed: 100,
        },
        abilities: [{ ja: 'なし', en: 'None' }],
        regulations: ['M-A'],
        learnable_moves: [854, 889],
      };

      const mockMoves: MoveMaster[] = [
        {
          id: 854,
          name: { ja: 'おはかまいり', en: 'Last Respects' },
          type: 'ghost',
          category: 'physical',
          power: 50,
          accuracy: 100,
          pp: 10,
        },
        {
          id: 889,
          name: { ja: 'ふんどのこぶし', en: 'Rage Fist' },
          type: 'ghost',
          category: 'physical',
          power: 50,
          accuracy: 100,
          pp: 10,
        },
      ];

      const res = calculateMaxDamage(mockPokemon, mockMoves);

      expect(res.length).toBe(7);

      expect(res[0].moveName.ja).toBe('ふんどのこぶし\n(被弾3回/最大火力)');
      expect(res[0].value).toBe(50100);

      const lr2 = res.find((m) =>
        m.moveName.ja.includes('おはかまいり\n(味方2落ち/最大火力)')
      );
      const rf2 = res.find((m) =>
        m.moveName.ja.includes('ふんどのこぶし\n(被弾2回)')
      );
      expect(lr2).toBeDefined();
      expect(lr2?.value).toBe(37575);
      expect(rf2).toBeDefined();
      expect(rf2?.value).toBe(37575);

      const lr1 = res.find((m) =>
        m.moveName.ja.includes('おはかまいり\n(味方1落ち)')
      );
      const rf1 = res.find((m) =>
        m.moveName.ja.includes('ふんどのこぶし\n(被弾1回)')
      );
      expect(lr1).toBeDefined();
      expect(lr1?.value).toBe(25050);
      expect(rf1).toBeDefined();
      expect(rf1?.value).toBe(25050);

      const lr0 = res.find((m) =>
        m.moveName.ja.includes('おはかまいり\n(味方0落ち)')
      );
      const rf0 = res.find((m) =>
        m.moveName.ja.includes('ふんどのこぶし\n(被弾0回)')
      );
      expect(lr0).toBeDefined();
      expect(lr0?.value).toBe(12525);
      expect(rf0).toBeDefined();
      expect(rf0?.value).toBe(12525);
    });
  });

  describe('calculateMaxDurability', () => {
    it('should calculate maximum physical and special durability indices', () => {
      const mockPokemon: PokemonMaster = {
        id: 9,
        name: { ja: 'カメックス', en: 'Blastoise' },
        types: ['water'],
        base_stats: {
          hp: 79,
          attack: 83,
          defense: 100,
          sp_attack: 85,
          sp_defense: 105,
          speed: 78,
        },
        abilities: [],
        regulations: [],
        learnable_moves: [],
      };

      const durability = calculateMaxDurability(mockPokemon);
      // Max HP: base 79 -> 186 (neutral)
      // For physical durability:
      // Max Defense: base 100 -> neutral 120, positive 120 * 1.1 = 167 (when EV: 252, nature: 1.1)
      // HP with max physical setup: EV 252 -> 186. Defense: EV 252, Nature 1.1 -> 167. Physical = 186 * 167 = 31062
      // For special durability:
      // Max SpDef: base 105 -> neutral 125, positive 125 * 1.1 = 172. Special = 186 * 172 = 31992
      expect(durability.physical).toBe(31062);
      expect(durability.physicalAbility.ja).toBe('なし');
      expect(durability.special).toBe(31992);
      expect(durability.specialAbility.ja).toBe('なし');
    });

    it('should apply Fur Coat to physical durability correctly', () => {
      const mockPokemon: PokemonMaster = {
        id: 100,
        name: { ja: 'ペルシアン', en: 'Persian' },
        types: ['normal'],
        base_stats: {
          hp: 65,
          attack: 60,
          defense: 60,
          sp_attack: 75,
          sp_defense: 65,
          speed: 115,
        },
        abilities: [{ ja: 'ファーコート', en: 'Fur Coat' }],
        regulations: [],
        learnable_moves: [],
      };

      const durability = calculateMaxDurability(mockPokemon);
      // HP max: 172. Defense max 특화: 123 * 2 (Fur Coat) = 246.
      // Physical: 172 * 246 = 42312
      expect(durability.physical).toBe(42312);
      expect(durability.physicalAbility.ja).toBe('ファーコート');
    });

    it('should apply Ice Scales to special durability correctly', () => {
      const mockPokemon: PokemonMaster = {
        id: 200,
        name: { ja: 'モスノウ', en: 'Frosmoth' },
        types: ['bug', 'ice'],
        base_stats: {
          hp: 70,
          attack: 65,
          defense: 60,
          sp_attack: 125,
          sp_defense: 90,
          speed: 65,
        },
        abilities: [{ ja: 'こおりのりんぷん', en: 'Ice Scales' }],
        regulations: [],
        learnable_moves: [],
      };

      const durability = calculateMaxDurability(mockPokemon);
      // HP max: 177. SpDef max 특화: 156 * 2 (Ice Scales) = 312.
      // Special: 177 * 312 = 55224
      expect(durability.special).toBe(55224);
      expect(durability.specialAbility.ja).toBe('こおりのりんぷん');
    });

    it('should apply Multiscale to both physical and special durability correctly', () => {
      const mockPokemon: PokemonMaster = {
        id: 300,
        name: { ja: 'ルギア', en: 'Lugia' },
        types: ['psychic', 'flying'],
        base_stats: {
          hp: 106,
          attack: 90,
          defense: 130,
          sp_attack: 90,
          sp_defense: 154,
          speed: 110,
        },
        abilities: [{ ja: 'マルチスケイル', en: 'Multiscale' }],
        regulations: [],
        learnable_moves: [],
      };

      const durability = calculateMaxDurability(mockPokemon);
      // HP max: 213.
      // Defense max 특화: 200 * 2.0 (Multiscale) = 400. Physical: 213 * 400 = 85200
      // SpDef max 특화: 226 * 2.0 (Multiscale) = 452. Special: 213 * 452 = 96276
      expect(durability.physical).toBe(85200);
      expect(durability.physicalAbility.ja).toBe('マルチスケイル');
      expect(durability.special).toBe(96276);
      expect(durability.specialAbility.ja).toBe('マルチスケイル');
    });

    it('should apply Sand Stream to special durability for Rock types correctly', () => {
      const mockPokemon: PokemonMaster = {
        id: 400,
        name: { ja: 'バンギラス', en: 'Tyranitar' },
        types: ['rock', 'dark'],
        base_stats: {
          hp: 100,
          attack: 134,
          defense: 110,
          sp_attack: 95,
          sp_defense: 100,
          speed: 61,
        },
        abilities: [{ ja: 'すなおこし', en: 'Sand Stream' }],
        regulations: [],
        learnable_moves: [],
      };

      const durability = calculateMaxDurability(mockPokemon);
      // HP max: 207.
      // SpDef max 특화: 167 * 1.5 (Sand Stream + Rock type) = 250.
      // Special: 207 * 250 = 51750
      expect(durability.special).toBe(51750);
      expect(durability.specialAbility.ja).toBe('すなおこし');
    });
  });
});
