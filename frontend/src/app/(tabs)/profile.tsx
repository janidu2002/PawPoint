import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { TabScreen } from '@/components/screen';
import { font } from '@/constants/fonts';
import { Colors, Spacing, Typography } from '@/constants/theme';

/**
 * Profile placeholder. Phase 3 fills in the authenticated user and wires
 * logout to the auth context.
 */
export default function ProfileScreen() {
  return (
    <TabScreen title="Profile" subtitle="Your PawPoint account.">
      <Card style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>?</Text>
        </View>
        <Text style={styles.name}>Signed in as…</Text>
        <Text style={styles.email}>Authentication arrives in Phase 3</Text>
      </Card>

      <View style={styles.actions}>
        <Button label="Log out" variant="destructive" onPress={() => {}} />
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