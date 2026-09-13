process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.JWT_ACCESS_SECRET ||= 'test-access-secret-do-not-use-in-prod-0123456789';
process.env.TOKEN_HASH_PEPPER ||= 'test-token-hash-pepper-do-not-use-in-prod-0123456789';
process.env.RESUME_PIN_SECRET ||= 'test-resume-pin-secret';
process.env.SOCKET_SECRET ||= 'test-socket-secret-0123456789';
process.env.RESEND_API_KEY ||= 'test-resend-key';
process.env.RESEND_FROM_EMAIL ||= 'test@example.com';
process.env.DATABASE_URL ||=
  process.env.DATABASE_URL_TEST ?? 'postgresql://test:test@localhost:5432/admin_chat_test';
