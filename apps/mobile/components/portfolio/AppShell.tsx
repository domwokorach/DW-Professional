import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from '~/components/liquid-glass';
import { useTheme } from '~/theme';
import { ThemeProvider } from '~/theme/appearance';
import { useRetro } from '~/theme/retro';

function Shell() {
  const t = useTheme();
  const n = useRetro();
  return (
    <SafeAreaProvider>
      <StatusBar style={t.dark ? 'light' : 'dark'} />
      <ToastProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: n.bg } }} />
      </ToastProvider>
    </SafeAreaProvider>
  );
}

/** App providers (appearance, safe area, toasts) around the navigation stack. */
export default function AppShell() {
  return (
    <ThemeProvider>
      <Shell />
    </ThemeProvider>
  );
}
