import { useState } from 'react';
import { Text, View } from 'react-native';
import GitHubActivity from '~/components/github/GitHubActivity';
import ProjectCard from '~/components/projects/ProjectCard';
import { RetroButton, RetroDropdown, RetroRow, RetroSearch } from '~/components/retro';
import { H2, SectionTag } from '~/components/ui';
import { SITE_URL } from '~/constants/site';
import { projects, socialLinks } from '~/lib/data';
import { openUrl } from '~/lib/links';
import { useRetro } from '~/theme/retro';

const FOCI = ['All', ...Array.from(new Set(projects.map((p) => p.focus?.[0]).filter((x): x is string => !!x)))];

export function ProjectsSection() {
  const n = useRetro();
  const [focus, setFocus] = useState('All');
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const shown = projects.filter((p) => (focus === 'All' || p.focus?.[0] === focus) && (!q || [p.title, p.headline, p.category, ...(p.tech ?? []), ...(p.focus ?? [])].join(' ').toLowerCase().includes(q)));
  const github = socialLinks.find((s) => s.label === 'GitHub');
  return (
    <View>
      <SectionTag num="03" label="PROJECTS" />
      <H2 em="work.">Selected </H2>
      <View style={{ marginTop: 20 }}>
        <RetroRow>
          <RetroButton label="Portfolio site" hint="Opens the full portfolio website" icon={{ sf: "globe", fallback: "globe-outline" }} onPress={() => openUrl(SITE_URL)} />
          {github ? <RetroButton label="GitHub" hint="Opens GitHub" icon={{ sf: "chevron.left.forwardslash.chevron.right", fallback: "logo-github" }} onPress={() => openUrl(github.href)} /> : null}
        </RetroRow>
      </View>
      <View style={{ gap: 18, marginTop: 20 }}>
        <RetroSearch label="Search projects" placeholder="Search projects ..." value={query} onChangeText={setQuery} />
        {FOCI.length > 2 ? <RetroDropdown label="Category" options={FOCI} value={focus} onChange={setFocus} /> : null}
      </View>
      <View style={{ gap: 18, marginTop: 20 }}>
        {shown.length ? shown.map((p) => <ProjectCard key={p.id} project={p} />) : (
          <View accessibilityLiveRegion="polite" style={{ alignItems: 'center', paddingVertical: 32, gap: 6 }}>
            <Text style={{ color: n.text, fontSize: 18, fontWeight: '800' }}>No projects found</Text>
            <Text style={{ color: n.muted, fontSize: 15 }}>Try a different search or category.</Text>
          </View>
        )}
      </View>
      <GitHubActivity />
    </View>
  );
}
