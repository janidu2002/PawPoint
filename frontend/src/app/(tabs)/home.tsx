import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { TabScreen } from '@/components/screen';
import { font } from '@/constants/fonts';
import { Colors, Spacing, Typography } from '@/constants/theme';

/**
 * Home placeholder for Phase 1. Establishes the layout and PawPoint visual
 * language; the greeting, doctor preview and upcoming appointment preview
 * arrive with real API data in later phases.
 */
export default function HomeScreen() {
  const router = useRouter();

  return (
    <TabScreen title="PawPoint" subtitle="Veterinary care, made simple.">
      <View style={styles.greeting}>
        <Text style={styles.greetingTitle}>Hi there</Text>
        <Text style={styles.greetingBody}>
          Book and manage your pet’s appointments at PawPoint.
        </Text>
      </View>

      <Card style={styles.ctaCard}>
        <Text style={styles.ctaTitle}>Need an appointment?</Text>
        <Text style={styles.ctaBody}>
          Choose a veterinarian and pick a time that suits you.
        </Text>
        <Button
          label="Book an appointment"
          onPress={() => router.push('/appointments')}
        />
      </Card>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming</Text>
        <EmptyState
          title="Nothing booked yet"
          message="Your next appointment will appear here once you book one."
        />
      </View>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  greeting: {
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  greetingTitle: {
    ...font('bold'),
    fontSize: Typography.headlineSm.fontSize,
    lineHeight: Typography.headlineSm.lineHeight,
    color: Colors.light.text,
  },
  greetingBody: {
    ...font('regular'),
    fontSize: Typography.bodyMd.fontSize,
    lineHeight: Typography.bodyMd.lineHeight,
    color: Colors.light.textSecondary,
  },
  ctaCard: {
    backgroundColor: Colors.light.primarySoft,
    borderColor: Colors.light.primaryBorder,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  ctaTitle: {
    ...font('bold'),
    fontSize: Typography.headlineSm.fontSize,
    lineHeight: Typography.headlineSm.lineHeight,
    color: Colors.light.navy,
  },
  ctaBody: {
    ...font('regular'),
    fontSize: Typography.bodyMd.fontSize,
    lineHeight: Typography.bodyMd.lineHeight,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    ...font('semiBold'),
    fontSize: Typography.titleMd.fontSize,
    lineHeight: Typography.titleMd.lineHeight,
    color: Colors.light.navy,
  },
});