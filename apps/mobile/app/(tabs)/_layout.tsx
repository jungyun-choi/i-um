import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { api } from '../../src/lib/api';
import { useChildStore } from '../../src/stores/childStore';

export default function TabsLayout() {
  const setChildren = useChildStore((s) => s.setChildren);

  useEffect(() => {
    api.children.list().then((data) => setChildren(data)).catch(() => {});
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#E8735A',
        tabBarStyle: { backgroundColor: '#FFFDF8', borderTopColor: '#F0EDE6' },
      }}
    >
      <Tabs.Screen
        name="timeline"
        options={{ title: '타임라인', tabBarLabel: '타임라인' }}
      />
      <Tabs.Screen
        name="milestones"
        options={{ title: '마일스톤', tabBarLabel: '마일스톤' }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: '프로필', tabBarLabel: '프로필' }}
      />
    </Tabs>
  );
}
