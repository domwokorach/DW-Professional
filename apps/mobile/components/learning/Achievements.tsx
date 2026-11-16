import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RetroButton } from '~/components/retro';
import { achievements } from '~/lib/data';
import { ACHIEVEMENTS_VIDEO } from '~/lib/cloudinary';
import { mono, useTheme } from '~/theme';

type Item = (typeof achievements)[number];

/** Converts the website's object-position (e.g. "68% center") to expo-image's contentPosition. */
function focal(position: string) {
  const [x, y = 'center'] = position.split(' ');
  const pct = (v: string) => (v === 'center' ? '50%' : v) as `${number}%`;
  return { left: pct(x), top: pct(y) };
}

function Photo({ item, style }: { item: Item; style: object }) {
  const t = useTheme();
  const [failed, setFailed] = useState(0);
  const [loaded, setLoaded] = useState(false);
  return (
    <View style={[style, { backgroundColor: t.sand }]}>
      {failed < 3 ? (
        // Changing the key on error retries the download (up to three times) instead of leaving a blank card.
        <Image
          key={failed}
          source={{ uri: item.src }}
          contentFit="cover"
          contentPosition={focal(item.position)}
          transition={350}
          style={StyleSheet.absoluteFill}
          accessibilityLabel={item.alt}
          onLoad={() => setLoaded(true)}
          onError={() => setTimeout(() => setFailed((n) => n + 1), 800)}
        />
      ) : null}
      {!loaded ? (
        <View style={styles.center} pointerEvents="none">
          <Ionicons name={failed >= 3 ? 'image-outline' : 'hourglass-outline'} size={22} color={t.text2} />
          <Text style={[styles.status, { color: t.text2 }]}>{failed >= 3 ? 'Image unavailable' : 'Loading'}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** Autoplaying, muted, looping background clip with a pause/play control; starts paused under Reduce Motion. */
function AchievementsVideo() {
  const t = useTheme();
  const [playing, setPlaying] = useState(true);
  const player = useVideoPlayer(ACHIEVEMENTS_VIDEO, (p) => { p.loop = true; p.muted = true; });

  useEffect(() => {
    let live = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (!live) return;
      setPlaying(!reduce);
    });
    return () => { live = false; };
  }, []);
  useEffect(() => { if (playing) player.play(); else player.pause(); }, [playing, player]);

  return (
    <View style={[styles.video, { backgroundColor: t.sand, borderColor: t.line }]}>
      <VideoView player={player} nativeControls={false} contentFit="cover" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no" />
      <View style={styles.videoControl}>
        <RetroButton
          label={playing ? 'Pause video' : 'Play video'}
          hint="Toggles the London background video"
          icon={{ sf: playing ? 'pause.fill' : 'play.fill', fallback: playing ? 'pause' : 'play' }}
          onPress={() => setPlaying((v) => !v)}
        />
      </View>
    </View>
  );
}

export default function Achievements() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState<number | null>(null);
  const current = open === null ? null : achievements[open];

  return (
    <View style={{ gap: 16 }}>
      <AchievementsVideo />
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
          <Pressable accessibilityRole="button" accessibilityLabel={`${item.label}. ${item.alt} Opens full image.`} onPress={() => setOpen(index)}>
            <Photo item={item} style={[styles.card, { borderColor: t.line }]} />
            <View style={styles.shade} pointerEvents="none" />
            <Text style={styles.caption} pointerEvents="none">{`${String(index + 1).padStart(2, '0')}  ${item.label}`}</Text>
          </Pressable>
        )}
      />
      <Modal visible={open !== null} animationType="fade" presentationStyle="fullScreen" onRequestClose={() => setOpen(null)}>
        {current && open !== null ? (
          <View style={[styles.modal, { backgroundColor: '#14132a', paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}>
            <Image
              key={current.src}
              source={{ uri: current.src }}
              contentFit="contain"
              transition={300}
              style={{ flex: 1 }}
              accessibilityLabel={current.alt}
            />
            <View style={styles.modalBar}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.modalIndex}>{`${String(open + 1).padStart(2, '0')} / ${achievements.length}`}</Text>
                <Text style={styles.modalTitle}>{current.label}</Text>
                <Text style={styles.modalAlt}>{current.alt}</Text>
              </View>
            </View>
            <View style={styles.modalActions}>
              <RetroButton label="Previous" disabled={open === 0} icon={{ sf: "chevron.left", fallback: "chevron-back" }} onPress={() => setOpen(open - 1)} />
              <RetroButton label="Next" disabled={open === achievements.length - 1} icon={{ sf: "chevron.right", fallback: "chevron-forward" }} onPress={() => setOpen(open + 1)} />
              <RetroButton primary label="Close" icon={{ sf: "xmark", fallback: "close" }} onPress={() => setOpen(null)} />
            </View>
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  video: { height: 200, borderRadius: 18, borderWidth: 1, overflow: 'hidden', justifyContent: 'flex-end', alignItems: 'flex-end', padding: 12 },
  videoControl: { },
  card: { width: 244, height: 320, borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  center: { ...StyleSheet.absoluteFill as object, alignItems: 'center', justifyContent: 'center', gap: 6 },
  status: { fontFamily: mono, fontSize: 11 },
  shade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 90, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, backgroundColor: 'rgba(20,19,40,0.45)' },
  caption: { position: 'absolute', left: 14, bottom: 14, color: '#fffdf7', fontFamily: mono, fontSize: 12, letterSpacing: 1 },
  modal: { flex: 1, paddingHorizontal: 16, gap: 12 },
  modalBar: { flexDirection: 'row' },
  modalIndex: { color: 'rgba(255,253,247,0.6)', fontFamily: mono, fontSize: 11, letterSpacing: 2 },
  modalTitle: { color: '#fffdf7', fontSize: 22, fontWeight: '700' },
  modalAlt: { color: 'rgba(255,253,247,0.8)', fontSize: 14, lineHeight: 20 },
  modalActions: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
});
