# Sourced by CI stages (never run directly). Points every database variable the app and Prisma read at the
# disposable test database, so a production PORTFOLIO_DATABASE_URL / DATABASE_URL in the environment or a .env
# file can never win. Tests delete rows, so anything but a loopback database is refused.
: "${TEST_DATABASE_URL:?TEST_DATABASE_URL is not set: the disposable database was not provisioned}"
_host=$(node -e 'process.stdout.write(new URL(process.env.TEST_DATABASE_URL).hostname)')
case "$_host" in
  127.0.0.1 | localhost | ::1 | '[::1]') ;;
  *)
    if [ "${ALLOW_REMOTE_TEST_DATABASE:-}" != 1 ]; then
      echo "Refusing to run against non-loopback database host '$_host' (set ALLOW_REMOTE_TEST_DATABASE=1 for a dedicated throwaway server)." >&2
      return 1 2>/dev/null || exit 1
    fi
    ;;
esac
unset DATABASE_SCHEMA COMPANY_DATABASE_SCHEMA
export PORTFOLIO_DATABASE_URL="$TEST_DATABASE_URL" DATABASE_URL="$TEST_DATABASE_URL" COMPANY_DATABASE_URL="$TEST_DATABASE_URL"
echo "Test database: $_host:$(node -e 'process.stdout.write(new URL(process.env.TEST_DATABASE_URL).port)') (disposable)"
unset _host
