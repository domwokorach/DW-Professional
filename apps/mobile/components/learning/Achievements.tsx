import { Image } from 'expo-image';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { achievements } from '~/lib/data';
import { mono, useTheme } from '~/theme';

export default function Achievements() {
  const t = useTheme();
  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={achievements}
      keyExtractor={(a) => a.src}
      snapToInterval={256}
      decelerationRate="fast"
      contentContainerStyle={{ gap: 12, paddingHorizontal: 20 }}
      style={{ marginHorizontal: -20 }}
      accessibilityLabel="Achievements gallery, swipe horizontally"
      renderItem={({ item, index }) => (
        <View style={[styles.card, { borderColor: t.line, backgroundColor: t.sand }]}>
          <Image source={{ uri: item.src }} contentFit="cover" style={StyleSheet.absoluteFill} accessibilityLabel={item.alt} />
          <View style={styles.shade} />
          <Text style={styles.caption}>{`${String(index + 1).padStart(2, '0')}  ${item.label}`}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: { width: 244, height: 320, borderRadius: 18, borderWidth: 1, overflow: 'hidden', justifyContent: 'flex-end' },
  shade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(20,19,40,0.32)' },
  caption: { color: '#fffdf7', fontFamily: mono, fontSize: 12, letterSpacing: 1, padding: 14 },
});
