import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { font } from '@/constants/fonts';
import { Colors, Spacing, Typography } from '@/constants/theme';

/**
 * Doctor detail placeholder for Phase 4. `typedRoutes` infers the `id`
 * param from the [id] route segment, so it arrives as a string here.
 */
export default function DoctorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Screen title="Doctor" subtitle="Profile details arrive in Phase 4.">
      <Card style={styles.card}>
        <Text style={styles.label}>Doctor ID from the route</Text>
        <Text style={styles.id}>{id ?? 'missing'}</Text>
      </Card>

      <View style={styles.actions}>
        <Button label="Book appointment" onPress={() => {}} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.xs,
  },
  label: {
    ...font('regular'),
    fontSize: Typography.bodySm.fontSize,
    lineHeight: Typography.bodySm.lineHeight,
    color: Colors.light.textSecondary,
  },
  id: {
    ...font('semiBold'),
    fontSize: Typography.bodyMd.fontSize,
    color: Colors.light.text,
  },
  actions: {
    marginTop: Spacing.lg,
  },
});