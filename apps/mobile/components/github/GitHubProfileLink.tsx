import { Pressable, Text } from 'react-native';
import { openUrl } from '~/lib/links';
import { maxScale, mono, useTheme } from '~/theme';
import { GITHUB_LOGIN, GITHUB_PROFILE_URL } from '@/lib/github/types';

export default function GitHubProfileLink() {
  const t = useTheme();
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={`${GITHUB_LOGIN} on GitHub`} accessibilityHint="Opens the GitHub profile in your browser" onPress={() => openUrl(GITHUB_PROFILE_URL)} style={{ minHeight: 44, justifyContent: 'center' }}>
      <Text maxFontSizeMultiplier={maxScale.label} style={{ fontFamily: mono, fontSize: 12, letterSpacing: 0.6, color: t.ink, textDecorationLine: 'underline' }}>@{GITHUB_LOGIN} on GitHub ↗</Text>
    </Pressable>
  );
}
