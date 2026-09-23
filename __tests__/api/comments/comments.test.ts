import { GET } from '@/app/api/comments/route';
import { db } from '@/lib/database/db';
import { buildComment } from '../../../test/factories';

jest.mock('@/lib/database/db');

describe('GET /api/comments', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns an empty array when there are genuinely zero approved comments', async () => {
    (db.comment.findMany as jest.Mock).mockResolvedValue([]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.comments).toEqual([]);
  });

  it('returns a single approved comment mapped to the public shape', async () => {
    const comment = buildComment({ status: 'APPROVED' });
    (db.comment.findMany as jest.Mock).mockResolvedValue([comment]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.comments).toHaveLength(1);
    expect(body.comments[0]).toEqual({
      id: comment.id,
      fullName: comment.fullName,
      company: comment.company,
      companyDomain: comment.companyDomain,
      companyLogo: comment.companyLogo,
      companyIndustry: comment.companyIndustry,
      companyLocation: comment.companyLocation,
      body: comment.body,
      avatarUrl: comment.avatarUrl,
      createdAt: comment.createdAt.toISOString(),
    });
  });

  it('returns multiple approved comments, newest first', async () => {
    const older = buildComment({ status: 'APPROVED', createdAt: new Date('2026-01-01T00:00:00.000Z') });
    const newer = buildComment({ status: 'APPROVED', createdAt: new Date('2026-02-01T00:00:00.000Z') });
    (db.comment.findMany as jest.Mock).mockResolvedValue([newer, older]);

    const response = await GET();
    const body = await response.json();

    expect(body.comments).toHaveLength(2);
    expect(body.comments.map((c: { id: string }) => c.id)).toEqual([newer.id, older.id]);
  });

  it('only queries for APPROVED comments — pending, rejected, unverified and deleted rows never reach the client', async () => {
    (db.comment.findMany as jest.Mock).mockResolvedValue([]);

    await GET();

    expect(db.comment.findMany).toHaveBeenCalledWith({
      where: { status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      take: 60,
    });
  });

  it('handles a missing optional company gracefully', async () => {
    const comment = buildComment({ status: 'APPROVED', company: null });
    (db.comment.findMany as jest.Mock).mockResolvedValue([comment]);

    const response = await GET();
    const body = await response.json();

    expect(body.comments[0].company).toBeNull();
  });

  it('handles a missing optional photo gracefully', async () => {
    const comment = buildComment({ status: 'APPROVED', avatarUrl: null });
    (db.comment.findMany as jest.Mock).mockResolvedValue([comment]);

    const response = await GET();
    const body = await response.json();

    expect(body.comments[0].avatarUrl).toBeNull();
  });

  it('propagates a database failure instead of silently returning an empty list', async () => {
    (db.comment.findMany as jest.Mock).mockRejectedValue(new Error('connection refused'));

    await expect(GET()).rejects.toThrow('connection refused');
  });
});
