import type {
  User,
  Session,
  PasswordResetToken,
  EmailChangeRequest,
  Conversation,
  Message,
  SecurityEvent,
  Comment,
} from '@prisma/client';
import { hashToken } from '@/lib/auth/tokens';
import { hashPassword } from '@/lib/auth/passwords';

let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}_${counter}_${Date.now()}`;
}

/** Plaintext password every buildUser()/buildAdminUser() fixture's passwordHash actually verifies against. */
export const FIXTURE_PASSWORD = 'CorrectHorse9!Battery';

let cachedFixtureHash: string | null = null;
/** Lazily hashes FIXTURE_PASSWORD once per process — bcrypt hashing is comparatively slow, and every factory needs the same hash. */
export async function fixturePasswordHash(): Promise<string> {
  if (!cachedFixtureHash) cachedFixtureHash = await hashPassword(FIXTURE_PASSWORD);
  return cachedFixtureHash;
}

/** Async variant that sets a real, verifiable passwordHash for FIXTURE_PASSWORD. Prefer this over buildUser() whenever a test signs in or re-authenticates. */
export async function buildUserWithPassword(overrides: Partial<User> = {}): Promise<User> {
  return buildUser({ passwordHash: await fixturePasswordHash(), ...overrides });
}

export function buildUser(overrides: Partial<User> = {}): User {
  const id = overrides.id ?? nextId('user');
  return {
    id,
    name: 'Dominic Wokorach',
    email: 'dominic-wokorach@outlook.com',
    passwordHash: 'unusable-placeholder-hash-use-buildUserWithPassword-to-sign-in',
    role: 'ADMIN',
    status: 'ACTIVE',
    avatarUrl: null,
    availability: 'OFFLINE',
    preferences: {},
    emailVerifiedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    lastLoginAt: null,
    ...overrides,
  };
}

export function buildSession(overrides: Partial<Session> = {}): Session {
  const id = overrides.id ?? nextId('session');
  return {
    id,
    userId: overrides.userId ?? nextId('user'),
    refreshTokenHash: overrides.refreshTokenHash ?? hashToken(nextId('refresh-token')),
    deviceId: nextId('device'),
    deviceName: 'Chrome on macOS',
    deviceType: 'Desktop',
    operatingSystem: 'macOS 15',
    browser: 'Chrome',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    lastActiveAt: new Date('2026-01-01T00:00:00.000Z'),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    revokedAt: null,
    ...overrides,
  };
}

export function buildPasswordResetToken(overrides: Partial<PasswordResetToken> = {}): PasswordResetToken {
  return {
    id: nextId('reset'),
    userId: nextId('user'),
    tokenHash: hashToken(nextId('reset-token')),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    usedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export function buildEmailChangeRequest(overrides: Partial<EmailChangeRequest> = {}): EmailChangeRequest {
  return {
    id: nextId('email-change'),
    userId: nextId('user'),
    oldEmail: 'old@example.com',
    newEmail: 'new@example.com',
    tokenHash: hashToken(nextId('email-change-token')),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    verifiedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export function buildSecurityEvent(overrides: Partial<SecurityEvent> = {}): SecurityEvent {
  return {
    id: nextId('event'),
    userId: nextId('user'),
    sessionId: null,
    type: 'SIGN_IN',
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    metadata: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export function buildComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: overrides.id ?? nextId('comment'),
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
    reviewedBy: nextId('admin'),
    ...overrides,
  };
}

export function buildConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: overrides.id ?? nextId('conversation'),
    visitorId: nextId('visitor'),
    name: 'Jane Visitor',
    email: 'jane@example.com',
    mobile: null,
    companyName: null,
    status: 'OPEN',
    assignedAdminId: null,
    unreadByAdmin: 0,
    unreadByVisitor: 0,
    lastMessageAt: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export function buildMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: nextId('message'),
    conversationId: nextId('conversation'),
    sender: 'VISITOR',
    senderId: null,
    content: 'Hello, I have a question.',
    status: 'SENT',
    clientMessageId: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    readAt: null,
    ...overrides,
  };
}
