import { Stack } from 'expo-router';
import { BISECT } from '~/lib/bisect';

// Launches straight into the portfolio: no platform selector.
// BISECT (EXPO_PUBLIC_BISECT) is a debugging switch for isolating a launch crash; unset it is always the full app.
export default function RootLayout() {
  if (BISECT < 1) return <Stack screenOptions={{ headerShown: false }} />;
  // Required lazily so level 0 loads none of the app's native-backed modules.
  const AppShell = require('~/components/portfolio/AppShell').default as React.ComponentType;
  return <AppShell />;
}
