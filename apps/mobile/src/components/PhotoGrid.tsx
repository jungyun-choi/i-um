import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Image } from 'expo-image';

interface Photo {
  uri: string;
}

interface Props {
  photos: Photo[];
  onRemove?: (index: number) => void;
}

export function PhotoGrid({ photos, onRemove }: Props) {
  return (
    <View style={styles.grid}>
      {photos.map((photo, i) => (
        <View key={i} style={styles.cell}>
          <Image
            source={photo.uri}
            style={styles.thumb}
            contentFit="cover"
            transition={150}
          />
          {onRemove && (
            <TouchableOpacity style={styles.remove} onPress={() => onRemove(i)}>
              <Text style={styles.removeText}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, gap: 4 },
  cell: { width: '32%', position: 'relative' },
  thumb: { width: '100%', aspectRatio: 1, borderRadius: 12 },
  remove: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)', width: 24, height: 24,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  removeText: { color: '#fff', fontSize: 16, lineHeight: 22, fontWeight: '700' },
});
