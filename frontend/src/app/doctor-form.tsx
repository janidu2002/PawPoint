import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { DoctorForm } from '@/components/doctor-form';
import { LoadingIndicator } from '@/components/loading-indicator';
import { Screen } from '@/components/screen';
import { useAuth } from '@/context/AuthContext';
import { useDoctor } from '@/hooks/use-doctors';
import { doctorsApi } from '@/lib/api';
import type { DoctorInput } from '@/types/doctor';

/**
 * One screen for adding and editing a vet.
 *
 * `?id=` selects edit mode; without it the form starts blank for a new doctor.
 * Keeping both in one file means the two paths cannot drift apart.
 *
 * Admin-only: the backend rejects these writes with 403, and this screen also
 * sends a regular user away rather than letting them fill in a form that is
 * guaranteed to fail.
 */
export default function DoctorFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user, token } = useAuth();

  const isAdmin = user?.isAdmin ?? false;
  const isEditing = Boolean(id);

  // Only fetch in edit mode, and only once an admin is confirmed, so a regular
  // user cannot pull a doctor record through this screen.
  const { data: doctor, isLoading } = useDoctor(isAdmin && isEditing ? id : undefined);

  if (!isAdmin) {
    return (
      <Screen title="Not available" subtitle="Only clinic admins can manage doctors.">
        <Button label="Go back" onPress={() => router.back()} variant="outline" />
      </Screen>
    );
  }

  if (isEditing && isLoading && !doctor) {
    return (
      <Screen title="Edit doctor">
        <LoadingIndicator label="Loading doctor…" />
      </Screen>
    );
  }

  // Reached when the id did not resolve to a doctor, e.g. a stale link.
  if (isEditing && !doctor) {
    return (
      <Screen title="Edit doctor" subtitle="This doctor could not be found.">
        <Button label="Go back" onPress={() => router.back()} variant="outline" />
      </Screen>
    );
  }

  // DoctorForm owns the submitting state and surfaces any error it throws, so
  // this handler only has to perform the write and navigate.
  const handleSubmit = async (input: DoctorInput) => {
    if (!token) return;

    if (doctor) {
      await doctorsApi.update(doctor.id, input, token);
      // Back to the profile the admin came from, which refetches on focus.
      router.back();
    } else {
      await doctorsApi.create(input, token);
      router.replace('/doctors');
    }
  };

  return (
    <Screen
      title={doctor ? 'Edit doctor' : 'Add doctor'}
      subtitle={
        doctor
          ? 'Update the details pet owners see when booking.'
          : 'Fill in the details pet owners see when booking.'
      }
    >
      <DoctorForm
        // Remounts the form when switching between doctors, so state from a
        // previously edited doctor cannot bleed into the next one.
        key={doctor?.id ?? 'new'}
        doctor={doctor ?? undefined}
        submitLabel={doctor ? 'Save changes' : 'Add doctor'}
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
  footer: {
    marginTop: 4,
  },
});
