import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { font } from '@/constants/fonts';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'destructive';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  /** Shows a spinner and blocks presses, for form submissions. */
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

/**
 * Primary interaction anchor. Variants follow DESIGN.md "Buttons":
 * primary teal, secondary soft-teal, outline white, destructive red.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        variants[variant].container,
        pressed && !isDisabled && variants[variant].pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.content}>
        {/* The label stays visible while loading so the button does not
            change width mid-submission. */}
        {loading ? <ActivityIndicator size="small" color={variants[variant].spinner} /> : null}
        <Text style={[styles.label, variants[variant].label]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const variants = {
  primary: {
    container: { backgroundColor: Colors.light.primary },
    pressed: { backgroundColor: Colors.light.primaryHover },
    label: { color: Colors.light.white },
    spinner: Colors.light.white,
  },
  secondary: {
    container: {
      backgroundColor: Colors.light.primarySoft,
      borderWidth: 1,
      borderColor: Colors.light.primaryBorder,
    },
    pressed: { backgroundColor: Colors.light.primaryBorder },
    label: { color: Colors.light.primaryHover },
    spinner: Colors.light.primaryHover,
  },
  outline: {
    container: {
      backgroundColor: Colors.light.white,
      borderWidth: 1,
      borderColor: Colors.light.border,
    },
    pressed: { backgroundColor: Colors.light.background },
    label: { color: Colors.light.navy },
    spinner: Colors.light.navy,
  },
  destructive: {
    container: { backgroundColor: Colors.light.error },
    pressed: { backgroundColor: Colors.light.errorHover },
    label: { color: Colors.light.white },
    spinner: Colors.light.white,
  },
} as const;

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  label: {
    ...font('semiBold'),
    fontSize: Typography.titleMd.fontSize,
    lineHeight: Typography.titleMd.lineHeight,
  },
  disabled: {
    opacity: 0.5,
  },
});