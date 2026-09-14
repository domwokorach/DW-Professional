import {
  visitorIdSchema,
  candidateSchema,
  messageContentSchema,
  conversationIdSchema,
  candidateMessageSchema,
  adminMessageSchema,
  joinPayloadSchema,
  typingPayloadSchema,
  readPayloadSchema,
  createConversationSchema,
  conversationStatusSchema,
  conversationPatchSchema,
  safeParse,
} from '@/lib/chat/validation';
import { MAX_MESSAGE_LENGTH } from '@/lib/chat/constants';

describe('visitorIdSchema', () => {
  it('accepts an alphanumeric-with-hyphens id up to 64 chars', () => {
    expect(visitorIdSchema.safeParse('abc-123-XYZ').success).toBe(true);
    expect(visitorIdSchema.safeParse('a'.repeat(64)).success).toBe(true);
  });

  it('rejects ids over 64 chars', () => {
    expect(visitorIdSchema.safeParse('a'.repeat(65)).success).toBe(false);
  });

  it('rejects empty strings', () => {
    expect(visitorIdSchema.safeParse('').success).toBe(false);
  });

  it('rejects ids with disallowed characters', () => {
    expect(visitorIdSchema.safeParse('abc_123').success).toBe(false);
    expect(visitorIdSchema.safeParse('abc.123').success).toBe(false);
    expect(visitorIdSchema.safeParse('abc 123').success).toBe(false);
    expect(visitorIdSchema.safeParse('<script>').success).toBe(false);
  });
});

describe('messageContentSchema', () => {
  it('accepts non-empty content within the length bound', () => {
    expect(messageContentSchema.safeParse('hello').success).toBe(true);
    expect(messageContentSchema.safeParse('a'.repeat(MAX_MESSAGE_LENGTH)).success).toBe(true);
  });

  it('rejects empty/whitespace-only content', () => {
    expect(messageContentSchema.safeParse('').success).toBe(false);
    expect(messageContentSchema.safeParse('   ').success).toBe(false);
  });

  it('rejects content exceeding MAX_MESSAGE_LENGTH', () => {
    expect(messageContentSchema.safeParse('a'.repeat(MAX_MESSAGE_LENGTH + 1)).success).toBe(false);
  });
});

describe('candidateSchema', () => {
  it('accepts a valid name/email pair', () => {
    expect(candidateSchema.safeParse({ name: 'Jane Doe', email: 'jane@example.com' }).success).toBe(true);
  });

  it('accepts an empty object since both fields are optional', () => {
    expect(candidateSchema.safeParse({}).success).toBe(true);
  });

  it('rejects a malformed email', () => {
    expect(candidateSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
  });

  it('rejects a name shorter than 2 characters', () => {
    expect(candidateSchema.safeParse({ name: 'A' }).success).toBe(false);
  });
});

describe('conversationIdSchema', () => {
  it('accepts any non-empty trimmed string', () => {
    expect(conversationIdSchema.safeParse('conv-1').success).toBe(true);
  });

  it('rejects an empty string', () => {
    expect(conversationIdSchema.safeParse('').success).toBe(false);
  });
});

describe('candidateMessageSchema / adminMessageSchema', () => {
  it('accepts a valid payload without clientMessageId', () => {
    expect(candidateMessageSchema.safeParse({ conversationId: 'c1', content: 'hi' }).success).toBe(true);
    expect(adminMessageSchema.safeParse({ conversationId: 'c1', content: 'hi' }).success).toBe(true);
  });

  it('accepts a valid payload with clientMessageId', () => {
    expect(
      candidateMessageSchema.safeParse({ conversationId: 'c1', content: 'hi', clientMessageId: 'client-1' }).success
    ).toBe(true);
  });

  it('rejects a missing conversationId', () => {
    expect(candidateMessageSchema.safeParse({ content: 'hi' }).success).toBe(false);
  });
});

describe('joinPayloadSchema / typingPayloadSchema', () => {
  it('require a conversationId', () => {
    expect(joinPayloadSchema.safeParse({ conversationId: 'c1' }).success).toBe(true);
    expect(joinPayloadSchema.safeParse({}).success).toBe(false);
    expect(typingPayloadSchema.safeParse({ conversationId: 'c1' }).success).toBe(true);
    expect(typingPayloadSchema.safeParse({}).success).toBe(false);
  });
});

describe('readPayloadSchema', () => {
  it('accepts reader "visitor" or "admin"', () => {
    expect(readPayloadSchema.safeParse({ conversationId: 'c1', reader: 'visitor' }).success).toBe(true);
    expect(readPayloadSchema.safeParse({ conversationId: 'c1', reader: 'admin' }).success).toBe(true);
  });

  it('rejects any other reader value', () => {
    expect(readPayloadSchema.safeParse({ conversationId: 'c1', reader: 'bot' }).success).toBe(false);
  });
});

describe('createConversationSchema', () => {
  it('accepts a valid visitorId with optional candidate fields', () => {
    expect(
      createConversationSchema.safeParse({ visitorId: 'visitor-1', name: 'Jane', email: 'jane@example.com' }).success
    ).toBe(true);
  });

  it('rejects an invalid visitorId', () => {
    expect(createConversationSchema.safeParse({ visitorId: 'bad id!' }).success).toBe(false);
  });
});

describe('conversationStatusSchema / conversationPatchSchema', () => {
  it('accepts "open" or "closed"', () => {
    expect(conversationStatusSchema.safeParse('open').success).toBe(true);
    expect(conversationStatusSchema.safeParse('closed').success).toBe(true);
    expect(conversationStatusSchema.safeParse('pending').success).toBe(false);
  });

  // Status changes (close/reopen) now go over Socket.IO (`chat:set-status`,
  // src/lib/socket/server.ts) so they can broadcast live — this REST schema
  // only covers the single-admin-local "mark as unread" action.
  it('conversationPatchSchema accepts markUnread, optional', () => {
    expect(conversationPatchSchema.safeParse({ markUnread: true }).success).toBe(true);
    expect(conversationPatchSchema.safeParse({}).success).toBe(true);
    expect(conversationPatchSchema.safeParse({ markUnread: 'yes' }).success).toBe(false);
  });
});

describe('safeParse', () => {
  it('returns parsed data on success', () => {
    expect(safeParse(conversationIdSchema, 'c1')).toBe('c1');
  });

  it('returns null on failure instead of throwing', () => {
    expect(safeParse(conversationIdSchema, '')).toBeNull();
    expect(() => safeParse(conversationIdSchema, '')).not.toThrow();
  });
});
