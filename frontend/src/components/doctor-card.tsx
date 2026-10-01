import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DoctorAvatar } from '@/components/doctor-avatar';
import { formatDays } from '@/components/weekday-picker';
import { font } from '@/constants/fonts';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import type { Doctor } from '@/types/doctor';

export interface DoctorCardProps {
  doctor: Doctor;
}

/**
 * A doctor in a list: avatar, name, specialization, and the three facts a pet
 * owner picks on - fee, days, and hours.
 *
 * The whole card is one press target rather than adding a chevron button, so
 * there is no small tap target to miss on a phone.
 */
export function DoctorCard({ doctor }: DoctorCardProps) {
  return (
    <Pressable
      onPress={() => router.push(`/doctor/${doctor.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${doctor.name}, ${doctor.specialization}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <DoctorAvatar name={doctor.name} image={doctor.image} />

        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={1}>
            {doctor.name}
          </Text>
          <Text style={styles.specialization} numberOfLines={1}>
            {doctor.specialization}
          </Text>
          <Text style={styles.qualification} numberOfLines={1}>
            {doctor.qualification}
          </Text>
        </View>
      </View>

      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Fee</Text>
          <Text style={styles.metaValue}>
            {doctor.consultationFee % 1 === 0 ? doctor.consultationFee.toFixed(0) : doctor.consultationFee}
            <Text style={styles.metaSuffix}> / visit</Text>
          </Text>
        </View>

        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Days</Text>
          <Text style={styles.metaValue}>{formatDays(doctor.availableDays)}</Text>
        </View>

        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Hours</Text>
          <Text style={styles.metaValue}>
            {doctor.startTime} - {doctor.endTime}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...Shadows.level1,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  pressed: {
    ...Shadows.level2,
    backgroundColor: Colors.light.primarySoft,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  identity: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...font('bold'),
    fontSize: Typography.titleMd.fontSize,
    lineHeight: Typography.titleMd.lineHeight,
    color: Colors.light.text,
  },
  specialization: {
    ...font('medium'),
    fontSize: Typography.bodyMd.fontSize,
    lineHeight: Typography.bodyMd.lineHeight,
    color: Colors.light.primaryHover,
  },
  qualification: {
    ...font('regular'),
    fontSize: Typography.bodySm.fontSize,
    lineHeight: Typography.bodySm.lineHeight,
    color: Colors.light.textSecondary,
  },
  meta: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.light.divider,
    paddingTop: Spacing.md,
  },
  metaItem: {
    flex: 1,
    gap: 2,
  },
  metaLabel: {
    ...font('bold'),
    fontSize: Typography.labelSm.fontSize,
    lineHeight: Typography.labelSm.lineHeight,
    letterSpacing: Typography.labelSm.letterSpacing,
    textTransform: 'uppercase',
    color: Colors.light.placeholder,
  },
  metaValue: {
    ...font('semiBold'),
    fontSize: Typography.bodySm.fontSize,
    lineHeight: Typography.bodySm.lineHeight,
    color: Colors.light.text,
  },
  metaSuffix: {
    ...font('regular'),
    color: Colors.light.textSecondary,
  },
});
