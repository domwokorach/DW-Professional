import { View } from 'react-native';
import ExperienceCard from '~/components/experience/ExperienceCard';
import { H2, Screen, SectionTag } from '~/components/ui';
import { experiences } from '~/lib/data';

export default function ExperienceScreen() {
  return (
    <Screen>
      <SectionTag num="05" label="EXPERIENCE" />
      <H2 em="Experience.">Professional </H2>
      <View style={{ gap: 14, marginTop: 20 }}>
        {experiences.map((e, i) => <ExperienceCard key={i} item={e} />)}
      </View>
    </Screen>
  );
}
