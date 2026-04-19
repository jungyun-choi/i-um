import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { api } from '../../src/lib/api';
import { useChildStore } from '../../src/stores/childStore';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IoniconsName; inactive: IoniconsName }> = {
  timeline: { active: 'book', inactive: 'book-outline' },
  milestones: { active: 'star', inactive: 'star-outline' },
  profile: { active: 'person', inactive: 'person-outline' },
};

export default function TabsLayout() {
  const setChildren = useChildStore((s) => s.setChildren);

  useEffect(() => {
    api.children.list().then((data) => setChildren(data)).catch(() => {});
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFDF8',
          borderTopColor: '#F0EDE6',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#E8735A',
        tabBarInactiveTintColor: '#BBBBBB',
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="timeline"
        options={{
          title: '타임라인',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? TAB_ICONS.timeline.active : TAB_ICONS.timeline.inactive}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="milestones"
        options={{
          title: '마일스톤',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? TAB_ICONS.milestones.active : TAB_ICONS.milestones.inactive}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '프로필',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? TAB_ICONS.profile.active : TAB_ICONS.profile.inactive}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
