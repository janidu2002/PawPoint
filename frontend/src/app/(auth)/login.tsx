import { Link, router } from 'expo-router';
import { Image } from 'expo-image';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { font } from '@/constants/fonts';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';
import type { FormErrors, LoginInput } from '@/types/user';

/**
 * Login screen. Submits to the auth context, which persists the returned token
 * and flips the session; the root layout's route guards then move the user on
 * to the tabs.
 */
export default function LoginScreen() {
  const { login, isSubmitting } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FormErrors<LoginInput>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = async () => {
    setFieldErrors({});
    setFormError(null);

    const localErrors: FormErrors<LoginInput> = {};
    if (!email.trim()) localErrors.email = 'Email is required';
    if (!password) localErrors.password = 'Password is required';
    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      return;
    }

    try {
      await login({ email, password });
      router.replace('/home');
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;

      // A 401 has no per-field detail and no field to attach it to, so it
      // renders above the button instead of under an input.
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
      <View style={styles.container}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          contentFit="contain"
          accessibilityLabel="PawPoint logo"
        />

        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Log in to book and manage your pet’s appointments.</Text>

        <View style={styles.form}>
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
            placeholder="Your password"
            secureTextEntry
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
            error={fieldErrors.password}
            returnKeyType="go"
            onSubmitEditing={onSubmit}
          />

          {formError ? (
            <Text style={styles.formError} accessibilityRole="alert">
              {formError}
            </Text>
          ) : null}
        </View>

        <Button label="Log in" onPress={onSubmit} loading={isSubmitting} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>New to PawPoint?</Text>
          <Link href="/register">
            <Text style={styles.footerLink}>Create an account</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
    backgroundColor: Colors.light.background,
  },
  logo: {
    width: 96,
    height: 96,
    alignSelf: 'center',
    marginBottom: Spacing.md,
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
