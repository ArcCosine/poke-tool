import type { PokemonInstance } from './party';
import { normalizeEvs } from './pokemon';
import { decodePartyConfig, encodePartyConfig } from './share';

export interface SyncParty {
  id: string;
  name: string;
  members: PokemonInstance[];
  isPublic?: boolean;
  rentalCode?: string;
  articleUrl?: string;
  description?: string;
  likesCount?: number;
  rankingScore?: number;
  userId?: string;
  authorName?: string;
  updatedAt?: number;
}

export interface MergeResult {
  merged: SyncParty[];
  toUpload: SyncParty[];
}

/**
 * Merges local parties with cloud parties.
 * - If a party exists only locally: retained in merged, added to toUpload.
 * - If a party exists only in cloud: retained in merged.
 * - If a party exists in both: compares `updatedAt`, selects the newer version.
 *   If local is strictly newer, it is added to toUpload.
 */
export function mergeParties(
  localParties: SyncParty[],
  cloudParties: SyncParty[]
): MergeResult {
  const mergedMap = new Map<string, SyncParty>();
  const toUpload: SyncParty[] = [];

  // 1. Add all cloud parties first
  for (const cloudP of cloudParties) {
    mergedMap.set(cloudP.id, cloudP);
  }

  // 2. Process local parties
  for (const localP of localParties) {
    const existing = mergedMap.get(localP.id);
    if (!existing) {
      // Exists only locally
      mergedMap.set(localP.id, localP);
      toUpload.push(localP);
    } else {
      const localUpdated = localP.updatedAt ?? 0;
      const cloudUpdated = existing.updatedAt ?? 0;

      if (localUpdated > cloudUpdated) {
        // Local is newer
        mergedMap.set(localP.id, localP);
        toUpload.push(localP);
      }
      // If cloud is equal or newer, existing (cloud) is retained
    }
  }

  return {
    merged: Array.from(mergedMap.values()),
    toUpload,
  };
}

export interface D1PartyRecord {
  id: string;
  user_id: string;
  title: string;
  regulation?: string;
  party_data: string;
  rental_code?: string | null;
  article_url?: string | null;
  description?: string | null;
  is_public: number;
  likes_count?: number;
  ranking_score?: number;
  views_count?: number;
  created_at?: number;
  updated_at?: number;
  author_name?: string | null;
  author_avatar?: string | null;
}

/**
 * Serializes a SyncParty into a D1 database record representation
 */
export function partyToD1Record(
  party: SyncParty,
  pokemonData: { id: number; abilities?: { ja?: string; en?: string }[] }[],
  itemsData: { id: number; name?: { ja?: string; en?: string } }[]
): D1PartyRecord {
  const membersConfig = party.members.map((m) => {
    const poke = pokemonData.find((p) => p.id === m.masterId);
    const itemObj = itemsData.find(
      (i) => i.name?.ja === m.item || i.name?.en === m.item
    );
    const abilityIdx = poke?.abilities
      ? poke.abilities.findIndex((a) => a.ja === m.ability || a.en === m.ability)
      : -1;

    return {
      pokemonId: m.masterId,
      nature: m.nature,
      itemId: itemObj ? itemObj.id : 0,
      abilityIndex: abilityIdx >= 0 ? abilityIdx : 0,
      evs: normalizeEvs(m.evs),
      moves: m.moves,
    };
  });

  const partyDataStr = encodePartyConfig({ members: membersConfig });

  return {
    id: party.id,
    user_id: party.userId || '',
    title: party.name,
    party_data: partyDataStr,
    rental_code: party.rentalCode || null,
    article_url: party.articleUrl || null,
    description: party.description || null,
    is_public: party.isPublic ? 1 : 0,
    likes_count: party.likesCount || 0,
    ranking_score: party.rankingScore || 0,
    updated_at: party.updatedAt || Math.floor(Date.now() / 1000),
  };
}

/**
 * Deserializes a D1 record back into a SyncParty
 */
export function d1RecordToParty(
  record: D1PartyRecord,
  pokemonData: { id: number; abilities?: { ja?: string; en?: string }[] }[],
  itemsData: { id: number; name?: { ja?: string; en?: string } }[]
): SyncParty {
  const decoded = decodePartyConfig(record.party_data);
  const members: PokemonInstance[] = [];

  if (decoded && decoded.members) {
    for (const mem of decoded.members) {
      const poke = pokemonData.find((p) => p.id === mem.pokemonId);
      const itemObj = itemsData.find((i) => i.id === mem.itemId);
      const abilityName =
        mem.abilityIndex !== undefined && poke?.abilities?.[mem.abilityIndex]
          ? poke.abilities[mem.abilityIndex].ja || ''
          : '';

      members.push({
        id: Math.random().toString(36).substring(2, 9),
        masterId: mem.pokemonId,
        ability: abilityName,
        nature: mem.nature,
        item: itemObj?.name?.ja || '',
        moves: mem.moves || [0, 0, 0, 0],
        evs: normalizeEvs(mem.evs),
      });
    }
  }

  return {
    id: record.id,
    name: record.title,
    members,
    isPublic: record.is_public === 1,
    rentalCode: record.rental_code || undefined,
    articleUrl: record.article_url || undefined,
    description: record.description || undefined,
    likesCount: record.likes_count ?? 0,
    rankingScore: record.ranking_score ?? 0,
    userId: record.user_id,
    updatedAt: record.updated_at,
  };
}
