import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { api } from '../../src/lib/api';
import { useChildStore } from '../../src/stores/childStore';
import { Text } from 'react-native';

function Icon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    timeline: focused ? '📖' : '📄',
    milestones: focused ? '⭐' : '☆',
    profile: focused ? '👤' : '○',
  };
  return <Text style={{ fontSize: 22 }}>{icons[label] ?? label}</Text>;
}

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
        tabBarInactiveTintColor: '#BBB',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="timeline"
        options={{
          title: '타임라인',
          tabBarIcon: ({ focused }) => <Icon label="timeline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="milestones"
        options={{
          title: '마일스톤',
          tabBarIcon: ({ focused }) => <Icon label="milestones" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '프로필',
          tabBarIcon: ({ focused }) => <Icon label="profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
