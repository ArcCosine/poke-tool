import type React from 'react';
import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { PokemonMaster } from '../../utils/db';
import type { D1PartyRecord } from '../../utils/sync';
import { decodePartyConfig } from '../../utils/share';
import { TypeBadge } from '../common/TypeBadge';

interface PartyCardProps {
  party: D1PartyRecord;
  rank?: number;
  onLikeToggle: (partyId: string) => Promise<void>;
  isLiked: boolean;
  pokemonMap?: Map<number, PokemonMaster>;
}

export const PartyCard: React.FC<PartyCardProps> = ({
  party,
  rank,
  onLikeToggle,
  isLiked,
  pokemonMap,
}) => {
  const { language, t } = useApp();
  const [copied, setCopied] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  // Decode party data into member configs
  const partyConfig = useMemo(() => {
    return decodePartyConfig(party.party_data);
  }, [party.party_data]);

  const handleCopyRentalCode = async () => {
    if (!party.rental_code) return;
    try {
      await navigator.clipboard.writeText(party.rental_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy rental code:', err);
    }
  };

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      await onLikeToggle(party.id);
    } finally {
      setIsLiking(false);
    }
  };

  // Rank badge styling
  const getRankBadge = () => {
    if (!rank) return null;
    let badgeClass =
      'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
    if (rank === 1) {
      badgeClass =
        'bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-sm';
    } else if (rank === 2) {
      badgeClass =
        'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900 shadow-sm';
    } else if (rank === 3) {
      badgeClass =
        'bg-gradient-to-r from-amber-600 to-orange-700 text-white shadow-sm';
    }

    return (
      <span
        className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${badgeClass}`}
        aria-label={`Rank ${rank}`}
      >
        {rank}
      </span>
    );
  };

  const formattedDate = useMemo(() => {
    if (!party.created_at) return '';
    try {
      return new Date(party.created_at * 1000).toLocaleDateString(
        language === 'ja'
          ? 'ja-JP'
          : language === 'ko'
            ? 'ko-KR'
            : language === 'zh-Hant'
              ? 'zh-TW'
              : language === 'zh-Hans'
                ? 'zh-CN'
                : 'en-US',
        { year: 'numeric', month: 'short', day: 'numeric' }
      );
    } catch {
      return '';
    }
  }, [party.created_at, language]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      {/* Top Section */}
      <div>
        {/* Header: Rank + Title + Author info */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {getRankBadge()}
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                {party.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="truncate font-medium text-slate-600 dark:text-slate-300">
                  {party.author_name || t('partyRanking.anonymousAuthor')}
                </span>
                {formattedDate && (
                  <>
                    <span>•</span>
                    <span>{formattedDate}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Regulation Badge */}
          {party.regulation && party.regulation !== 'all' && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 shrink-0">
              {party.regulation.toUpperCase()}
            </span>
          )}
        </div>

        {/* 6 Pokemon Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 my-3 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/60">
          {partyConfig?.members.slice(0, 6).map((member, idx) => {
            const poke = pokemonMap?.get(member.pokemonId);
            const pokeName = poke
              ? poke.name[language] || poke.name.ja
              : `#${member.pokemonId}`;
            return (
              <div
                key={`${member.pokemonId}-${idx}`}
                className="flex flex-col items-center text-center p-1"
              >
                <div className="w-10 h-10 flex items-center justify-center mb-1">
                  <img
                    src={`/assets/pokemon-sprites/${member.pokemonId}.png`}
                    alt={pokeName}
                    className="w-10 h-10 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (
                        !target.src.endsWith('/assets/pokemon-sprites/0.png')
                      ) {
                        target.src = '/assets/pokemon-sprites/0.png';
                      } else {
                        target.style.display = 'none';
                      }
                    }}
                    loading="lazy"
                  />
                </div>
                <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200 truncate w-full">
                  {pokeName}
                </span>
                {poke?.types && poke.types.length > 0 && (
                  <div className="flex gap-1 mt-1 justify-center">
                    {poke.types.map((typeKey: string) => (
                      <TypeBadge
                        key={typeKey}
                        typeKey={typeKey}
                        showText={false}
                        imgClassName="w-3.5 h-3.5"
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Description / Concept */}
        {party.description && (
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4 line-clamp-2">
            {party.description}
          </p>
        )}

        {/* Rental Code & Article Link */}
        <div className="flex flex-wrap items-center gap-3 text-xs mb-4">
          {party.rental_code && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-medium">
              <span className="i-lucide-key text-xs text-slate-500 dark:text-slate-400" />
              <span>{party.rental_code}</span>
              <button
                type="button"
                onClick={handleCopyRentalCode}
                className="ml-1 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 p-0.5 rounded transition"
                aria-label={t('partyShare.copyRentalCode')}
                title={t('partyShare.copyRentalCode')}
              >
                <span
                  className={
                    copied
                      ? 'i-lucide-check text-green-600 dark:text-green-400'
                      : 'i-lucide-copy'
                  }
                />
              </button>
              {copied && (
                <span className="text-[10px] text-green-600 dark:text-green-400 font-sans font-semibold">
                  {t('partyShare.rentalCodeCopied')}
                </span>
              )}
            </div>
          )}

          {party.article_url && (
            <a
              href={party.article_url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              <span className="i-lucide-file-text text-xs" />
              <span>{t('partyShare.openArticle')}</span>
              <span className="i-lucide-external-link text-[10px]" />
            </a>
          )}
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        {/* Like Button */}
        <button
          type="button"
          onClick={handleLike}
          disabled={isLiking}
          aria-label={isLiked ? t('partyShare.liked') : t('partyShare.like')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
            isLiked
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60'
              : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/60'
          }`}
        >
          <span
            className={`${
              isLiked
                ? 'i-lucide-heart fill-rose-500 text-rose-500'
                : 'i-lucide-heart text-slate-400 dark:text-slate-500'
            } text-sm transition-transform active:scale-125`}
          />
          <span>{party.likes_count}</span>
        </button>

        {/* Import Party Button (Direct link to party.html?p=...) */}
        <a
          href={`/party.html?p=${party.party_data}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-sm transition no-underline cursor-pointer"
        >
          <span className="i-lucide-download text-xs" />
          <span>{t('partyShare.importParty')}</span>
        </a>
      </div>
    </div>
  );
};
