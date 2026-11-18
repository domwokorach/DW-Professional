import { Linking } from 'react-native';

/** Opens a URL in the system browser / mail app; failures are swallowed so a bad link never crashes a screen. */
export function openUrl(url: string) {
  Linking.openURL(url).catch(() => undefined);
}
