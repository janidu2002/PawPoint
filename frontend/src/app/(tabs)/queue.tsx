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
import { StatusFilter } from '@/components/status-filter';
import { useAdminAppointments } from '@/hooks/use-admin-appointments';
import { useAuth } from '@/context/AuthContext';
import { appointmentsApi } from '@/lib/api';
import { font } from '@/constants/fonts';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { formatDateLabel } from '@/lib/date';
import type {
  Appointment,
  AppointmentStatus,
  AppointmentStatusFilter,
} from '@/types/appointment';

interface Section {
  title: string;
  data: Appointment[];
}

/**
 * Which transitions the clinic can make from a given status.
 *
 * Mirrors the server's STATUS_TRANSITIONS so the queue never offers a button the
 * API would answer with 409. Kept separate rather than imported because the
 * server's map is a build of the whole graph, not what one row can do next.
 */
const NEXT_STATUS: Partial<Record<AppointmentStatus, AppointmentStatus>> = {
  Pending: 'Confirmed',
  Confirmed: 'Completed',
};

/** Pending and Confirmed both hold a slot, so either is worth cancelling. */
const CAN_CANCEL: AppointmentStatus[] = ['Pending', 'Confirmed'];

/**
 * The clinic's day, across every user.
 *
 * Grouped by calendar day rather than by status, because a clinic works a
 * schedule: what matters is what is happening on a given date, and the status
 * filter above already narrows that when the admin wants a single column.
 */
export default function QueueScreen() {
  const { user, token } = useAuth();
  const [filter, setFilter] = useState<AppointmentStatusFilter>('All');
  const { data: appointments, error, isLoading, refetch } = useAdminAppointments(filter);

  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const sections = useMemo<Section[]>(() => {
    const grouped = new Map<string, Appointment[]>();

    for (const appointment of appointments ?? []) {
      const bucket = grouped.get(appointment.appointmentDate);
      if (bucket) bucket.push(appointment);
      else grouped.set(appointment.appointmentDate, [appointment]);
    }

    // The server already ordered by date then time, and Map preserves insertion
    // order, so the sections come out soonest-first without a second sort.
    return [...grouped.entries()].map(([date, data]) => ({
      title: formatDateLabel(date),
      data,
    }));
  }, [appointments]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const performUpdate = useCallback(
    async (target: Appointment, status: AppointmentStatus) => {
      if (!token) return;

      setActionError(null);
      setUpdatingId(target.id);
      try {
        await appointmentsApi.setStatus(target.id, status, token);
        // Refetch rather than patching the row: completing or cancelling frees
        // the slot, so the server's view is the only one worth trusting.
        await refetch();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Could not update the appointment.');
      } finally {
        setUpdatingId(null);
      }
    },
    [refetch, token]
  );

  const confirmUpdate = useCallback(
    (target: Appointment, status: AppointmentStatus, question: string) => {
      Alert.alert(question, `${target.petName}'s ${target.appointmentTime} slot will be released.`, [
        { text: 'Keep it', style: 'cancel' },
        {
          text: status,
          style: status === 'Cancelled' ? 'destructive' : 'default',
          onPress: () => {
            void performUpdate(target, status);
          },
        },
      ]);
    },
    [performUpdate]
  );

  const handleAdvance = useCallback(
    (target: Appointment) => {
      const next = NEXT_STATUS[target.status];
      if (!next) return;
      void performUpdate(target, next);
    },
    [performUpdate]
  );

  const handleCancel = useCallback(
    (target: Appointment) => {
      confirmUpdate(target, 'Cancelled', 'Cancel this appointment?');
    },
    [confirmUpdate]
  );

  const renderActions = useCallback(
    (item: Appointment) => {
      const next = NEXT_STATUS[item.status];
      const busy = updatingId === item.id;
      if (!next && !CAN_CANCEL.includes(item.status)) return null;

      return (
        <View style={styles.actions}>
          {next ? (
            <Button
              label={next === 'Confirmed' ? 'Confirm' : 'Mark complete'}
              onPress={() => handleAdvance(item)}
              variant="secondary"
              loading={busy}
              disabled={busy}
              style={styles.action}
            />
          ) : null}

          {CAN_CANCEL.includes(item.status) ? (
            <Button
              label="Cancel"
              onPress={() => handleCancel(item)}
              variant="destructive"
              disabled={busy}
              style={styles.action}
            />
          ) : null}
        </View>
      );
    },
    [handleAdvance, handleCancel, updatingId]
  );

  if (user && !user.isAdmin) {
    return (
      <TabScreen title="Queue" subtitle="Every booking in the clinic.">
        <EmptyState
          title="Not available"
          message="Only clinic admins can see the appointment queue."
        />
      </TabScreen>
    );
  }

  if (isLoading && !appointments) {
    return (
      <TabScreen title="Queue" subtitle="Every booking in the clinic.">
        <LoadingIndicator label="Loading the queue…" />
      </TabScreen>
    );
  }

  return (
    <TabScreen title="Queue" subtitle="Every booking in the clinic." scroll={false}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <AppointmentCard
            appointment={item}
            ownerName={item.owner?.name}
            actions={renderActions(item)}
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
          <View style={styles.header}>
            <StatusFilter value={filter} onChange={setFilter} />

            {error || actionError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{actionError ?? error}</Text>
                <Button
                  label="Try again"
                  onPress={refetch}
                  variant="secondary"
                  fullWidth={false}
                />
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          error ? null : (
            <EmptyState
              title="Nothing queued"
              message={
                filter === 'All'
                  ? 'Bookings from every pet owner will appear here.'
                  : `No ${filter.toLowerCase()} appointments right now.`
              }
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
  list: {
    paddingBottom: 120,
    flexGrow: 1,
  },
  header: {
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
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
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  action: {
    flex: 1,
  },
  errorBox: {
    backgroundColor: Colors.light.errorContainer,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  errorText: {
    ...font('medium'),
    fontSize: Typography.bodySm.fontSize,
    lineHeight: Typography.bodySm.lineHeight,
    color: Colors.light.errorText,
  },
});