import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { font } from '@/constants/fonts';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { isPastDate, parseDate, todayIso } from '@/lib/date';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const dateValue = (year: number, month: number, day: number): string =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

export interface DateCalendarProps {
  value: string;
  onChange: (date: string) => void;
  error?: string;
  disabled?: boolean;
}

export function DateCalendar({ value, onChange, error, disabled = false }: DateCalendarProps) {
  const today = todayIso();
  const selected = parseDate(value);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const seed = selected ?? new Date();
    return new Date(seed.getFullYear(), seed.getMonth(), 1);
  });

  const days = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
    const totalDays = new Date(year, month + 1, 0).getDate();
    return [...Array(firstDay).fill(null), ...Array.from({ length: totalDays }, (_, index) => index + 1)];
  }, [visibleMonth]);

  const monthLabel = visibleMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const canGoBack = visibleMonth.getTime() > currentMonth;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          onPress={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}
          disabled={!canGoBack || disabled}
          style={styles.navButton}
        >
          <Text style={[styles.navText, (!canGoBack || disabled) && styles.disabled]}>‹</Text>
        </Pressable>
        <Text style={styles.month}>{monthLabel}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          onPress={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}
          disabled={disabled}
          style={styles.navButton}
        >
          <Text style={[styles.navText, disabled && styles.disabled]}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((day) => <Text key={day} style={styles.weekday}>{day}</Text>)}
      </View>

      <View style={styles.grid}>
        {days.map((day, index) => {
          if (!day) return <View key={`blank-${index}`} style={styles.day} />;
          const date = dateValue(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
          const selectedDay = date === value;
          const past = isPastDate(date);
          const unavailable = disabled || past;
          return (
            <Pressable
              key={date}
              accessibilityRole="button"
              accessibilityLabel={date}
              accessibilityState={{ selected: selectedDay, disabled: unavailable }}
              disabled={unavailable}
              onPress={() => onChange(date)}
              style={[styles.day, selectedDay && styles.selectedDay, unavailable && styles.pastDay]}
            >
              <Text style={[styles.dayText, selectedDay && styles.selectedText, unavailable && styles.disabled]}>{day}</Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}
      {value && value < today ? <Text style={styles.error}>Choose today or a future date.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  month: { ...font('semiBold'), fontSize: Typography.titleMd.fontSize, color: Colors.light.text },
  navButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md, backgroundColor: Colors.light.primarySoft },
  navText: { ...font('bold'), fontSize: 28, lineHeight: 30, color: Colors.light.primaryHover },
  weekRow: { flexDirection: 'row' },
  weekday: { ...font('semiBold'), width: '14.2857%', textAlign: 'center', fontSize: Typography.labelSm.fontSize, color: Colors.light.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  day: { width: '14.2857%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.full },
  dayText: { ...font('medium'), fontSize: Typography.bodySm.fontSize, color: Colors.light.text },
  selectedDay: { backgroundColor: Colors.light.primary },
  selectedText: { color: Colors.light.white },
  pastDay: { opacity: 0.4 },
  disabled: { color: Colors.light.placeholder },
  error: { ...font('medium'), fontSize: Typography.bodySm.fontSize, color: Colors.light.error },
});
