import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { font } from '@/constants/fonts';
import { Colors, Spacing, Typography } from '@/constants/theme';

export interface EmptyStateProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Shown when a list has no items - doctors, appointments, and so on.
 * Avoids the blank screen that would otherwise look like a bug.
 */
export function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="secondary" fullWidth={false} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  title: {
    ...font('semiBold'),
    fontSize: Typography.headlineSm.fontSize,
    lineHeight: Typography.headlineSm.lineHeight,
    color: Colors.light.text,
    textAlign: 'center',
  },
  message: {
    ...font('regular'),
    fontSize: Typography.bodyMd.fontSize,
    lineHeight: Typography.bodyMd.lineHeight,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  action: {
    marginTop: Spacing.md,
  },
});