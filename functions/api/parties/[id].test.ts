import { describe, expect, it, vi } from 'vitest';
import { createSessionCookie, parseSessionCookie } from '../../_lib/auth';
import { onRequestPut } from './[id]';

describe('PUT /api/parties/[id]', () => {
  const SECRET = 'test-secret';
  const user = {
    id: 'user_123',
    name: 'Tester',
    authProvider: 'google' as const,
  };

  it('performs UPSERT on parties table when saving party', async () => {
    const cookie = await createSessionCookie(user, SECRET);
    const prepareMock = vi.fn();
    const bindMock = vi.fn();
    const runMock = vi.fn().mockResolvedValue({ meta: { changes: 1 } });

    prepareMock.mockReturnValue({ bind: bindMock });
    bindMock.mockReturnValue({ run: runMock });

    const mockDb = {
      prepare: prepareMock,
    };

    const headers = new Map<string, string>();
    headers.set('Cookie', cookie);
    headers.set('Content-Type', 'application/json');

    const request: any = {
      headers: {
        get: (key: string) => headers.get(key) || null,
      },
      json: async () => ({
        party: {
          title: '新規パーティ',
          regulation: 'reg_h',
          party_data: JSON.stringify([{ masterId: 25 }]),
          rental_code: 'RENTAL123',
          article_url: 'https://note.com/my-party',
          description: 'テストパーティです',
          author_name: 'カスタムトレーナー名',
          is_public: true,
        },
      }),
    };

    const context: any = {
      request,
      params: { id: 'party_abc' },
      env: {
        AUTH_SECRET: SECRET,
        DB: mockDb,
      },
    };

    const response = await onRequestPut(context);
    expect(response.status).toBe(200);

    const executedSql = prepareMock.mock.calls[0][0];
    expect(executedSql).toContain('INSERT INTO parties');
    expect(executedSql).toContain('author_name');
    expect(executedSql).toContain('ON CONFLICT(id) DO UPDATE SET');
    expect(executedSql).toContain('author_name = excluded.author_name');
    expect(executedSql).toContain('WHERE parties.user_id = excluded.user_id');

    // Verify bind arguments include author_name
    const bindArgs = bindMock.mock.calls[0];
    expect(bindArgs).toContain('カスタムトレーナー名');
  });
});
