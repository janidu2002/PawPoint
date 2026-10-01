import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { TabScreen } from '@/components/screen';
import { StatusBadge } from '@/components/status-badge';
import { font } from '@/constants/fonts';
import { Colors, Spacing, Typography } from '@/constants/theme';
import type { AppointmentStatus } from '@/types/appointment';

/** Placeholder showing the appointment list layout. Phase 7 adds real data. */
export default function AppointmentsScreen() {
  return (
    <TabScreen title="Appointments" subtitle="Your bookings at PawPoint.">
      <EmptyState
        title="No appointments yet"
        message="Book your first appointment and it will show up here."
      />

      <View style={styles.preview}>
        <Text style={styles.previewLabel}>Status colours</Text>
        <Card style={styles.previewCard}>
          {(['Pending', 'Confirmed', 'Completed', 'Cancelled'] as AppointmentStatus[]).map(
            (status) => (
              <View key={status} style={styles.previewRow}>
                <StatusBadge status={status} />
              </View>
            )
          )}
        </Card>
      </View>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  preview: {
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  previewLabel: {
    ...font('semiBold'),
    fontSize: Typography.titleMd.fontSize,
    lineHeight: Typography.titleMd.lineHeight,
    color: Colors.light.navy,
  },
  previewCard: {
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.light.divider,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
});