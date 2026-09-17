import { describe, expect, it } from 'vitest';
import {
  d1RecordToParty,
  mergeParties,
  partyToD1Record,
  type SyncParty,
} from './sync';

describe('Party Synchronization Logic', () => {
  const createParty = (id: string, name: string, updatedAt = 1000): SyncParty => ({
    id,
    name,
    members: [],
    updatedAt,
  });

  it('should merge cloud parties with local parties without duplicates', () => {
    const local = [createParty('p1', 'Local P1', 1000), createParty('p2', 'Local P2', 1000)];
    const cloud = [createParty('p2', 'Cloud P2 Updated', 2000), createParty('p3', 'Cloud P3', 1500)];

    const { merged, toUpload } = mergeParties(local, cloud);

    // p1: only local -> needs upload, kept in merged
    // p2: both exist, cloud is newer -> cloud version chosen
    // p3: only cloud -> kept in merged
    expect(merged).toHaveLength(3);
    expect(merged.find((p) => p.id === 'p1')?.name).toBe('Local P1');
    expect(merged.find((p) => p.id === 'p2')?.name).toBe('Cloud P2 Updated');
    expect(merged.find((p) => p.id === 'p3')?.name).toBe('Cloud P3');

    expect(toUpload).toHaveLength(1);
    expect(toUpload[0].id).toBe('p1');
  });

  it('should identify local party as toUpload if local is newer than cloud', () => {
    const local = [createParty('p1', 'Local P1 Newer', 3000)];
    const cloud = [createParty('p1', 'Cloud P1 Older', 1000)];

    const { merged, toUpload } = mergeParties(local, cloud);

    expect(merged).toHaveLength(1);
    expect(merged[0].name).toBe('Local P1 Newer');
    expect(toUpload).toHaveLength(1);
    expect(toUpload[0].id).toBe('p1');
  });

  it('should serialize and deserialize party with D1 record representation', () => {
    const party: SyncParty = {
      id: 'party_123',
      name: 'テスト構築',
      members: [
        {
          id: 'slot1',
          masterId: 25, // Pikachu
          ability: 'せいでんき',
          nature: 'jolly',
          item: 'でんきだま',
          moves: [85, 98, 0, 0],
          evs: { hp: 0, attack: 32, defense: 0, sp_attack: 0, sp_defense: 0, speed: 32 },
        },
      ],
      isPublic: true,
      rentalCode: 'ABCD-1234',
      articleUrl: 'https://note.com/sample',
      description: '対戦用構築',
      likesCount: 15,
      rankingScore: 12.4,
      userId: 'usr_abc',
      authorName: 'サトシ',
      updatedAt: 1726000000,
    };

    const mockPokemonData = [
      { id: 25, abilities: [{ ja: 'せいでんき', en: 'Static' }] },
    ];
    const mockItemData = [
      { id: 101, name: { ja: 'でんきだま', en: 'Light Ball' } },
    ];

    const d1Record = partyToD1Record(party, mockPokemonData as any, mockItemData as any);
    expect(d1Record.id).toBe('party_123');
    expect(d1Record.title).toBe('テスト構築');
    expect(d1Record.is_public).toBe(1);
    expect(d1Record.rental_code).toBe('ABCD-1234');
    expect(d1Record.article_url).toBe('https://note.com/sample');
    expect(typeof d1Record.party_data).toBe('string');
    expect(d1Record.party_data.length).toBeGreaterThan(0);

    const restored = d1RecordToParty(d1Record, mockPokemonData as any, mockItemData as any);
    expect(restored.id).toBe('party_123');
    expect(restored.name).toBe('テスト構築');
    expect(restored.isPublic).toBe(true);
    expect(restored.rentalCode).toBe('ABCD-1234');
    expect(restored.articleUrl).toBe('https://note.com/sample');
    expect(restored.members).toHaveLength(1);
    expect(restored.members[0].masterId).toBe(25);
    expect(restored.members[0].nature).toBe('jolly');
  });
});

