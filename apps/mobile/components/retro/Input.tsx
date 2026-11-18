import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { maxScale } from '~/theme';
import { useRetro } from '~/theme/retro';
import { Inset } from './Surface';

type Props = Pick<TextInputProps, 'value' | 'onChangeText' | 'placeholder' | 'keyboardType' | 'autoCapitalize' | 'autoComplete' | 'returnKeyType' | 'onSubmitEditing' | 'multiline' | 'textContentType'> & {
  /** Required: the VoiceOver name (the placeholder is not read once text is typed). */
  label: string;
  error?: string;
  centered?: boolean;
  minHeight?: number;
};

/** Outlined input. Focus draws an orange ring; `error` draws a red outline and shows the message (announced politely). */
export default function Input({ label, error, centered, minHeight = 52, multiline, ...rest }: Props) {
  const r = useRetro();
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Inset radius={multiline ? 16 : 14} ring={error ? r.danger : focus ? r.orange : undefined} contentStyle={[styles.pad, { minHeight }]}>
        <TextInput
          keyboardAppearance={r.dark ? 'dark' : 'light'}
          {...rest}
          multiline={multiline}
          accessibilityLabel={label}
          placeholderTextColor={r.muted}
          selectionColor={r.orange}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          maxFontSizeMultiplier={maxScale.body}
          style={[styles.input, { color: r.text, textAlign: centered ? 'center' : 'left', minHeight: minHeight - 4 }, multiline && styles.multi]}
        />
      </Inset>
      {error ? <Text accessibilityLiveRegion="polite" style={[styles.error, { color: r.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 22, justifyContent: 'center' },
  input: { fontSize: 17, fontWeight: '600', paddingVertical: 0 },
  multi: { paddingTop: 14, paddingBottom: 14, textAlignVertical: 'top' },
  error: { fontSize: 13, fontWeight: '600', paddingHorizontal: 18 },
});
