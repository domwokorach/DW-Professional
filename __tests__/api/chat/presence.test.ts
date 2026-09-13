import { GET } from '@/app/api/chat/presence/route';
import { updatePresence } from '@/lib/chat/update-presence';

jest.mock('@/lib/chat/update-presence');

describe('GET /api/chat/presence', () => {
  it('is public — no auth required — and reports admin online status', async () => {
    (updatePresence.isAnyAdminOnline as jest.Mock).mockResolvedValue(true);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.online).toBe(true);
  });

  it('reports false when no admin is online', async () => {
    (updatePresence.isAnyAdminOnline as jest.Mock).mockResolvedValue(false);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.online).toBe(false);
  });
});
