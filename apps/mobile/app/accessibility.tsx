import { Redirect } from 'expo-router';

// Legal pages are web-only (see accessibility.web.tsx); native has no such screen.
export default function Native() {
  return <Redirect href="/" />;
}
