import { View } from 'react-native';
import ProjectCard from '~/components/projects/ProjectCard';
import { H2, Screen, SectionTag } from '~/components/ui';
import { projects } from '~/lib/data';

export default function ProjectsScreen() {
  return (
    <Screen>
      <SectionTag num="03" label="PROJECTS" />
      <H2 em="work.">Selected </H2>
      <View style={{ gap: 18, marginTop: 20 }}>
        {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
      </View>
    </Screen>
  );
}
