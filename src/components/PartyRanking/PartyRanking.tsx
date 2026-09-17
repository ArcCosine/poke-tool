import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { PokemonMaster } from '../../utils/db';
import { db } from '../../utils/db';
import type { D1PartyRecord } from '../../utils/sync';
import { PartyCard } from './PartyCard';

export const PartyRanking: React.FC = () => {
  const { t } = useApp();

  const [parties, setParties] = useState<D1PartyRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<'score' | 'newest'>('score');
  const [regulation, setRegulation] = useState<string>('all');
  const [pokemonMap, setPokemonMap] = useState<Map<number, PokemonMaster>>(new Map());
  const [likedPartyIds, setLikedPartyIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('poke_liked_party_ids');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Get or initialize anonymous client id for likes
  const getClientId = useCallback(() => {
    let id = localStorage.getItem('poke_anon_client_id');
    if (!id) {
      id = `anon:${crypto.randomUUID()}`;
      localStorage.setItem('poke_anon_client_id', id);
    }
    return id;
  }, []);

  // Save liked party IDs to localStorage
  const recordLocalLike = useCallback((partyId: string, isLiked: boolean) => {
    setLikedPartyIds((prev) => {
      const next = new Set(prev);
      if (isLiked) {
        next.add(partyId);
      } else {
        next.delete(partyId);
      }
      try {
        localStorage.setItem(
          'poke_liked_party_ids',
          JSON.stringify(Array.from(next))
        );
      } catch (err) {
        console.error('Failed to save liked parties to localStorage:', err);
      }
      return next;
    });
  }, []);

  // Load Pokemon master data
  useEffect(() => {
    let isMounted = true;
    db.loadMasterData()
      .then((data) => {
        if (!isMounted || !data?.pokemon) return;
        const map = new Map<number, PokemonMaster>();
        for (const p of data.pokemon) {
          map.set(p.id, p);
        }
        setPokemonMap(map);
      })
      .catch((err) => {
        console.error('Failed to load pokemon master data:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch ranking parties
  const fetchRanking = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        sort,
        reg: regulation,
      });
      const res = await fetch(`/api/ranking?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch ranking: ${res.status}`);
      }
      const data = await res.json();
      setParties(data.parties || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error fetching ranking');
    } finally {
      setLoading(false);
    }
  }, [sort, regulation]);

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  // Toggle like handler
  const handleLikeToggle = async (partyId: string) => {
    const clientId = getClientId();
    const currentIsLiked = likedPartyIds.has(partyId);

    // Optimistic UI update
    setParties((prev) =>
      prev.map((p) => {
        if (p.id === partyId) {
          const delta = currentIsLiked ? -1 : 1;
          return {
            ...p,
            likes_count: Math.max(0, (p.likes_count || 0) + delta),
          };
        }
        return p;
      })
    );
    recordLocalLike(partyId, !currentIsLiked);

    try {
      const res = await fetch(`/api/parties/${partyId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Id': clientId,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to toggle like');
      }

      const outcome = await res.json();
      // Sync actual numbers from server
      setParties((prev) =>
        prev.map((p) => {
          if (p.id === partyId) {
            return {
              ...p,
              likes_count: outcome.likesCount,
              ranking_score: outcome.rankingScore,
            };
          }
          return p;
        })
      );
      recordLocalLike(partyId, outcome.isLiked);
    } catch (err) {
      console.error('Error toggling like:', err);
      // Revert on error
      setParties((prev) =>
        prev.map((p) => {
          if (p.id === partyId) {
            const delta = currentIsLiked ? 1 : -1;
            return {
              ...p,
              likes_count: Math.max(0, (p.likes_count || 0) + delta),
            };
          }
          return p;
        })
      );
      recordLocalLike(partyId, currentIsLiked);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5 tracking-tight">
            <span className="i-lucide-trophy text-amber-500 text-2xl sm:text-3xl" />
            <span>{t('partyRanking.title')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('partyRanking.description')}
          </p>
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Regulation Filter */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs shadow-sm">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Reg:
            </span>
            <select
              value={regulation}
              onChange={(e) => setRegulation(e.target.value)}
              aria-label="Regulation Filter"
              className="bg-transparent border-none text-slate-800 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">{t('partyRanking.regulationAll')}</option>
              <option value="reg-h">Regulation H</option>
              <option value="reg-g">Regulation G</option>
            </select>
          </div>

          {/* Sort Tabs */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
            <button
              type="button"
              onClick={() => setSort('score')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                sort === 'score'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {t('partyRanking.sortByScore')}
            </button>
            <button
              type="button"
              onClick={() => setSort('newest')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                sort === 'newest'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {t('partyRanking.sortByNewest')}
            </button>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 h-64"
            >
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-4" />
              <div className="h-20 bg-slate-100 dark:bg-slate-800/60 rounded-xl mb-4" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3 mb-2" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Error View */}
      {!loading && error && (
        <div className="text-center py-12 px-4 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/40 rounded-2xl">
          <span className="i-lucide-alert-circle text-red-500 text-4xl mb-2" />
          <p className="text-slate-800 dark:text-slate-200 font-semibold mb-3">
            {t('partyRanking.loadError')}
          </p>
          <button
            type="button"
            onClick={fetchRanking}
            className="btn-primary text-xs py-2 px-4 rounded-xl cursor-pointer"
          >
            {t('partyRanking.retry')}
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && parties.length === 0 && (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <div className="w-14 h-14 mx-auto rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
            <span className="i-lucide-trophy text-2xl" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
            {t('partyRanking.empty')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-5">
            {t('partyRanking.description')}
          </p>
          <a
            href="/party.html"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition no-underline"
          >
            <span className="i-lucide-plus text-sm" />
            <span>{t('partyRanking.createPartyPrompt')}</span>
          </a>
        </div>
      )}

      {/* Parties List Grid */}
      {!loading && !error && parties.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {parties.map((party, index) => (
            <PartyCard
              key={party.id}
              party={party}
              rank={sort === 'score' ? index + 1 : undefined}
              onLikeToggle={handleLikeToggle}
              isLiked={likedPartyIds.has(party.id)}
              pokemonMap={pokemonMap}
            />
          ))}
        </div>
      )}
    </div>
  );
};
