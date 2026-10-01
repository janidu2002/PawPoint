import { StyleSheet, Text, View } from 'react-native';

import { font } from '@/constants/fonts';
import { Colors, Radius, Spacing, Typography, statusColors } from '@/constants/theme';
import type { AppointmentStatus } from '@/types/appointment';

export interface StatusBadgeProps {
  status: AppointmentStatus;
}

/**
 * Pill-shaped status indicator with a leading dot, per DESIGN.md
 * "Badges & Status Chips".
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  const tone = statusColors[status];

  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <View style={[styles.dot, { backgroundColor: tone.dot }]} />
      <Text style={[styles.label, { color: tone.fg }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
  },
  label: {
    ...font('bold'),
    fontSize: Typography.labelSm.fontSize,
    lineHeight: Typography.labelSm.lineHeight,
    letterSpacing: Typography.labelSm.letterSpacing,
    textTransform: 'uppercase',
    color: Colors.light.text,
  },
});