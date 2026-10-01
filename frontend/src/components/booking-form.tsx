import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { LoadingIndicator } from '@/components/loading-indicator';
import { font } from '@/constants/fonts';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useAvailability } from '@/hooks/use-availability';
import { formatDateLabel, isPastDate, isValidDate } from '@/lib/date';
import { ApiError } from '@/lib/api';
import type { AppointmentInput, PetType } from '@/types/appointment';
import type { Doctor } from '@/types/doctor';

const PET_TYPES: readonly PetType[] = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Other'];

const MAX_REASON = 1000;

export interface BookingFormProps {
  doctor: Doctor;
  onSubmit: (input: AppointmentInput) => Promise<void>;
  initialValue?: AppointmentInput;
  submitLabel?: string;
  footer?: React.ReactNode;
}

interface FormState {
  appointmentDate: string;
  appointmentTime: string;
  petName: string;
  petType: PetType | '';
  petBreed: string;
  reason: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

/**
 * Books a slot with one vet.
 *
 * Date and time are chosen before the pet details because the slot grid is what
 * constrains the rest - and a slot that has just been taken only shows up at
 * submit time, which is handled by refetching the grid rather than by silently
 * moving the user to a different time.
 */
export function BookingForm({
  doctor,
  onSubmit,
  initialValue,
  submitLabel = 'Request appointment',
  footer,
}: BookingFormProps) {
  const [state, setState] = useState<FormState>(() => ({
    appointmentDate: initialValue?.appointmentDate ?? '',
    appointmentTime: initialValue?.appointmentTime ?? '',
    petName: initialValue?.petName ?? '',
    petType: initialValue?.petType ?? '',
    petBreed: initialValue?.petBreed ?? '',
    reason: initialValue?.reason ?? '',
  }));
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: availability, error: availabilityError, isLoading, refetch } = useAvailability(
    doctor.id,
    state.appointmentDate,
  );

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setState((prev) => {
      // A time belongs to the date it was picked for, so changing the date has
      // to drop it rather than leave a stale selection in place.
      if (key === 'appointmentDate') {
        return { ...prev, appointmentDate: value, appointmentTime: '' };
      }
      return { ...prev, [key]: value };
    });
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};

    const date = state.appointmentDate.trim();
    if (!date) next.appointmentDate = 'Pick a date';
    else if (!isValidDate(date)) next.appointmentDate = 'Use YYYY-MM-DD, e.g. 2026-10-09';
    else if (isPastDate(date)) next.appointmentDate = 'That date has already passed';

    if (!state.appointmentTime) next.appointmentTime = 'Pick a time';
    if (!state.petName.trim()) next.petName = 'Pet name is required';
    if (!state.petType) next.petType = 'Choose a pet type';
    if (!state.petBreed.trim()) next.petBreed = 'Pet breed is required';
    if (!state.reason.trim()) next.reason = 'Tell the clinic why you are booking';

    return next;
  };

  const handleSubmit = async () => {
    if (submitting) return;

    setFormError(null);

    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        doctorId: doctor.id,
        petName: state.petName.trim(),
        petType: state.petType as PetType,
        petBreed: state.petBreed.trim(),
        appointmentDate: state.appointmentDate.trim(),
        appointmentTime: state.appointmentTime,
        reason: state.reason.trim(),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.errors) setErrors(error.errors as FormErrors);
        setFormError(error.message);

        // A 409 means this exact slot went while the form was open. Refetching
        // drops it from the grid, so retrying needs a new choice rather than
        // the same doomed one.
        if (error.status === 409) {
          await refetch();
        }
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const dateValid =
    Boolean(state.appointmentDate) &&
    isValidDate(state.appointmentDate.trim()) &&
    !isPastDate(state.appointmentDate.trim());

  const availableSlots = availability?.slots.filter((slot) => slot.available) ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>When</Text>

        <Input
          label="Date"
          value={state.appointmentDate}
          onChangeText={(value) => set('appointmentDate', value)}
          placeholder="2026-10-09"
          keyboardType="numbers-and-punctuation"
          maxLength={10}
          autoCapitalize="none"
          error={errors.appointmentDate}
          editable={!submitting}
        />

        {dateValid && !isLoading ? (
          <View style={styles.slotBlock}>
            <Text style={styles.fieldLabel}>
              {availability?.weekday
                ? `${availability.weekday} ${formatDateLabel(state.appointmentDate.trim())}`
                : 'Available times'}
            </Text>

            {availabilityError ? (
              <Text style={styles.error} accessibilityRole="alert">
                {availabilityError}
              </Text>
            ) : null}

            {!availabilityError && availability?.slots.length === 0 ? (
              <Text style={styles.hint}>
                {doctor.name} does not take appointments on {availability.weekday}s.
              </Text>
            ) : null}

            {!availabilityError && availability && availability.slots.length > 0 && availableSlots.length === 0 ? (
              <Text style={styles.hint}>Every slot on this day is taken. Try another date.</Text>
            ) : null}

            {availableSlots.length > 0 ? (
              <View style={styles.slotRow}>
                {availableSlots.map((slot) => {
                  const selected = state.appointmentTime === slot.time;

                  return (
                    <Pressable
                      key={slot.time}
                      onPress={() => set('appointmentTime', slot.time)}
                      disabled={submitting}
                      accessibilityRole="radio"
                      accessibilityState={{ selected, disabled: submitting }}
                      style={({ pressed }) => [
                        styles.slot,
                        selected && styles.slotSelected,
                        pressed && !submitting && styles.slotPressed,
                      ]}
                    >
                      <Text style={[styles.slotLabel, selected && styles.slotLabelSelected]}>
                        {slot.time}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {errors.appointmentTime ? (
              <Text style={styles.error} accessibilityRole="alert">
                {errors.appointmentTime}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your pet</Text>

        <Input
          label="Pet name"
          value={state.petName}
          onChangeText={(value) => set('petName', value)}
          placeholder="Biscuit"
          autoCapitalize="words"
          error={errors.petName}
          editable={!submitting}
        />

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Pet type</Text>
          <View style={styles.slotRow}>
            {PET_TYPES.map((petType) => {
              const selected = state.petType === petType;

              return (
                <Pressable
                  key={petType}
                  onPress={() => set('petType', petType)}
                  disabled={submitting}
                  accessibilityRole="radio"
                  accessibilityState={{ selected, disabled: submitting }}
                  style={({ pressed }) => [
                    styles.slot,
                    selected && styles.slotSelected,
                    pressed && !submitting && styles.slotPressed,
                  ]}
                >
                  <Text style={[styles.slotLabel, selected && styles.slotLabelSelected]}>
                    {petType}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {errors.petType ? (
            <Text style={styles.error} accessibilityRole="alert">
              {errors.petType}
            </Text>
          ) : null}
        </View>

        <Input
          label="Breed"
          value={state.petBreed}
          onChangeText={(value) => set('petBreed', value)}
          placeholder="Border Collie"
          autoCapitalize="words"
          error={errors.petBreed}
          editable={!submitting}
        />

        <Input
          label="Reason for visit"
          value={state.reason}
          onChangeText={(value) => set('reason', value)}
          placeholder="Limping on the left back leg since Tuesday."
          autoCapitalize="sentences"
          multiline
          rows={4}
          maxLength={MAX_REASON}
          error={errors.reason}
          editable={!submitting}
        />
      </View>

      {isLoading ? <LoadingIndicator label="Loading times…" /> : null}

      {formError ? (
        <Text style={styles.formError} accessibilityRole="alert">
          {formError}
        </Text>
      ) : null}

      <Button
        label={submitLabel}
        onPress={handleSubmit}
        loading={submitting}
        disabled={submitting || !dateValid}
      />

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
  },
  section: {
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
  field: {
    gap: Spacing.xs,
  },
  fieldLabel: {
    ...font('semiBold'),
    fontSize: Typography.labelMd.fontSize,
    lineHeight: Typography.labelMd.lineHeight,
    color: Colors.light.textSecondary,
  },
  slotBlock: {
    gap: Spacing.sm,
  },
  slotRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  slot: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
  },
  slotSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  slotPressed: {
    backgroundColor: Colors.light.primarySoft,
  },
  slotLabel: {
    ...font('semiBold'),
    fontSize: Typography.labelMd.fontSize,
    lineHeight: Typography.labelMd.lineHeight,
    color: Colors.light.textSecondary,
  },
  slotLabelSelected: {
    color: Colors.light.white,
  },
  hint: {
    ...font('regular'),
    fontSize: Typography.bodySm.fontSize,
    lineHeight: Typography.bodySm.lineHeight,
    color: Colors.light.textSecondary,
  },
  error: {
    ...font('medium'),
    fontSize: Typography.bodySm.fontSize,
    lineHeight: Typography.bodySm.lineHeight,
    color: Colors.light.error,
  },
  formError: {
    ...font('medium'),
    fontSize: Typography.bodySm.fontSize,
    lineHeight: Typography.bodySm.lineHeight,
    color: Colors.light.error,
    backgroundColor: Colors.light.errorContainer,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  footer: {
    gap: Spacing.sm,
  },
});
