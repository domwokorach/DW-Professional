import { View } from 'react-native';
import ExperienceCard from '~/components/experience/ExperienceCard';
import { Body, H2, SectionTag } from '~/components/ui';
import { education, experiences } from '~/lib/data';

const key = (e: (typeof experiences)[number]) => ('role' in e ? e.role + e.start.iso : e.employer + e.start.iso);

export function ExperienceSection() {
  return (
    <View>
      <SectionTag num="05" label="EMPLOYER HISTORY" />
      <H2 em="journey.">{'My professional '}</H2>
      <Body style={{ marginTop: 12 }}>A journey through software engineering, digital transformation, technology innovation and continuous professional development — building accessible, scalable and meaningful digital experiences.</Body>
      <View style={{ gap: 14, marginTop: 20 }}>
        {experiences.map((e) => <ExperienceCard key={key(e)} item={e} />)}
      </View>
      <View style={{ marginTop: 36 }}>
        <SectionTag label="EDUCATION & QUALIFICATIONS" />
      </View>
      <View style={{ gap: 14, marginTop: 16 }}>
        {education.map((e) => <ExperienceCard key={key(e)} item={e} />)}
      </View>
    </View>
  );
}
