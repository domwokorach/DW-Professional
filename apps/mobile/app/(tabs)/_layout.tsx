import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { mono, useTheme } from '~/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
const tab = (name: string, title: string, icon: IconName, focused: IconName) => ({ name, title, icon, focused });
const TABS = [
  tab('index', 'Home', 'home-outline', 'home'),
  tab('about', 'About', 'person-outline', 'person'),
  tab('experience', 'Experience', 'briefcase-outline', 'briefcase'),
  tab('projects', 'Projects', 'grid-outline', 'grid'),
  tab('contact', 'Contact', 'mail-outline', 'mail'),
];

export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.ink,
        tabBarInactiveTintColor: t.text2,
        tabBarStyle: { backgroundColor: t.card, borderTopColor: t.line },
        tabBarLabelStyle: { fontFamily: mono, fontSize: 10 },
      }}
    >
      {TABS.map((x) => (
        <Tabs.Screen
          key={x.name}
          name={x.name}
          options={{ title: x.title, tabBarIcon: ({ focused, color, size }) => <Ionicons name={focused ? x.focused : x.icon} size={size} color={color as string} /> }}
        />
      ))}
    </Tabs>
  );
}
