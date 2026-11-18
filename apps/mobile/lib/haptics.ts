import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

let enabled = true;
/** The Haptics preference (Design system screen). Haptics are on by default. */
export const setHapticsEnabled = (on: boolean) => { enabled = on; };

/** Light tap for presses, selection tick for changing a selection. iOS only; failures are ignored (e.g. simulator). */
export const tap = () => { if (enabled && Platform.OS === 'ios') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); };
export const select = () => { if (enabled && Platform.OS === 'ios') void Haptics.selectionAsync().catch(() => {}); };
export const success = () => { if (enabled && Platform.OS === 'ios') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); };
