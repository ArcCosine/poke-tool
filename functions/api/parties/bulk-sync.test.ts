import { describe, expect, it, vi } from 'vitest';
import { createSessionCookie } from '../../_lib/auth';
import { onRequestPost } from './bulk-sync';

describe('POST /api/parties/bulk-sync', () => {
  const SECRET = 'test-secret';
  const currentUser = {
    id: 'usr_google_current',
    name: 'Current Google User',
    authProvider: 'google' as const,
  };

  it('performs standard bulk sync when parties are new or owned by user', async () => {
    const cookie = await createSessionCookie(currentUser, SECRET);

    // Mock DB queries
    // First query: SELECT id, user_id FROM parties WHERE id IN (...)
    const existingCheckBindMock = vi.fn().mockReturnValue({
      all: vi.fn().mockResolvedValue({ results: [] }),
    });
    const existingCheckPrepareMock = vi.fn().mockReturnValue({
      bind: existingCheckBindMock,
    });

    const insertBindMock = vi.fn();
    const insertPrepareMock = vi.fn().mockReturnValue({
      bind: insertBindMock,
    });

    const batchMock = vi.fn().mockResolvedValue([]);

    const mockDb = {
      prepare: vi.fn((sql: string) => {
        if (sql.includes('SELECT id, user_id FROM parties')) {
          return { bind: existingCheckBindMock };
        }
        return { bind: insertBindMock };
      }),
      batch: batchMock,
    };

    const headers = new Map<string, string>();
    headers.set('Cookie', cookie);
    headers.set('Content-Type', 'application/json');

    const request: any = {
      headers: {
        get: (key: string) => headers.get(key) || null,
      },
      json: async () => ({
        parties: [
          {
            id: 'party_new_1',
            title: 'マイパーティ',
            party_data: 'data_str',
          },
        ],
      }),
    };

    const context: any = {
      request,
      env: {
        AUTH_SECRET: SECRET,
        DB: mockDb,
      },
    };

    const response = await onRequestPost(context);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.remappedIds).toEqual({});
    expect(batchMock).toHaveBeenCalledTimes(1);
  });

  it('remaps party ID when a party ID is already owned by another user (multi-account collision)', async () => {
    const cookie = await createSessionCookie(currentUser, SECRET);

    // party_conflict is owned by 'usr_x_previous'
    const existingParties = [
      { id: 'party_conflict', user_id: 'usr_x_previous' },
    ];

    const existingCheckBindMock = vi.fn().mockReturnValue({
      all: vi.fn().mockResolvedValue({ results: existingParties }),
    });

    const insertBindMock = vi.fn();
    const batchMock = vi.fn().mockResolvedValue([]);

    const mockDb = {
      prepare: vi.fn((sql: string) => {
        if (sql.includes('SELECT id, user_id FROM parties')) {
          return { bind: existingCheckBindMock };
        }
        return { bind: insertBindMock };
      }),
      batch: batchMock,
    };

    const headers = new Map<string, string>();
    headers.set('Cookie', cookie);
    headers.set('Content-Type', 'application/json');

    const request: any = {
      headers: {
        get: (key: string) => headers.get(key) || null,
      },
      json: async () => ({
        parties: [
          {
            id: 'party_conflict',
            title: 'Xから引き継いだパーティ',
            party_data: 'data_str_x',
          },
        ],
      }),
    };

    const context: any = {
      request,
      env: {
        AUTH_SECRET: SECRET,
        DB: mockDb,
      },
    };

    const response = await onRequestPost(context);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.remappedIds).toBeDefined();
    expect(body.remappedIds['party_conflict']).toBeDefined();
    expect(body.remappedIds['party_conflict']).not.toBe('party_conflict');

    // The inserted ID should be the new remapped ID, owned by currentUser.id
    const boundArgs = insertBindMock.mock.calls[0];
    expect(boundArgs[0]).toBe(body.remappedIds['party_conflict']);
    expect(boundArgs[1]).toBe(currentUser.id);
  });
});
