import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { WeekdayPicker } from '@/components/weekday-picker';
import { font } from '@/constants/fonts';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { ApiError } from '@/lib/api';
import type { Doctor, DoctorInput, Weekday } from '@/types/doctor';

/** Mirrors the server's TIME_PATTERN so bad input never needs a round trip. */
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_DESCRIPTION = 1000;

export interface DoctorFormProps {
  /** Present when editing; seeds the fields. Omit to start blank. */
  doctor?: Doctor;
  submitLabel: string;
  onSubmit: (input: DoctorInput) => Promise<void>;
  /** Rendered under the submit button, for navigation or extras. */
  footer?: React.ReactNode;
}

interface FormState {
  name: string;
  specialization: string;
  qualification: string;
  phoneNumber: string;
  availableDays: Weekday[];
  startTime: string;
  endTime: string;
  consultationFee: string;
  description: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const emptyState: FormState = {
  name: '',
  specialization: '',
  qualification: '',
  phoneNumber: '',
  availableDays: [],
  startTime: '09:00',
  endTime: '17:00',
  consultationFee: '',
  description: '',
};

const fromDoctor = (doctor: Doctor): FormState => ({
  name: doctor.name,
  specialization: doctor.specialization,
  qualification: doctor.qualification,
  phoneNumber: doctor.phoneNumber,
  availableDays: doctor.availableDays,
  startTime: doctor.startTime,
  endTime: doctor.endTime,
  // Kept as a string because it is edited in a text field; trailing zeroes from
  // the server would otherwise show up as "85.50" in the input.
  consultationFee: String(doctor.consultationFee),
  description: doctor.description,
});

/**
 * Checks every field up front and returns the messages, so the admin sees all
 * problems at once instead of fixing them one submit at a time.
 */
const validate = (state: FormState): FormErrors => {
  const errors: FormErrors = {};

  if (state.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
  if (!state.specialization.trim()) errors.specialization = 'Specialization is required';
  if (!state.qualification.trim()) errors.qualification = 'Qualification is required';
  if (!state.phoneNumber.trim()) errors.phoneNumber = 'Phone number is required';

  if (state.availableDays.length === 0) {
    errors.availableDays = 'Select at least one available day';
  }

  if (!TIME_PATTERN.test(state.startTime.trim())) {
    errors.startTime = 'Use 24-hour HH:mm, e.g. 09:00';
  }
  if (!TIME_PATTERN.test(state.endTime.trim())) {
    errors.endTime = 'Use 24-hour HH:mm, e.g. 17:00';
  }
  if (!errors.startTime && !errors.endTime && state.endTime.trim() <= state.startTime.trim()) {
    errors.endTime = 'End time must be after the start time';
  }

  const fee = state.consultationFee.trim();
  const feeValue = Number(fee);
  if (fee === '') {
    errors.consultationFee = 'Consultation fee is required';
  } else if (!Number.isFinite(feeValue)) {
    errors.consultationFee = 'Consultation fee must be a number';
  } else if (feeValue < 0) {
    errors.consultationFee = 'Consultation fee cannot be negative';
  }

  const description = state.description.trim();
  if (!description) {
    errors.description = 'Description is required';
  } else if (description.length > MAX_DESCRIPTION) {
    errors.description = `Description must be ${MAX_DESCRIPTION} characters or fewer`;
  }

  return errors;
};

/**
 * Create/edit form for a doctor, shared by the add and edit screens so both
 * stay in step on fields and validation.
 *
 * Server field errors are merged into local ones: the server stays the
 * authority, but anything it rejects is shown next to the same input the
 * client uses for its own checks.
 */
export function DoctorForm({ doctor, submitLabel, onSubmit, footer }: DoctorFormProps) {
  const [state, setState] = useState<FormState>(() =>
    doctor ? fromDoctor(doctor) : emptyState
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
    // Clear the message as soon as the admin touches the field, so a stale error
    // does not sit under a value they have already corrected.
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const handleSubmit = async () => {
    if (submitting) return;

    setFormError(null);

    const clientErrors = validate(state);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        name: state.name.trim(),
        specialization: state.specialization.trim(),
        qualification: state.qualification.trim(),
        phoneNumber: state.phoneNumber.trim(),
        availableDays: state.availableDays,
        startTime: state.startTime.trim(),
        endTime: state.endTime.trim(),
        consultationFee: Number(state.consultationFee.trim()),
        description: state.description.trim(),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.errors) setErrors(error.errors as FormErrors);
        setFormError(error.message);
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Identity</Text>
        <Input
          label="Full name"
          value={state.name}
          onChangeText={(value) => set('name', value)}
          placeholder="Dr. Marie Curie"
          autoCapitalize="words"
          autoComplete="name"
          error={errors.name}
          editable={!submitting}
        />
        <Input
          label="Specialization"
          value={state.specialization}
          onChangeText={(value) => set('specialization', value)}
          placeholder="Radiology"
          autoCapitalize="words"
          error={errors.specialization}
          editable={!submitting}
        />
        <Input
          label="Qualification"
          value={state.qualification}
          onChangeText={(value) => set('qualification', value)}
          placeholder="DVM, PhD"
          autoCapitalize="words"
          error={errors.qualification}
          editable={!submitting}
        />
        <Input
          label="Phone number"
          value={state.phoneNumber}
          onChangeText={(value) => set('phoneNumber', value)}
          placeholder="+1 555 0100"
          keyboardType="phone-pad"
          autoComplete="tel"
          error={errors.phoneNumber}
          editable={!submitting}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Availability</Text>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Available days</Text>
          <WeekdayPicker
            value={state.availableDays}
            onChange={(days) => set('availableDays', days)}
            error={errors.availableDays}
            disabled={submitting}
          />
        </View>

        <View style={styles.timeRow}>
          <View style={styles.timeField}>
            <Input
              label="Start time"
              value={state.startTime}
              onChangeText={(value) => set('startTime', value)}
              placeholder="09:00"
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              error={errors.startTime}
              editable={!submitting}
            />
          </View>
          <View style={styles.timeField}>
            <Input
              label="End time"
              value={state.endTime}
              onChangeText={(value) => set('endTime', value)}
              placeholder="17:00"
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              error={errors.endTime}
              editable={!submitting}
            />
          </View>
        </View>

        <Input
          label="Consultation fee"
          value={state.consultationFee}
          onChangeText={(value) => set('consultationFee', value)}
          placeholder="85.00"
          keyboardType="decimal-pad"
          error={errors.consultationFee}
          editable={!submitting}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Input
          label="Description"
          value={state.description}
          onChangeText={(value) => set('description', value)}
          placeholder="What this vet specialises in, their experience, and anything a pet owner should know before booking."
          autoCapitalize="sentences"
          multiline
          rows={5}
          maxLength={MAX_DESCRIPTION}
          error={errors.description}
          editable={!submitting}
        />
      </View>

      {formError ? (
        <Text style={styles.formError} accessibilityRole="alert">
          {formError}
        </Text>
      ) : null}

      <Button label={submitLabel} onPress={handleSubmit} loading={submitting} />

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
  timeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  timeField: {
    flex: 1,
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
