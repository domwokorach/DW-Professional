import { sanitizeMessage } from '@/lib/utils/sanitize-message';
import { MAX_MESSAGE_LENGTH } from '@/lib/chat/constants';

describe('sanitizeMessage', () => {
  it('trims surrounding whitespace', () => {
    expect(sanitizeMessage('  hello  ')).toBe('hello');
  });

  it('strips ASCII control characters but keeps remaining content', () => {
    const withControlChars = `hi\x00\x01there\x7F!`;
    expect(sanitizeMessage(withControlChars)).toBe('hithere!');
  });

  it('returns null when content is empty after trimming/stripping', () => {
    expect(sanitizeMessage('   ')).toBeNull();
    expect(sanitizeMessage('\x00\x01\x02')).toBeNull();
  });

  it('returns null when content exceeds MAX_MESSAGE_LENGTH', () => {
    expect(sanitizeMessage('a'.repeat(MAX_MESSAGE_LENGTH + 1))).toBeNull();
  });

  it('accepts content exactly at MAX_MESSAGE_LENGTH', () => {
    const content = 'a'.repeat(MAX_MESSAGE_LENGTH);
    expect(sanitizeMessage(content)).toBe(content);
  });
});
