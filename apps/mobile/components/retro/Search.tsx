import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { maxScale } from '~/theme';
import { useRetro } from '~/theme/retro';
import { useState } from 'react';
import Symbol from './Symbol';
import { Inset } from './Surface';

type Props = { value: string; onChangeText: (t: string) => void; placeholder?: string; label: string };

/** Outlined search field with a leading magnifier and a clear button once there is text. Filters live as you type. */
export default function Search({ value, onChangeText, placeholder = 'Search for ...', label }: Props) {
  const r = useRetro();
  const [focus, setFocus] = useState(false);
  return (
    <Inset radius={14} ring={focus ? r.orange : undefined} contentStyle={styles.row}>
      <Symbol sf="magnifyingglass" fallback="search-outline" size={20} color={r.teal} weight="bold" />
      <TextInput
          keyboardAppearance={r.dark ? 'dark' : 'light'}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={r.muted}
        selectionColor={r.orange}
        accessibilityLabel={label}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="never"
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        maxFontSizeMultiplier={maxScale.body}
        style={[styles.input, { color: r.text }]}
      />
      {value ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={12} onPress={() => onChangeText('')}>
          <Symbol sf="xmark.circle.fill" fallback="close-circle" size={20} color={r.muted} />
        </Pressable>
      ) : <View style={{ width: 20 }} />}
    </Inset>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 56, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: { flex: 1, fontSize: 17, fontWeight: '700', letterSpacing: 0.4, paddingVertical: 12 },
});
