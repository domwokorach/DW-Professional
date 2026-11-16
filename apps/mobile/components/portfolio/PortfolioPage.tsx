import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AboutSection } from '~/components/sections/AboutSection';
import { ContactSection } from '~/components/sections/ContactSection';
import { ExperienceSection } from '~/components/sections/ExperienceSection';
import { HomeSection } from '~/components/sections/HomeSection';
import { ProjectsSection } from '~/components/sections/ProjectsSection';
import { space } from '~/theme';
import { useRetro } from '~/theme/retro';
import { ScrollContext } from './ScrollContext';
import { LiquidGlassTabBar, TAB_BAR_HEIGHT } from '~/components/liquid-glass';
import { SECTIONS, type SectionId } from './sections';
import { useSectionScroll } from './useSectionScroll';

const BODY: Record<SectionId, () => React.JSX.Element> = {
  home: HomeSection,
  about: AboutSection,
  experience: ExperienceSection,
  projects: ProjectsSection,
  contact: ContactSection,
};

/** The whole portfolio as one continuous page: a single vertical ScrollView, sections in order, and a floating glass nav that scrolls it. */
export default function PortfolioPage({ only, nav = true }: { only?: string[]; nav?: boolean } = {}) {
  const n = useRetro();
  const insets = useSafeAreaInsets();
  const topInset = insets.top + 12;
  const s = useSectionScroll({ topInset, bottomInset: insets.bottom });
  // Room under the last section for the floating footer, so Contact's last control is never covered.
  const footerRoom = TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 28;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: n.bg }}>
      <ScrollContext.Provider value={s.scrollTo}>
      <ScrollView
        ref={s.scroll}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: space.page, alignItems: 'center' }}
        scrollEventThrottle={16}
        onScroll={s.onScroll}
        onMomentumScrollEnd={s.onMomentumScrollEnd}
        onScrollBeginDrag={s.onScrollBeginDrag}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: '100%', maxWidth: 760, paddingTop: topInset, paddingBottom: footerRoom }}>
          {SECTIONS.filter((def) => !only || only.includes(def.id)).map((def) => {
            const Body = BODY[def.id];
            return (
              <View key={def.id} nativeID={def.id} onLayout={s.onSectionLayout(def.id)}>
                <Body />
              </View>
            );
          })}
        </View>
      </ScrollView>
      </ScrollContext.Provider>
      {nav ? <LiquidGlassTabBar
        items={SECTIONS}
        active={s.active}
        onSelect={(id) => s.scrollTo(id as SectionId)}
        action={s.hasNext
          ? { sf: 'chevron.down', fallback: 'chevron-down', label: 'Next section', hint: 'Scrolls to the next section', onPress: () => s.step(1) }
          : s.hasPrevious
            ? { sf: 'chevron.up', fallback: 'chevron-up', label: 'Previous section', hint: 'Scrolls to the previous section', onPress: () => s.step(-1) }
            : null}
        bottomInset={insets.bottom}
      /> : null}
    </KeyboardAvoidingView>
  );
}
