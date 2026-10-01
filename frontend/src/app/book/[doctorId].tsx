import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { BookingForm } from '@/components/booking-form';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { DoctorAvatar } from '@/components/doctor-avatar';
import { LoadingIndicator } from '@/components/loading-indicator';
import { Screen } from '@/components/screen';
import { useAuth } from '@/context/AuthContext';
import { useDoctor } from '@/hooks/use-doctors';
import { appointmentsApi } from '@/lib/api';
import { formatDays } from '@/components/weekday-picker';
import { font } from '@/constants/fonts';
import { Colors, Spacing, Typography } from '@/constants/theme';

/**
 * Books an appointment with one vet.
 *
 * Reached from the doctor profile. The vet is re-fetched here rather than passed
 * through the navigation params, so a stale link still shows the right schedule.
 */
export default function BookingScreen() {
  const { doctorId } = useLocalSearchParams<{ doctorId: string }>();
  const { token } = useAuth();
  const { data: doctor, isLoading } = useDoctor(doctorId);

  if (isLoading && !doctor) {
    return (
      <Screen title="Book appointment">
        <LoadingIndicator label="Loading doctor…" />
      </Screen>
    );
  }

  if (!doctor) {
    return (
      <Screen title="Book appointment" subtitle="This doctor could not be found.">
        <Button label="Go back" onPress={() => router.back()} variant="outline" />
      </Screen>
    );
  }

  const handleSubmit = async (input: Parameters<typeof appointmentsApi.create>[0]) => {
    if (!token) return;

    await appointmentsApi.create(input, token);

    // No confirmation screen yet - the appointments list arrives in a later
    // phase. Going back to the profile is the only honest end state for now.
    router.back();
  };

  return (
    <Screen
      title="Book appointment"
      subtitle={`${doctor.name} · ${doctor.specialization}`}
    >
      <Card style={styles.summaryCard}>
        <View style={styles.header}>
          <DoctorAvatar name={doctor.name} image={doctor.image} size={56} />

          <View style={styles.headerText}>
            <Text style={styles.name}>{doctor.name}</Text>
            <Text style={styles.meta}>
              {formatDays(doctor.availableDays)} · {doctor.startTime}–{doctor.endTime}
            </Text>
            <Text style={styles.meta}>{doctor.consultationFee} / visit</Text>
          </View>
        </View>
      </Card>

      <BookingForm
        doctor={doctor}
        onSubmit={handleSubmit}
        footer={
          <View style={styles.footer}>
            <Button label="Cancel" onPress={() => router.back()} variant="outline" />
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...font('bold'),
    fontSize: Typography.titleMd.fontSize,
    lineHeight: Typography.titleMd.lineHeight,
    color: Colors.light.text,
  },
  meta: {
    ...font('regular'),
    fontSize: Typography.bodySm.fontSize,
    lineHeight: Typography.bodySm.lineHeight,
    color: Colors.light.textSecondary,
  },
  footer: {
    marginTop: 4,
  },
});
