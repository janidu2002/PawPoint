import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

export interface DoctorAvatarProps {
  name: string;
  image: string | null;
  /** Diameter in px; call sites pass the size their layout needs. */
  size?: number;
}

/**
 * Up to two initials from a doctor's name.
 *
 * Titles are kept but "Dr." and "Prof." dropped, so "Dr. Marie Curie" reads
 * "MC" rather than "DM". Single-word names fall back to one letter.
 */
export const initialsOf = (name: string): string => {
  const words = name
    .replace(/\b(dr|prof|mr|mrs|ms|miss)\.?\s*/gi, '')
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return '?';

  const letters = words.slice(0, 2).map((word) => word.charAt(0).toUpperCase());
  return letters.join('');
};

/**
 * Doctor portrait, falling back to initials on a teal-soft circle when there is
 * no image URL.
 */
export function DoctorAvatar({ name, image, size = 56 }: DoctorAvatarProps) {
  if (image) {
    return (
      <Image
        source={{ uri: image }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
        // Decorative: the doctor's name is always rendered next to it.
        accessibilityElementsHidden
      />
    );
  }

  // Scales with the avatar so a large detail-header initial does not look
  // undersized in a 20px circle.
  const fontSize = Math.round(size * 0.38);

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initialsOf(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: Colors.light.primarySoft,
    borderWidth: 1,
    borderColor: Colors.light.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    ...font('bold'),
    color: Colors.light.primaryHover,
  },
});
