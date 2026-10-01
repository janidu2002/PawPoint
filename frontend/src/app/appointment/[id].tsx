import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { DoctorAvatar } from '@/components/doctor-avatar';
import { LoadingIndicator } from '@/components/loading-indicator';
import { StatusBadge } from '@/components/status-badge';
import { Screen } from '@/components/screen';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { font } from '@/constants/fonts';
import { useAuth } from '@/context/AuthContext';
import { appointmentsApi, ApiError } from '@/lib/api';
import { formatDateLabel } from '@/lib/date';
import type { Appointment } from '@/types/appointment';

export default function AppointmentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token || !id) return;
    try {
      setError(null);
      setAppointment(await appointmentsApi.get(id, token));
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Appointment could not be loaded');
    }
  }, [id, token]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const cancel = () => Alert.alert('Cancel appointment?', 'This releases the selected time slot.', [
    { text: 'Keep appointment', style: 'cancel' },
    { text: 'Cancel appointment', style: 'destructive', onPress: async () => {
      if (!token || !appointment) return;
      setBusy(true);
      try { setAppointment(await appointmentsApi.cancel(appointment.id, token)); }
      catch (value) { setError(value instanceof ApiError ? value.message : 'Could not cancel appointment'); }
      finally { setBusy(false); }
    } },
  ]);

  const remove = () => Alert.alert('Delete cancelled appointment?', 'This cannot be undone.', [
    { text: 'Keep', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      if (!token || !appointment) return;
      setBusy(true);
      try { await appointmentsApi.remove(appointment.id, token); router.back(); }
      catch (value) { setError(value instanceof ApiError ? value.message : 'Could not delete appointment'); setBusy(false); }
    } },
  ]);

  if (!appointment && !error) return <Screen title="Appointment"><LoadingIndicator label="Loading appointment…" /></Screen>;
  if (!appointment) return <Screen title="Appointment" subtitle={error ?? undefined}><Button label="Go back" onPress={() => router.back()} variant="outline" /></Screen>;

  return <Screen title="Appointment details" subtitle="Your PawPoint booking">
    <Card>
      <View style={styles.header}>
        <DoctorAvatar name={appointment.doctor?.name ?? 'Vet'} image={appointment.doctor?.image ?? null} size={56} />
        <View style={styles.grow}><Text style={styles.doctor}>{appointment.doctor?.name ?? 'Vet no longer available'}</Text><Text style={styles.muted}>{appointment.doctor?.specialization}</Text></View>
        <StatusBadge status={appointment.status} />
      </View>
      <Text style={styles.date}>{formatDateLabel(appointment.appointmentDate)} at {appointment.appointmentTime}</Text>
      <Text style={styles.label}>Pet</Text><Text style={styles.value}>{appointment.petName} · {appointment.petType} · {appointment.petBreed}</Text>
      <Text style={styles.label}>Reason</Text><Text style={styles.value}>{appointment.reason}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {appointment.status === 'Pending' ? <>
        <Button label="Reschedule" onPress={() => router.push(`/book/${appointment.doctorId}?appointmentId=${appointment.id}`)} disabled={busy} />
        <Button label="Cancel appointment" onPress={cancel} variant="outline" loading={busy} />
      </> : null}
      {appointment.status === 'Cancelled' ? <Button label="Delete appointment" onPress={remove} variant="outline" loading={busy} /> : null}
    </Card>
  </Screen>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  grow: { flex: 1 },
  doctor: { ...font('bold'), fontSize: Typography.titleMd.fontSize, color: Colors.light.text },
  muted: { ...font('regular'), fontSize: Typography.bodySm.fontSize, color: Colors.light.textSecondary },
  date: { ...font('semiBold'), fontSize: Typography.titleMd.fontSize, color: Colors.light.primary, marginBottom: Spacing.lg },
  label: { ...font('semiBold'), fontSize: Typography.labelSm.fontSize, color: Colors.light.textSecondary, marginTop: Spacing.md },
  value: { ...font('regular'), fontSize: Typography.bodyMd.fontSize, color: Colors.light.text },
  error: { color: Colors.light.error, marginVertical: Spacing.md },
});
