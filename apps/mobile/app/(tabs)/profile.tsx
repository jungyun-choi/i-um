import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useChildStore } from '../../src/stores/childStore';
import { getAgeText } from '../../src/lib/utils/age';
import { ChildAvatar } from '../../src/components/ChildAvatar';

export default function ProfileScreen() {
  const router = useRouter();
  const activeChild = useChildStore((s) => s.activeChild);

  async function handleLogout() {
    Alert.alert('로그아웃', '정말 로그아웃하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃', style: 'destructive',
        onPress: () => supabase.auth.signOut(),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>프로필</Text>

      {activeChild ? (
        <TouchableOpacity
          style={styles.childCard}
          onPress={() => router.push(`/child/${activeChild.id}/edit`)}
        >
          <ChildAvatar name={activeChild.name} avatarUrl={activeChild.avatar_url} size={56} />
          <View style={styles.childInfo}>
            <Text style={styles.childName}>{activeChild.name}</Text>
            <Text style={styles.childAge}>
              {getAgeText(activeChild.birth_date)} · {activeChild.birth_date}
            </Text>
          </View>
          <Text style={styles.editHint}>편집 ›</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.addChildBtn} onPress={() => router.push('/child/new')}>
          <Text style={styles.addChildBtnText}>+ 아이 프로필 추가</Text>
        </TouchableOpacity>
      )}

      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <Text style={styles.menuText}>로그아웃</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF8' },
  title: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', padding: 20, paddingBottom: 12 },
  childCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    margin: 16, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  childInfo: { flex: 1, marginLeft: 14 },
  childName: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
  childAge: { fontSize: 14, color: '#888', marginTop: 2 },
  editHint: { fontSize: 14, color: '#AAA' },
  addChildBtn: {
    margin: 16, backgroundColor: '#FFF0ED', borderRadius: 14,
    padding: 16, alignItems: 'center',
  },
  addChildBtnText: { color: '#E8735A', fontSize: 16, fontWeight: '500' },
  section: { marginTop: 24, borderTopWidth: 1, borderTopColor: '#F0EDE6' },
  menuItem: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F5F2EC' },
  menuText: { fontSize: 16, color: '#D44' },
});
