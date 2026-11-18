import { Text, View } from 'react-native';
import { BISECT } from '~/lib/bisect';

// Native: one scrolling portfolio page. (Web has its own entry in index.web.tsx.)
export default function Index() {
  if (BISECT < 2) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8EDC4' }}><Text style={{ color: '#0F1F4B', fontSize: 20, fontWeight: '800' }}>{`Launch check · level ${BISECT}`}</Text></View>;
  }
  const PortfolioPage = require('~/components/portfolio/PortfolioPage').default as React.ComponentType<{ only?: string[]; nav?: boolean }>;
  return <PortfolioPage only={BISECT === 2 ? ['home'] : undefined} nav={BISECT >= 4} />;
}
