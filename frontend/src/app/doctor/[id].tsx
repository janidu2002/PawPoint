import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { DoctorAvatar } from '@/components/doctor-avatar';
import { LoadingIndicator } from '@/components/loading-indicator';
import { Screen } from '@/components/screen';
import { formatDays } from '@/components/weekday-picker';
import { font } from '@/constants/fonts';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useDoctor } from '@/hooks/use-doctors';
import { ApiError, doctorsApi } from '@/lib/api';

/**
 * A doctor's profile.
 *
 * Everyone can read this; admins additionally get edit and delete. The controls
 * are gated on `user.isAdmin` for usability, but the server enforces it too, so
 * hiding them is not what keeps them safe.
 */
export default function DoctorDetailScreen() {
  // `typedRoutes` infers `id` from the [id] segment, so it arrives as a string.
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, token } = useAuth();
  const { data: doctor, error, isLoading, refetch } = useDoctor(id);

  const [deleting, setDeleting] = useState(false);

  const isAdmin = user?.isAdmin ?? false;

  if (isLoading && !doctor) {
    return (
      <Screen title="Doctor">
        <LoadingIndicator label="Loading profile…" />
      </Screen>
    );
  }

  if (!doctor) {
    // A fetch failure is worth retrying; a genuine 404 is not, so the retry is
    // only offered when the request actually errored.
    const canRetry = Boolean(error);

    return (
      <Screen title="Doctor">
        <Card style={styles.messageCard}>
          <Text style={styles.messageTitle}>Profile unavailable</Text>
          <Text style={styles.messageBody}>
            {error ?? 'This doctor could not be found.'}
          </Text>
        </Card>

        <View style={styles.actions}>
          {canRetry ? (
            <Button label="Try again" onPress={refetch} />
          ) : (
            <Button label="Go back" onPress={() => router.back()} variant="outline" />
          )}
        </View>
      </Screen>
    );
  }

  const handleDelete = () => {
    // `token` is non-null on a signed-in route, and delete is only reachable
    // when isAdmin is true.
    if (!token) return;

    Alert.alert(
      `Delete ${doctor.name}?`,
      'A vet with appointments cannot be deleted until those appointments are cancelled.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await doctorsApi.remove(doctor.id, token);
              router.back();
            } catch (deleteError) {
              const message =
                deleteError instanceof ApiError
                  ? deleteError.message
                  : 'Could not delete this doctor. Please try again.';
              Alert.alert('Delete failed', message);
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Screen title={doctor.name} subtitle={doctor.specialization}>
      <Card style={styles.headerCard}>
        <View style={styles.header}>
          <DoctorAvatar name={doctor.name} image={doctor.image} size={72} />

          <View style={styles.headerText}>
            <Text style={styles.name}>{doctor.name}</Text>
            <Text style={styles.specialization}>{doctor.specialization}</Text>
            <Text style={styles.qualification}>{doctor.qualification}</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>Details</Text>

        <DetailRow label="Consultation fee" value={`${doctor.consultationFee} / visit`} />
        <DetailRow label="Phone" value={doctor.phoneNumber} />
        <DetailRow label="Hours" value={`${doctor.startTime} - ${doctor.endTime}`} />

        <DetailRow label="Available days" value={formatDays(doctor.availableDays)} />
      </Card>

      <Card style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.description}>{doctor.description}</Text>
      </Card>

      <View style={styles.actions}>
        <Button
          label="Book appointment"
          onPress={() => router.push(`/book/${doctor.id}`)}
        />

        {isAdmin ? (
          <View style={styles.adminActions}>
            <Button
              label="Edit doctor"
              onPress={() => router.push(`/doctor-form?id=${doctor.id}`)}
              variant="outline"
            />
            <Button
              label="Delete doctor"
              onPress={handleDelete}
              variant="destructive"
              loading={deleting}
            />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  messageCard: {
    gap: Spacing.xs,
  },
  messageTitle: {
    ...font('semiBold'),
    fontSize: Typography.headlineSm.fontSize,
    lineHeight: Typography.headlineSm.lineHeight,
    color: Colors.light.text,
  },
  messageBody: {
    ...font('regular'),
    fontSize: Typography.bodyMd.fontSize,
    lineHeight: Typography.bodyMd.lineHeight,
    color: Colors.light.textSecondary,
  },
  headerCard: {
    marginBottom: Spacing.md,
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
    fontSize: Typography.headlineSm.fontSize,
    lineHeight: Typography.headlineSm.lineHeight,
    color: Colors.light.text,
  },
  specialization: {
    ...font('medium'),
    fontSize: Typography.bodyMd.fontSize,
    lineHeight: Typography.bodyMd.lineHeight,
    color: Colors.light.primaryHover,
  },
  qualification: {
    ...font('regular'),
    fontSize: Typography.bodySm.fontSize,
    lineHeight: Typography.bodySm.lineHeight,
    color: Colors.light.textSecondary,
  },
  detailsCard: {
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  sectionTitle: {
    ...font('bold'),
    fontSize: Typography.labelSm.fontSize,
    lineHeight: Typography.labelSm.lineHeight,
    letterSpacing: Typography.labelSm.letterSpacing,
    textTransform: 'uppercase',
    color: Colors.light.primaryHover,
  },
  row: {
    gap: 2,
  },
  daysRow: {
    gap: Spacing.xs,
  },
  rowLabel: {
    ...font('semiBold'),
    fontSize: Typography.labelMd.fontSize,
    lineHeight: Typography.labelMd.lineHeight,
    color: Colors.light.textSecondary,
  },
  rowValue: {
    ...font('semiBold'),
    fontSize: Typography.bodyMd.fontSize,
    lineHeight: Typography.bodyMd.lineHeight,
    color: Colors.light.text,
  },
  description: {
    ...font('regular'),
    fontSize: Typography.bodyMd.fontSize,
    lineHeight: Typography.bodyMd.lineHeight,
    color: Colors.light.textSecondary,
  },
  actions: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  adminActions: {
    gap: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.divider,
  },
});
