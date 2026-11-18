import { Image } from 'expo-image';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { certifications } from '~/lib/data';
import { localImages } from '~/lib/images';
import { mono, useTheme } from '~/theme';

/** Horizontal, swipeable certificate gallery (the website uses a swipeable card stack). */
export default function Certifications() {
  const t = useTheme();
  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={certifications}
      keyExtractor={(c) => c.id}
      snapToInterval={286}
      decelerationRate="fast"
      contentContainerStyle={{ gap: 14, paddingHorizontal: 20 }}
      style={{ marginHorizontal: -20 }}
      accessibilityLabel="Certifications, swipe horizontally"
      renderItem={({ item, index }) => (
        <View style={[styles.card, { backgroundColor: t.card, borderColor: t.line }]} accessible accessibilityLabel={`${item.name}, ${item.issuer}, issued ${item.issuedAt}. ${index + 1} of ${certifications.length}`}>
          <Image source={localImages[item.url]} contentFit="contain" style={[styles.img, { backgroundColor: t.sand }]} />
          <Text style={[styles.name, { color: t.ink }]}>{item.name}</Text>
          <Text style={[styles.meta, { color: t.text2 }]}>{`${item.issuer} · ${item.issuedAt}`}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: { width: 272, borderWidth: 1, borderRadius: 18, padding: 12, gap: 8 },
  img: { width: '100%', aspectRatio: 1.414, borderRadius: 10 },
  name: { fontSize: 16, fontWeight: '700' },
  meta: { fontFamily: mono, fontSize: 11 },
});
