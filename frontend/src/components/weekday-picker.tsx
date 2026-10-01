import { Pressable, StyleSheet, Text, View } from 'react-native';

import { font } from '@/constants/fonts';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import type { Weekday } from '@/types/doctor';

/** Week order as it appears in a clinic schedule, not Sunday-first. */
export const WEEKDAY_ORDER: readonly Weekday[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

/** First three letters, so seven chips fit a phone width without wrapping. */
export const WEEKDAY_SHORT: Record<Weekday, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
};

/** Collapses a selected set into "Mon - Fri" or "Mon, Wed, Fri". */
export const formatDays = (days: Weekday[]): string => {
  if (days.length === 0) return 'No days set';

  const ordered = WEEKDAY_ORDER.filter((day) => days.includes(day));

  const isContiguousRun =
    ordered.length > 1 &&
    ordered.every((day, index) =>
      index === 0 || WEEKDAY_ORDER.indexOf(day) === WEEKDAY_ORDER.indexOf(ordered[index - 1]) + 1
    );

  if (isContiguousRun) return `${WEEKDAY_SHORT[ordered[0]]} - ${WEEKDAY_SHORT[ordered[ordered.length - 1]]}`;

  return ordered.map((day) => WEEKDAY_SHORT[day]).join(', ');
};

export interface WeekdayPickerProps {
  value: Weekday[];
  onChange: (days: Weekday[]) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * Multi-select toggle group for available days.
 *
 * A `Pressable` per day rather than a checkbox per day: the whole week is one
 * logical field, so it needs one label and one error slot, and chips keep the
 * selection visible at a glance the way checkboxes in a column do not.
 */
export function WeekdayPicker({ value, onChange, error, disabled = false }: WeekdayPickerProps) {
  const toggle = (day: Weekday) => {
    if (disabled) return;
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {WEEKDAY_ORDER.map((day) => {
          const selected = value.includes(day);

          return (
            <Pressable
              key={day}
              onPress={() => toggle(day)}
              disabled={disabled}
              // Exposed as a switch so screen readers announce on/off, and the
              // label reads as "Tuesday" even though the chip shows "Tue".
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected, disabled }}
              accessibilityLabel={day}
              style={({ pressed }) => [
                styles.chip,
                selected && styles.chipSelected,
                Boolean(error) && !selected && styles.chipError,
                pressed && !disabled && styles.chipPressed,
              ]}
            >
              <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                {WEEKDAY_SHORT[day]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    // Flex basis lets seven chips wrap onto two rows on narrow phones instead
    // of overflowing, while filling the row on wider ones.
    flexGrow: 1,
    minWidth: 40,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  chipError: {
    borderColor: Colors.light.error,
  },
  chipPressed: {
    backgroundColor: Colors.light.primarySoft,
  },
  chipLabel: {
    ...font('semiBold'),
    fontSize: Typography.labelMd.fontSize,
    lineHeight: Typography.labelMd.lineHeight,
    color: Colors.light.textSecondary,
  },
  chipLabelSelected: {
    color: Colors.light.white,
  },
  error: {
    ...font('medium'),
    fontSize: Typography.bodySm.fontSize,
    lineHeight: Typography.bodySm.lineHeight,
    color: Colors.light.error,
  },
});
