import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { DoctorCard } from '@/components/doctor-card';
import { EmptyState } from '@/components/empty-state';
import { LoadingIndicator } from '@/components/loading-indicator';
import { TabScreen } from '@/components/screen';
import { font } from '@/constants/fonts';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useDoctors } from '@/hooks/use-doctors';
import type { Doctor } from '@/types/doctor';

const keyExtractor = (doctor: Doctor) => doctor.id;

/**
 * Browse the clinic's vets.
 *
 * Every signed-in user sees this list; only admins get the "Add doctor"
 * button. That is a convenience, not the enforcement point - the API rejects
 * writes from a regular account regardless of what the UI shows.
 */
export default function DoctorsScreen() {
  const { user } = useAuth();
  const { data: doctors, error, isLoading, refetch } = useDoctors();
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = user?.isAdmin ?? false;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  // Nothing to show while the first load is in flight, otherwise the screen
  // would jump from a spinner to an empty state to the list.
  if (isLoading && !doctors) {
    return (
      <TabScreen title="Doctors" subtitle="Meet the team caring for your pets.">
        <LoadingIndicator label="Loading doctors…" />
      </TabScreen>
    );
  }

  return (
    <TabScreen title="Doctors" subtitle="Meet the team caring for your pets." scroll={false}>
      <FlatList
        data={doctors ?? []}
        keyExtractor={keyExtractor}
        renderItem={({ item }) => <DoctorCard doctor={item} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={Separator}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.light.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
                <Button
                  label="Try again"
                  onPress={refetch}
                  variant="secondary"
                  fullWidth={false}
                />
              </View>
            ) : null}

            {isAdmin ? (
              <Button
                label="Add doctor"
                onPress={() => router.push('/doctor-form')}
                variant="secondary"
              />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          error ? null : (
            <EmptyState
              title={isAdmin ? 'No doctors yet' : 'No doctors listed'}
              message={
                isAdmin
                  ? 'Add your first vet so pet owners can find them.'
                  : 'Check back soon - our team is being added.'
              }
              actionLabel={isAdmin ? 'Add doctor' : undefined}
              onAction={isAdmin ? () => router.push('/doctor-form') : undefined}
            />
          )
        }
      />
    </TabScreen>
  );
}

const Separator = () => <View style={styles.separator} />;

const styles = StyleSheet.create({
  list: {
    // Keeps the last card clear of the floating tab bar; TabScreen's own inset
    // does not apply inside a FlatList's content container.
    paddingBottom: 120,
    flexGrow: 1,
  },
  header: {
    gap: Spacing.md,
    paddingBottom: Spacing.md,
  },
  errorBox: {
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.errorContainer,
  },
  errorText: {
    ...font('medium'),
    fontSize: Typography.bodySm.fontSize,
    lineHeight: Typography.bodySm.lineHeight,
    color: Colors.light.errorText,
  },
  separator: {
    height: Spacing.md,
  },
});
