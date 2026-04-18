import { View, Image, StyleSheet, TouchableOpacity, Text } from 'react-native';

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
          <Image source={{ uri: photo.uri }} style={styles.thumb} />
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 2 },
  cell: { width: '33.33%', padding: 2, position: 'relative' },
  thumb: { width: '100%', aspectRatio: 1, borderRadius: 4 },
  remove: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.55)', width: 22, height: 22,
    borderRadius: 11, alignItems: 'center', justifyContent: 'center',
  },
  removeText: { color: '#fff', fontSize: 15, lineHeight: 20, fontWeight: '700' },
});
