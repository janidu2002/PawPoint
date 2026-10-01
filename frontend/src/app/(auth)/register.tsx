import { Link, router } from 'expo-router';
import { Image } from 'expo-image';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { font } from '@/constants/fonts';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';
import type { FormErrors, RegisterInput } from '@/types/user';
import { isValidPersonName } from '@/lib/validation';

/**
 * Registration screen. Signs the user in on success rather than sending them to
 * the login form, since the backend already returns a token for a new account.
 */
export default function RegisterScreen() {
  const { register, isSubmitting } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FormErrors<RegisterInput>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = async () => {
    setFieldErrors({});
    setFormError(null);

    const localErrors: FormErrors<RegisterInput> = {};
    if (!isValidPersonName(name)) localErrors.name = 'Use letters, spaces, apostrophes, or hyphens only';
    if (password.length < 8) localErrors.password = 'Password must be at least 8 characters';
    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      return;
    }

    // The server never receives confirmPassword, so this is the only check that
    // the two entries match.
    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    try {
      await register({ name, email, password, confirmPassword });
      router.replace('/home');
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;

      if (error.errors) {
        setFieldErrors(error.errors);
      } else {
        setFormError(error.message);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          contentFit="contain"
          accessibilityLabel="PawPoint logo"
        />

        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Register to book appointments for your pet.</Text>

        <View style={styles.form}>
          <Input
            label="Full name"
            placeholder="Jane Doe"
            autoComplete="name"
            autoCapitalize="words"
            value={name}
            onChangeText={setName}
            error={fieldErrors.name}
            returnKeyType="next"
          />
          <Input
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            error={fieldErrors.email}
            returnKeyType="next"
          />
          <Input
            label="Password"
            placeholder="At least 8 characters"
            secureTextEntry
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
            error={fieldErrors.password}
            returnKeyType="next"
          />
          <Input
            label="Confirm password"
            placeholder="Re-enter your password"
            secureTextEntry
            autoComplete="password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={fieldErrors.confirmPassword}
            returnKeyType="go"
            onSubmitEditing={onSubmit}
          />

          {formError ? (
            <Text style={styles.formError} accessibilityRole="alert">
              {formError}
            </Text>
          ) : null}
        </View>

        <Button label="Create account" onPress={onSubmit} loading={isSubmitting} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already registered?</Text>
          <Link href="/login">
            <Text style={styles.footerLink}>Log in</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
    backgroundColor: Colors.light.background,
  },
  logo: {
    width: 88,
    height: 88,
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    ...font('bold'),
    fontSize: Typography.headlineLgMobile.fontSize,
    lineHeight: Typography.headlineLgMobile.lineHeight,
    letterSpacing: Typography.headlineLgMobile.letterSpacing,
    color: Colors.light.navy,
    textAlign: 'center',
  },
  subtitle: {
    ...font('regular'),
    fontSize: Typography.bodyMd.fontSize,
    lineHeight: Typography.bodyMd.lineHeight,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  form: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  formError: {
    ...font('medium'),
    fontSize: Typography.bodySm.fontSize,
    lineHeight: Typography.bodySm.lineHeight,
    color: Colors.light.error,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingTop: Spacing.lg,
  },
  footerText: {
    ...font('regular'),
    fontSize: Typography.bodyMd.fontSize,
    lineHeight: Typography.bodyMd.lineHeight,
    color: Colors.light.textSecondary,
  },
  footerLink: {
    ...font('semiBold'),
    fontSize: Typography.bodyMd.fontSize,
    lineHeight: Typography.bodyMd.lineHeight,
    color: Colors.light.primaryHover,
  },
});
