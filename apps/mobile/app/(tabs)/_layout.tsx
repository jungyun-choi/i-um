import { Slot } from 'expo-router';
import { useEffect } from 'react';
import { api } from '../../src/lib/api';
import { useChildStore } from '../../src/stores/childStore';

export default function TabsLayout() {
  const setChildren = useChildStore((s) => s.setChildren);

  useEffect(() => {
    api.children.list().then((data) => setChildren(data)).catch(() => {});
  }, []);

  return <Slot />;
}
