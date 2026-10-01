import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppointmentCard } from '@/components/appointment-card';
import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { LoadingIndicator } from '@/components/loading-indicator';
import { TabScreen } from '@/components/screen';
import { useAppointments } from '@/hooks/use-appointments';
import { useAuth } from '@/context/AuthContext';
import { appointmentsApi } from '@/lib/api';
import { font } from '@/constants/fonts';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { todayIsoUtc } from '@/lib/date';
import type { Appointment, AppointmentStatus } from '@/types/appointment';

/** Completed and Cancelled are final, so no later date makes them upcoming again. */
const TERMINAL_STATUSES: AppointmentStatus[] = ['Completed', 'Cancelled'];

interface Section {
  title: string;
  data: Appointment[];
}

/**
 * An appointment is upcoming while the clinic has yet to close it out: a
 * non-terminal status on a date that has not passed. Checking status before date
 * means a stray Completed row dated tomorrow still reads as history.
 */
const isUpcoming = (appointment: Appointment, today: string): boolean =>
  !TERMINAL_STATUSES.includes(appointment.status) &&
  appointment.appointmentDate >= today;

/**
 * The owner's bookings.
 *
 * Upcoming leads because that is what someone opens this tab to check. Within
 * each group the server's ascending order is flipped for Past so the most recent
 * visit is first, while Upcoming keeps soonest-first.
 */
export default function AppointmentsScreen() {
  const { token } = useAuth();
  const { data: appointments, error, isLoading, refetch } = useAppointments();

  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const today = todayIsoUtc();

  const sections = useMemo<Section[]>(() => {
    const all = appointments ?? [];
    const upcoming = all.filter((a) => isUpcoming(a, today));
    const past = all
      .filter((a) => !isUpcoming(a, today))
      .slice()
      .reverse();

    return [
      { title: 'Upcoming', data: upcoming },
      { title: 'Past', data: past },
    ].filter((section) => section.data.length > 0);
  }, [appointments, today]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const performCancel = useCallback(
    async (target: Appointment) => {
      if (!token) return;

      setActionError(null);
      setCancellingId(target.id);
      try {
        await appointmentsApi.cancel(target.id, token);
        // Refetch rather than patching local state: cancelling frees the slot,
        // so the server's view is the only one worth trusting here.
        await refetch();
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : 'Could not cancel the appointment.'
        );
      } finally {
        setCancellingId(null);
      }
    },
    [refetch, token]
  );

  const handleCancel = useCallback(
    (appointment: Appointment) => {
      Alert.alert(
        'Cancel this appointment?',
        `${appointment.petName}'s visit with ${appointment.doctor?.name ?? 'the vet'} on ${appointment.appointmentDate} at ${appointment.appointmentTime} will be released for someone else to book.`,
        [
          { text: 'Keep it', style: 'cancel' },
          {
            text: 'Cancel appointment',
            style: 'destructive',
            onPress: () => {
              void performCancel(appointment);
            },
          },
        ]
      );
    },
    [performCancel]
  );

  if (isLoading && !appointments) {
    return (
      <TabScreen title="Appointments" subtitle="Your bookings at PawPoint.">
        <LoadingIndicator label="Loading appointments…" />
      </TabScreen>
    );
  }

  return (
    <TabScreen
      title="Appointments"
      subtitle="Your bookings at PawPoint."
      scroll={false}
    >
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <AppointmentCard
            appointment={item}
            onPress={() => router.push({ pathname: '/appointment/[id]' as never, params: { id: item.id } })}
            onCancel={handleCancel}
            isCancelling={cancellingId === item.id}
          />
        )}
        ItemSeparatorComponent={Separator}
        SectionSeparatorComponent={SectionGap}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.light.primary}
          />
        }
        ListHeaderComponent={
          error || actionError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{actionError ?? error}</Text>
              <Button
                label="Try again"
                onPress={refetch}
                variant="secondary"
                fullWidth={false}
              />
            </View>
          ) : null
        }
        ListEmptyComponent={
          error ? null : (
            <EmptyState
              title="No appointments yet"
              message="Book your first appointment and it will show up here."
              actionLabel="Find a vet"
              onAction={() => router.push('/doctors')}
            />
          )
        }
      />
    </TabScreen>
  );
}

const Separator = () => <View style={styles.separator} />;

const SectionGap = () => <View style={styles.sectionGap} />;

const styles = StyleSheet.create({
  // Keeps the last card clear of the floating tab bar; TabScreen's own inset
  // does not apply inside a list's content container.
  list: {
    paddingBottom: 120,
    flexGrow: 1,
  },
  sectionHeader: {
    ...font('semiBold'),
    fontSize: Typography.labelSm.fontSize,
    lineHeight: Typography.labelSm.lineHeight,
    letterSpacing: Typography.labelSm.letterSpacing,
    textTransform: 'uppercase',
    color: Colors.light.textSecondary,
    paddingBottom: Spacing.sm,
  },
  separator: {
    height: Spacing.md,
  },
  sectionGap: {
    height: Spacing.xl,
  },
  errorBox: {
    backgroundColor: Colors.light.errorContainer,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  errorText: {
    ...font('medium'),
    fontSize: Typography.bodySm.fontSize,
    lineHeight: Typography.bodySm.lineHeight,
    color: Colors.light.errorText,
  },
});
