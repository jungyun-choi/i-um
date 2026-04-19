import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

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
        source={avatarUrl}
        style={[styles.image, { width: size, height: size, borderRadius: radius }]}
        contentFit="cover"
        cachePolicy="disk"
        transition={150}
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
  image: {},
  placeholder: { backgroundColor: '#FFE0D9', alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#E8735A', fontWeight: '600' },
});
