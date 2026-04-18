import { View, Text, Image, StyleSheet } from 'react-native';

interface Props {
  name: string;
  avatarUrl?: string;
  size?: number;
}

export function ChildAvatar({ name, avatarUrl, size = 56 }: Props) {
  const radius = size / 2;
  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[styles.image, { width: size, height: size, borderRadius: radius }]}
      />
    );
  }
  return (
    <View style={[styles.placeholder, { width: size, height: size, borderRadius: radius }]}>
      <Text style={[styles.initial, { fontSize: size * 0.43 }]}>{name[0]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { resizeMode: 'cover' },
  placeholder: { backgroundColor: '#FFE0D9', alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#E8735A', fontWeight: '600' },
});
