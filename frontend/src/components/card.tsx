import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';

export interface CardProps {
  children: React.ReactNode;
  /** Raises the card on interaction, DESIGN.md elevation level 2. */
  raised?: boolean;
  style?: ViewStyle;
}

/**
 * Surface panel: white background, 1px border, rounded-2xl, 24px padding,
 * with the level 1 ambient shadow from DESIGN.md.
 */
export function Card({ children, raised = false, style }: CardProps) {
  return <View style={[styles.card, raised && Shadows.level2, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    ...Shadows.level1,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
});