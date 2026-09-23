import { render, screen } from '@testing-library/react';
import type { Comment } from '@prisma/client';
import Testimonials from '@/components/sections/Testimonials';
import { db } from '@/lib/database/db';

jest.mock('@/lib/database/db');

// Built inline rather than importing test/factories: that module pulls in
// src/lib/auth/tokens -> jose, which needs a TextEncoder global the jsdom
// Jest project here doesn't polyfill (only the node project does).
let commentCounter = 0;
function buildComment(overrides: Partial<Comment> = {}): Comment {
  commentCounter += 1;
  return {
    id: `comment_${commentCounter}`,
    fullName: 'Jane Colleague',
    company: 'Acme Corp',
    companyId: null,
    companyNumber: null,
    companyStatus: null,
    companySource: null,
    companyDomain: null,
    companyLogo: null,
    companyIndustry: null,
    companyLocation: null,
    companyPostcode: null,
    body: 'Great to work with — highly recommended.',
    avatarUrl: null,
    status: 'APPROVED',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    reviewedAt: new Date('2026-01-01T00:00:00.000Z'),
    reviewedBy: 'admin_1',
    ...overrides,
  };
}

describe('Testimonials section', () => {
  afterEach(() => jest.clearAllMocks());

  it('shows the empty state only when there are genuinely zero approved comments', async () => {
    (db.comment.findMany as jest.Mock).mockResolvedValue([]);

    render(await Testimonials());

    expect(screen.getByText('Be the first to leave a comment.')).toBeInTheDocument();
  });

  it('renders a single approved comment and hides the empty state', async () => {
    const comment = buildComment({ fullName: 'Jane Colleague', company: 'Acme Corp' });
    (db.comment.findMany as jest.Mock).mockResolvedValue([comment]);

    render(await Testimonials());

    // The marquee repeats its children for a seamless scroll loop, so each
    // comment legitimately appears more than once in the DOM.
    expect(screen.getAllByText('Jane Colleague').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Acme Corp').length).toBeGreaterThan(0);
    expect(screen.queryByText('Be the first to leave a comment.')).not.toBeInTheDocument();
  });

  it('renders multiple approved comments', async () => {
    const first = buildComment({ fullName: 'Jane Colleague' });
    const second = buildComment({ fullName: 'John Candidate' });
    (db.comment.findMany as jest.Mock).mockResolvedValue([first, second]);

    render(await Testimonials());

    expect(screen.getAllByText('Jane Colleague').length).toBeGreaterThan(0);
    expect(screen.getAllByText('John Candidate').length).toBeGreaterThan(0);
  });

  it('only queries for APPROVED comments, excluding pending/rejected/unverified/deleted rows', async () => {
    (db.comment.findMany as jest.Mock).mockResolvedValue([]);

    render(await Testimonials());

    expect(db.comment.findMany).toHaveBeenCalledWith({
      where: { status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      take: 60,
    });
  });

  it('renders correctly when a comment has no company', async () => {
    const comment = buildComment({ fullName: 'Jane Colleague', company: null });
    (db.comment.findMany as jest.Mock).mockResolvedValue([comment]);

    render(await Testimonials());

    expect(screen.getAllByText('Jane Colleague').length).toBeGreaterThan(0);
  });

  it('renders a fallback avatar when a comment has no photo', async () => {
    const comment = buildComment({ fullName: 'Jane Colleague', avatarUrl: null });
    (db.comment.findMany as jest.Mock).mockResolvedValue([comment]);

    render(await Testimonials());

    expect(screen.getAllByText('JC').length).toBeGreaterThan(0);
  });

  it('propagates a database error instead of silently rendering the empty state', async () => {
    (db.comment.findMany as jest.Mock).mockRejectedValue(new Error('connection refused'));

    await expect(Testimonials()).rejects.toThrow('connection refused');
  });
});
