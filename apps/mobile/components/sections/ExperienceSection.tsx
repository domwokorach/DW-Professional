import { useState } from 'react';
import { View } from 'react-native';
import type { ExperienceItem } from '@/types';
import ExperienceCard from '~/components/experience/ExperienceCard';
import { RetroRadioRow } from '~/components/retro';
import { H2, SectionTag } from '~/components/ui';
import { experiences } from '~/lib/data';

const isEducation = (e: ExperienceItem) => 'kind' in e && e.kind === 'education';
const FILTERS = ['All', 'Work', 'Education'] as const;

export function ExperienceSection() {
  const [filter, setFilter] = useState(0);
  const items = experiences.filter((e) => (filter === 0 ? true : filter === 1 ? !isEducation(e) : isEducation(e)));
  return (
    <View>
      <SectionTag num="05" label="EXPERIENCE" />
      <H2 em="Experience.">Professional </H2>
      <View style={{ marginTop: 20 }}>
        <View accessibilityRole="radiogroup" accessibilityLabel="Filter experience" style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 22 }}>
          {FILTERS.map((f, i) => <RetroRadioRow key={f} label={f} selected={filter === i} onPress={() => setFilter(i)} />)}
        </View>
      </View>
      <View style={{ gap: 14, marginTop: 16 }}>
        {items.map((e) => <ExperienceCard key={'role' in e ? e.role + e.start.iso : e.employer + e.start.iso} item={e} />)}
      </View>
    </View>
  );
}
