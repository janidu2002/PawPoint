import { ScrollView, Pressable, StyleSheet, Text } from 'react-native';

import { font } from '@/constants/fonts';
import { Colors, Radius, Spacing, Typography, statusColors } from '@/constants/theme';
import type { AppointmentStatus, AppointmentStatusFilter } from '@/types/appointment';

/** `All` leads because the unfiltered queue is what an admin opens to see. */
const FILTERS: readonly AppointmentStatusFilter[] = [
  'All',
  'Pending',
  'Confirmed',
  'Completed',
  'Cancelled',
];

export interface StatusFilterProps {
  value: AppointmentStatusFilter;
  onChange: (status: AppointmentStatusFilter) => void;
}

/**
 * Single-select filter for the clinic queue.
 *
 * Horizontally scrollable rather than wrapped: five chips plus the section headers
 * below them would push the queue itself off the first screen on a phone, and the
 * point of the queue is the appointments, not the controls.
 *
 * Selected chips borrow their colour from the same `statusColors` map the badges
 * use, so a filter and the rows it selects agree without a second palette here.
 */
export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {FILTERS.map((filter) => {
        const selected = value === filter;
        const tint =
          filter === 'All'
            ? { bg: Colors.light.primarySoft, fg: Colors.light.primary }
            : statusColors[filter as AppointmentStatus];

        return (
          <Pressable
            key={filter}
            onPress={() => onChange(filter)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.chip,
              selected && { backgroundColor: tint.bg, borderColor: tint.fg },
              pressed && !selected && styles.chipPressed,
            ]}
          >
            <Text style={[styles.chipLabel, selected && { color: tint.fg }]}>
              {filter}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  chip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
  },
  chipPressed: {
    backgroundColor: Colors.light.background,
  },
  chipLabel: {
    ...font('medium'),
    fontSize: Typography.labelMd.fontSize,
    lineHeight: Typography.labelMd.lineHeight,
    color: Colors.light.textSecondary,
  },
});