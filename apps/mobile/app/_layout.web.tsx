import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from '~/components/liquid-glass';

// Web: one scrolling page (the website's own layout). Native keeps the tab navigator in _layout.tsx.
export default function WebLayout() {
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <Slot />
      </ToastProvider>
    </SafeAreaProvider>
  );
}
