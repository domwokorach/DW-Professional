import AnimatedProjectPreview from '../AnimatedProjectPreview';

const BASE = '/previews/lloyds/innovation-community-graph';

const ALT = 'Animated illustrative reconstruction of an organisational knowledge graph forming around a central Innovation Community node: departments expand outwards, then teams, professional roles, cross-department collaboration links and innovation conferences, ending with the complete network and the line "Connecting people, technology and innovation."';

/** Pre-rendered, looping walk-through of the graph forming (separate from the interactive graph). */
export default function AnimatedGraphPreview() {
  return (
    <AnimatedProjectPreview alt={ALT} sources={{ webm: `${BASE}.webm`, mp4: `${BASE}.mp4`, gif: `${BASE}.gif`, poster: `${BASE}-poster.webp` }} />
  );
}
