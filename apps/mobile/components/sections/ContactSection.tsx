import * as Clipboard from 'expo-clipboard';
import type { SFSymbol } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Ionicons } from '@expo/vector-icons';
import { RetroButton, RetroIconButton, RetroInput, RetroRow, Symbol, useToast } from '~/components/retro';
import { Body, Card, H2, SectionTag } from '~/components/ui';
import { CONTACT_URL } from '~/constants/site';
import { CONTACT_EMAIL, contactInfo, socialLinks } from '~/lib/data';
import { openUrl } from '~/lib/links';
import { mono, useTheme } from '~/theme';

const ICONS: Record<string, { sf: SFSymbol; fallback: React.ComponentProps<typeof Ionicons>['name'] }> = {
  Email: { sf: 'envelope', fallback: 'mail-outline' },
  Location: { sf: 'mappin.and.ellipse', fallback: 'location-outline' },
  Work: { sf: 'curlybraces', fallback: 'code-slash-outline' },
};
const SOCIAL: Record<string, { sf: SFSymbol; fallback: React.ComponentProps<typeof Ionicons>['name'] }> = {
  GitHub: { sf: 'chevron.left.forwardslash.chevron.right', fallback: 'logo-github' },
  LinkedIn: { sf: 'person.2', fallback: 'logo-linkedin' },
};

export function ContactSection() {
  const t = useTheme();
  const toast = useToast();
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ name?: string; message?: string }>({});

  // Opens the mail app with the typed text (the website's full form, with company lookup and attachments, stays at CONTACT_URL).
  const send = () => {
    const next = { name: name.trim() ? undefined : 'Please enter your name.', message: message.trim().length >= 10 ? undefined : 'Please write a message of at least 10 characters.' };
    setErrors(next);
    if (next.name || next.message) return;
    const subject = encodeURIComponent(`Portfolio enquiry from ${name.trim()}`);
    const body = encodeURIComponent(`${message.trim()}\n\n— ${name.trim()}`);
    openUrl(`mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`);
  };

  return (
      <View>
        <SectionTag num="08" label="CONTACT" />
        <H2 em="polished interfaces.">{"Building thoughtful digital experiences from robust systems to "}</H2>
        <Body style={{ marginTop: 16 }}>I create scalable, accessible, and user-focused digital products by combining strong engineering foundations with carefully crafted frontend experiences.</Body>
        <Card style={{ marginTop: 24 }}>
          {contactInfo.map((c) => {
            const icon = ICONS[c.label];
            const row = (
              <View style={styles.row}>
                <Symbol sf={icon?.sf ?? 'circle'} fallback={icon?.fallback ?? 'ellipse-outline'} size={20} color={t.ink} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: t.text2 }]}>{c.label.toUpperCase()}</Text>
                  <Text style={[styles.value, { color: t.ink }]}>{c.value}</Text>
                </View>
              </View>
            );
            return c.href ? (
              <View key={c.label} style={styles.linkRow}>
                <Pressable accessibilityRole="link" accessibilityLabel={`${c.label}: ${c.value}`} onPress={() => openUrl(c.href!)} style={{ flex: 1, minHeight: 48, justifyContent: 'center' }}>{row}</Pressable>
                {c.label === 'Email' ? <RetroIconButton sf="doc.on.doc" fallback="copy-outline" label="Copy email address" onPress={() => { void Clipboard.setStringAsync(c.value).then(() => toast.show('Email address copied')); }} /> : null}
              </View>
            ) : <View key={c.label} accessible accessibilityLabel={`${c.label}: ${c.value}`}>{row}</View>;
          })}
        </Card>

        <SectionTag label="SAY HELLO" />
        <View style={{ gap: 16 }}>
          <RetroInput label="Your name" placeholder="Your name" value={name} onChangeText={(v) => { setName(v); if (errors.name) setErrors((e) => ({ ...e, name: undefined })); }} error={errors.name} autoComplete="name" textContentType="name" returnKeyType="next" />
          <RetroInput label="Your message" placeholder="Write a message ..." value={message} onChangeText={(v) => { setMessage(v); if (errors.message) setErrors((e) => ({ ...e, message: undefined })); }} error={errors.message} multiline minHeight={132} />
          <RetroButton primary label="Send by email" hint="Opens your mail app with this message" icon={{ sf: 'paperplane', fallback: 'send-outline' }} onPress={send} />
        </View>

        <View style={{ marginTop: 28 }}>
          <RetroRow>
            {socialLinks.map((s) => <RetroButton key={s.label} label={s.label} hint={`Opens ${s.label}`} icon={SOCIAL[s.label] ?? { sf: 'link', fallback: 'link-outline' }} onPress={() => openUrl(s.href)} />)}
            <RetroButton label="Full contact form" hint="Opens the contact form on the website" icon={{ sf: 'safari', fallback: 'globe-outline' }} onPress={() => openUrl(CONTACT_URL)} />
          </RetroRow>
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { fontFamily: mono, fontSize: 10, letterSpacing: 1.6 },
  value: { fontSize: 16, fontWeight: '600' },
});
