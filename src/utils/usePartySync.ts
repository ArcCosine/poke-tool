import { useCallback, useEffect, useRef, useState } from 'react';
import type { AuthUser } from '../context/AuthContext';
import type { SavedParty } from '../context/AppContext';
import {
  type D1PartyRecord,
  d1RecordToParty,
  mergeParties,
  partyToD1Record,
} from './sync';

interface UsePartySyncOptions {
  user: AuthUser | null;
  localParties: SavedParty[];
  setPartiesDirectly: (parties: SavedParty[]) => void;
  pokemonData?: any[];
  itemsData?: any[];
}

export function usePartySync({
  user,
  localParties,
  setPartiesDirectly,
  pokemonData = [],
  itemsData = [],
}: UsePartySyncOptions) {
  const [isSyncPromptOpen, setIsSyncPromptOpen] = useState(false);
  const [hasPendingSync, setHasPendingSync] = useState(false);
  const [pendingToUpload, setPendingToUpload] = useState<SavedParty[]>([]);
  const [pendingMerged, setPendingMerged] = useState<SavedParty[]>([]);
  const checkedUserIdRef = useRef<string | null>(null);

  const checkAndSync = useCallback(async () => {
    if (!user) {
      setIsSyncPromptOpen(false);
      setHasPendingSync(false);
      checkedUserIdRef.current = null;
      return;
    }

    if (checkedUserIdRef.current === user.id) {
      return;
    }
    checkedUserIdRef.current = user.id;

    try {
      const res = await fetch('/api/parties');
      if (!res.ok) return;

      const data = await res.json();
      const cloudRecords: D1PartyRecord[] = data.parties || [];
      const cloudParties: SavedParty[] = cloudRecords.map((r) =>
        d1RecordToParty(r, pokemonData, itemsData)
      );

      const { merged, toUpload } = mergeParties(localParties, cloudParties);

      if (toUpload.length > 0) {
        setPendingToUpload(toUpload);
        setPendingMerged(merged);
        setHasPendingSync(true);
        setIsSyncPromptOpen(true);
      } else {
        const normalized = merged.map((p) => ({
          ...p,
          userId: user.id,
        }));
        setPartiesDirectly(normalized);
      }
    } catch (err) {
      console.warn('Failed to check cloud parties:', err);
    }
  }, [user, localParties, setPartiesDirectly, pokemonData, itemsData]);

  useEffect(() => {
    checkAndSync();
  }, [checkAndSync]);

  const confirmSync = async () => {
    if (!user || pendingToUpload.length === 0) {
      setIsSyncPromptOpen(false);
      return;
    }

    try {
      const recordsToUpload = pendingToUpload.map((p) =>
        partyToD1Record(p, pokemonData, itemsData)
      );

      const res = await fetch('/api/parties/bulk-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parties: recordsToUpload }),
      });

      if (res.ok) {
        const data = await res.json();
        const remappedIds: Record<string, string> = data.remappedIds || {};

        // Update party IDs if remapped by backend, and set userId to current user
        const finalParties = pendingMerged.map((p) => {
          const newId = remappedIds[p.id] || p.id;
          return {
            ...p,
            id: newId,
            userId: user.id,
          };
        });

        setPartiesDirectly(finalParties);
      }
    } catch (err) {
      console.error('Bulk sync failed:', err);
    } finally {
      setIsSyncPromptOpen(false);
      setHasPendingSync(false);
    }
  };

  const dismissSync = () => {
    setIsSyncPromptOpen(false);
  };

  return {
    isSyncPromptOpen,
    hasPendingSync,
    pendingCount: pendingToUpload.length,
    confirmSync,
    dismissSync,
  };
}
