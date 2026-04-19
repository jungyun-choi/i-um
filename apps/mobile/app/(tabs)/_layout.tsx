import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../src/lib/api';
import { useChildStore } from '../../src/stores/childStore';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IoniconsName; inactive: IoniconsName }> = {
  timeline: { active: 'images', inactive: 'images-outline' },
  milestones: { active: 'star', inactive: 'star-outline' },
  profile: { active: 'person-circle', inactive: 'person-circle-outline' },
};

export default function TabsLayout() {
  const setChildren = useChildStore((s) => s.setChildren);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    api.children.list().then((data) => setChildren(data)).catch(() => {});
  }, []);

  const tabBarHeight = Platform.OS === 'ios' ? 52 + insets.bottom : 60;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFDF8',
          borderTopColor: '#F0EDE6',
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#E8735A',
        tabBarInactiveTintColor: '#C0BAB0',
        tabBarLabelStyle: { fontSize: 11, fontFamily: 'Pretendard-Medium' },
      }}
    >
      <Tabs.Screen
        name="timeline"
        options={{
          title: '타임라인',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? TAB_ICONS.timeline.active : TAB_ICONS.timeline.inactive} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="milestones"
        options={{
          title: '마일스톤',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? TAB_ICONS.milestones.active : TAB_ICONS.milestones.inactive} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '프로필',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? TAB_ICONS.profile.active : TAB_ICONS.profile.inactive} size={26} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
