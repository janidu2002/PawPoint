import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { font } from '@/constants/fonts';
import { Colors, Spacing, Typography } from '@/constants/theme';

export interface LoadingIndicatorProps {
  label?: string;
  /** Fills the available space; use inside a screen or a list. */
  fullScreen?: boolean;
}

/** Spinner shown while data is being fetched. */
export function LoadingIndicator({ label = 'Loading…', fullScreen = false }: LoadingIndicatorProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={Colors.light.primary} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  fullScreen: {
    flex: 1,
  },
  label: {
    ...font('medium'),
    fontSize: Typography.bodyMd.fontSize,
    lineHeight: Typography.bodyMd.lineHeight,
    color: Colors.light.textSecondary,
  },
});