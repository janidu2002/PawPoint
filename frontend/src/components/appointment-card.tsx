import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { DoctorAvatar } from '@/components/doctor-avatar';
import { font } from '@/constants/fonts';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { formatDateLabel } from '@/lib/date';
import type { Appointment } from '@/types/appointment';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export interface AppointmentCardProps {
  appointment: Appointment;
  /** Present when the request is still Pending, so only then can it be withdrawn. */
  onCancel?: (appointment: Appointment) => void;
  isCancelling?: boolean;
  /** Admin queue only. Who booked it - the owner's own list already knows. */
  ownerName?: string;
  /** Admin queue only. The status actions valid for this row's current status. */
  actions?: React.ReactNode;
  onPress?: () => void;
}

/**
 * A single booking.
 *
 * Status is a badge rather than a tint on the whole card, so a cancelled row
 * stays legible instead of looking disabled.
 */
export function AppointmentCard({
  appointment,
  onCancel,
  isCancelling = false,
  ownerName,
  actions,
  onPress,
}: AppointmentCardProps) {
  const isCancellable =
    onCancel !== undefined && appointment.status === 'Pending' && !isCancelling;

  // The queue substitutes who booked the appointment for the vet's
  // specialisation, because "who is this for" is what an admin triaging the day
  // needs, and the specialisation is already implied by the vet's name above it.
  const subtitle = ownerName
    ? `Booked by ${ownerName}`
    : appointment.doctor?.specialization ?? 'Appointment';

  const content = (
    <Card style={styles.card}>
      <View style={styles.header}>
        <DoctorAvatar
          name={appointment.doctor?.name ?? 'Vet'}
          image={appointment.doctor?.image ?? null}
          size={48}
        />

        <View style={styles.headerText}>
          <Text style={styles.doctor} numberOfLines={1}>
            {appointment.doctor?.name ?? 'Vet no longer available'}
          </Text>
          <Text style={styles.specialization} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>

        <StatusBadge status={appointment.status} />
      </View>

      <View style={styles.when}>
        <Text style={styles.date}>{formatDateLabel(appointment.appointmentDate)}</Text>
        <Text style={styles.time}>{appointment.appointmentTime}</Text>
      </View>

      <View style={styles.petRow}>
        <Text style={styles.petName}>{appointment.petName}</Text>
        <Text style={styles.petMeta} numberOfLines={1}>
          {appointment.petType}
          {appointment.petBreed ? ` · ${appointment.petBreed}` : ''}
        </Text>
      </View>

      <Text style={styles.reason} numberOfLines={2}>
        {appointment.reason}
      </Text>

      {actions ?? (isCancellable ? (
        <Button
          label="Cancel appointment"
          onPress={() => onCancel?.(appointment)}
          variant="outline"
          loading={isCancelling}
          style={styles.cancelButton}
        />
      ) : null)}
    </Card>
  );
  return onPress ? <Pressable onPress={onPress} accessibilityRole="button">{content}</Pressable> : content;
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  doctor: {
    ...font('semiBold'),
    fontSize: Typography.titleMd.fontSize,
    lineHeight: Typography.titleMd.lineHeight,
    color: Colors.light.text,
  },
  specialization: {
    ...font('regular'),
    fontSize: Typography.bodySm.fontSize,
    lineHeight: Typography.bodySm.lineHeight,
    color: Colors.light.textSecondary,
  },
  when: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.light.divider,
  },
  date: {
    ...font('semiBold'),
    fontSize: Typography.labelMd.fontSize,
    lineHeight: Typography.labelMd.lineHeight,
    color: Colors.light.text,
  },
  time: {
    ...font('medium'),
    fontSize: Typography.labelMd.fontSize,
    lineHeight: Typography.labelMd.lineHeight,
    color: Colors.light.primary,
  },
  petRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  petName: {
    ...font('medium'),
    fontSize: Typography.bodySm.fontSize,
    lineHeight: Typography.bodySm.lineHeight,
    color: Colors.light.text,
  },
  petMeta: {
    ...font('regular'),
    fontSize: Typography.bodySm.fontSize,
    lineHeight: Typography.bodySm.lineHeight,
    color: Colors.light.textSecondary,
    flexShrink: 1,
  },
  reason: {
    ...font('regular'),
    fontSize: Typography.bodySm.fontSize,
    lineHeight: Typography.bodySm.lineHeight,
    color: Colors.light.textSecondary,
  },
  cancelButton: {
    marginTop: Spacing.xs,
  },
});
