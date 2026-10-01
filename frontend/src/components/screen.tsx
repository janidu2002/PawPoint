import { ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

// SDK 56+ replaced direct `@react-navigation/*` imports with expo-router
// entry points; `js-tabs` is the bottom-tabs one.
import { useBottomTabBarHeight } from 'expo-router/js-tabs';

import { font } from '@/constants/fonts';
import { Colors, Spacing, Typography } from '@/constants/theme';

export interface ScreenProps {
  children: React.ReactNode;
  title?: string;
  titleAccessory?: React.ReactNode;
  subtitle?: string;
  /** Renders the body inside a ScrollView. Turn off for FlatList screens. */
  scroll?: boolean;
  /** Extra bottom padding so content clears the tab bar. */
  bottomInset?: number;
  style?: ViewStyle;
}

/**
 * Standard screen frame: navy header on the canvas background, 16px gutters on
 * mobile, and a ScrollView so content never sits under the status bar.
 */
export function Screen({
  children,
  title,
  titleAccessory,
  subtitle,
  scroll = true,
  bottomInset = 0,
  style,
}: ScreenProps) {
  const body = (
    <View style={[styles.body, style]}>
      {title ? (
        <View style={styles.header}>
          <View style={styles.titleRow}>
            {titleAccessory}
            <Text style={styles.title}>{title}</Text>
          </View>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top'] as Edge[]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + Spacing.xl }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {body}
        </ScrollView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  body: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  header: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    ...font('bold'),
    fontSize: Typography.headlineLgMobile.fontSize,
    lineHeight: Typography.headlineLgMobile.lineHeight,
    letterSpacing: Typography.headlineLgMobile.letterSpacing,
    color: Colors.light.navy,
  },
  subtitle: {
    ...font('regular'),
    fontSize: Typography.bodyMd.fontSize,
    lineHeight: Typography.bodyMd.lineHeight,
    color: Colors.light.textSecondary,
  },
});

/**
 * `Screen` for screens inside the `(tabs)` navigator.
 *
 * The tab bar floats over the screen, so scrollable content needs extra bottom
 * padding equal to the bar's height. `useBottomTabBarHeight` reads that height
 * off the navigator, which keeps it correct when the bar grows to include the
 * device safe-area inset.
 *
 * Use this only inside the tab group; plain `Screen` is for stack routes.
 */
export function TabScreen({ bottomInset = 0, ...props }: ScreenProps) {
  const tabBarHeight = useBottomTabBarHeight();

  return <Screen {...props} bottomInset={bottomInset + tabBarHeight} />;
}
