import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { TabScreen } from '@/components/screen';
import { font } from '@/constants/fonts';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

/**
 * Shows the signed-in account and signs out.
 *
 * No navigation here on purpose: clearing the session flips the root layout's
 * route guard, which unmounts the tabs and reveals the auth group.
 */
export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const initial = user?.name?.trim().charAt(0).toUpperCase() ?? '?';

  return (
    <TabScreen title="Profile" subtitle="Your PawPoint account.">
      <Card style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{user?.name ?? 'Signed out'}</Text>
        <Text style={styles.email}>{user?.email ?? 'Authentication arrives in Phase 3'}</Text>
      </Card>

      <View style={styles.actions}>
        <Button label="Log out" variant="destructive" onPress={() => void logout()} />
      </View>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xl,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 9999,
    backgroundColor: Colors.light.primarySoft,
    borderWidth: 1,
    borderColor: Colors.light.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  avatarText: {
    ...font('bold'),
    fontSize: Typography.headlineMd.fontSize,
    color: Colors.light.primaryHover,
  },
  name: {
    ...font('semiBold'),
    fontSize: Typography.titleMd.fontSize,
    lineHeight: Typography.titleMd.lineHeight,
    color: Colors.light.text,
  },
  email: {
    ...font('regular'),
    fontSize: Typography.bodyMd.fontSize,
    lineHeight: Typography.bodyMd.lineHeight,
    color: Colors.light.textSecondary,
  },
  actions: {
    marginTop: Spacing.xl,
  },
});
