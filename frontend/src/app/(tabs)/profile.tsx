import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Input } from '@/components/input';
import { TabScreen } from '@/components/screen';
import { font } from '@/constants/fonts';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { ApiError } from '@/lib/api';
import { isValidPersonName } from '@/lib/validation';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const { user, updateProfile, updatePassword, deleteProfile, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string }>({});
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  const startEditing = () => {
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
    setFieldErrors({});
    setError(null);
    setEditing(true);
  };

  const save = async () => {
    const nextErrors: typeof fieldErrors = {};
    if (!isValidPersonName(name)) nextErrors.name = 'Use letters, spaces, apostrophes, or hyphens only';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) nextErrors.email = 'Enter a valid email address';
    setFieldErrors(nextErrors);
    setError(null);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), email: email.trim().toLowerCase() });
      setEditing(false);
    } catch (value) {
      if (value instanceof ApiError) {
        setFieldErrors(value.errors ?? {});
        setError(value.message);
      } else {
        setError('Could not update your profile. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => Alert.alert(
    'Delete your account?',
    'Your profile and appointment history will be permanently deleted.',
    [
      { text: 'Keep account', style: 'cancel' },
      { text: 'Delete account', style: 'destructive', onPress: async () => {
        setSaving(true);
        try {
          await deleteProfile();
        } catch (value) {
          setError(value instanceof ApiError ? value.message : 'Could not delete your account.');
          setSaving(false);
        }
      } },
    ],
  );

  const savePassword = async () => {
    const nextErrors: Record<string, string> = {};
    if (!currentPassword) nextErrors.currentPassword = 'Enter your current password';
    if (newPassword.length < 8) nextErrors.newPassword = 'Password must be at least 8 characters';
    if (newPassword !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match';
    setPasswordErrors(nextErrors);
    setPasswordMessage(null);
    if (Object.keys(nextErrors).length > 0) return;
    setSaving(true);
    try {
      await updatePassword({ currentPassword, newPassword, confirmPassword });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setPasswordMessage('Password updated successfully.');
    } catch (value) {
      if (value instanceof ApiError) {
        setPasswordErrors(value.errors ?? {});
        setPasswordMessage(value.message);
      } else setPasswordMessage('Could not update your password.');
    } finally { setSaving(false); }
  };

  return (
    <TabScreen title="Profile" subtitle="Your PawPoint account.">
      <Card style={styles.profileCard}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{user?.name.trim().charAt(0).toUpperCase() ?? '?'}</Text></View>
        <Text style={styles.name}>{user?.name ?? 'Signed out'}</Text>
        <Text style={styles.email}>{user?.email ?? 'Not signed in'}</Text>
        <View style={styles.role}><Text style={styles.roleText}>{user?.isAdmin ? 'Clinic administrator' : 'Pet owner'}</Text></View>
      </Card>

      {editing ? (
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Edit details</Text>
          <Input label="Full name" value={name} onChangeText={setName} autoCapitalize="words" autoComplete="name" error={fieldErrors.name} editable={!saving} />
          <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={fieldErrors.email} editable={!saving} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label="Save changes" onPress={() => void save()} loading={saving} />
          <Button label="Discard changes" onPress={() => setEditing(false)} variant="outline" disabled={saving} />
        </Card>
      ) : null}

      {!editing ? <Button label="Edit profile" onPress={startEditing} variant="secondary" /> : null}
      <Card style={styles.formCard}>
        <Text style={styles.sectionTitle}>Reset password</Text>
        <Input label="Current password" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry error={passwordErrors.currentPassword} editable={!saving} />
        <Input label="New password" value={newPassword} onChangeText={setNewPassword} secureTextEntry error={passwordErrors.newPassword} editable={!saving} />
        <Input label="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry error={passwordErrors.confirmPassword} editable={!saving} />
        {passwordMessage ? <Text style={styles.error}>{passwordMessage}</Text> : null}
        <Button label="Update password" onPress={() => void savePassword()} loading={saving} />
      </Card>
      <View style={styles.actions}>
        <Button label="Log out" variant="outline" onPress={() => void logout()} disabled={saving} />
        <Button label="Delete account" variant="destructive" onPress={confirmDelete} loading={saving} />
      </View>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  profileCard: { alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.xl, marginBottom: Spacing.md },
  avatar: { width: 80, height: 80, borderRadius: 9999, backgroundColor: Colors.light.primarySoft, borderWidth: 1, borderColor: Colors.light.primaryBorder, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  avatarText: { ...font('bold'), fontSize: Typography.headlineMd.fontSize, color: Colors.light.primaryHover },
  name: { ...font('semiBold'), fontSize: Typography.titleMd.fontSize, color: Colors.light.text },
  email: { ...font('regular'), fontSize: Typography.bodyMd.fontSize, color: Colors.light.textSecondary },
  role: { marginTop: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: 9999, backgroundColor: Colors.light.primarySoft },
  roleText: { ...font('semiBold'), fontSize: Typography.labelSm.fontSize, color: Colors.light.primaryHover },
  formCard: { gap: Spacing.md, marginBottom: Spacing.md },
  sectionTitle: { ...font('bold'), fontSize: Typography.titleMd.fontSize, color: Colors.light.navy },
  error: { ...font('medium'), fontSize: Typography.bodySm.fontSize, color: Colors.light.error },
  actions: { gap: Spacing.md, marginTop: Spacing.xl },
});
