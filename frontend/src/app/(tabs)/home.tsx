import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { AppointmentCard } from '@/components/appointment-card';
import { LoadingIndicator } from '@/components/loading-indicator';
import { TabScreen } from '@/components/screen';
import { font } from '@/constants/fonts';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { todayIsoUtc } from '@/lib/date';
import { useAppointments } from '@/hooks/use-appointments';

/**
 * Home dashboard with the booking call-to-action and the user's next visits.
 */
export default function HomeScreen() {
  const router = useRouter();
  const { data: appointments, error, isLoading } = useAppointments();
  const now = new Date();
  const today = todayIsoUtc();
  const currentTime = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`;
  const upcoming = (appointments ?? [])
    .filter((appointment) =>
      (appointment.status === 'Pending' || appointment.status === 'Confirmed') &&
      (appointment.appointmentDate > today ||
        (appointment.appointmentDate === today && appointment.appointmentTime >= currentTime))
    )
    .sort((a, b) => `${a.appointmentDate}T${a.appointmentTime}`.localeCompare(`${b.appointmentDate}T${b.appointmentTime}`));

  return (
    <TabScreen
      title="PawPoint"
      titleAccessory={<Image source={require('@/assets/images/icon.png')} style={styles.appIcon} contentFit="contain" accessibilityLabel="PawPoint app icon" />}
      subtitle="Veterinary care, made simple."
    >
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
        {isLoading && !appointments ? <LoadingIndicator label="Loading bookings…" /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!isLoading && !error && upcoming.length === 0 ? (
          <EmptyState
            title="Nothing booked yet"
            message="Your next appointment will appear here once you book one."
            actionLabel="Find a vet"
            onAction={() => router.push('/doctors')}
          />
        ) : null}
        {upcoming.slice(0, 3).map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            onPress={() => router.push({ pathname: '/appointment/[id]' as never, params: { id: appointment.id } })}
          />
        ))}
        {upcoming.length > 3 ? (
          <Button label="View all appointments" onPress={() => router.push('/appointments')} variant="secondary" />
        ) : null}
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
  error: {
    ...font('medium'),
    fontSize: Typography.bodySm.fontSize,
    lineHeight: Typography.bodySm.lineHeight,
    color: Colors.light.error,
  },
  appIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
});
