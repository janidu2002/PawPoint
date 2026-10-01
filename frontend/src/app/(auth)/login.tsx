import { Link } from 'expo-router';
import { Image } from 'expo-image';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { font } from '@/constants/fonts';
import { Colors, Spacing, Typography } from '@/constants/theme';

/**
 * Login placeholder. The fields hold local state so they behave like real
 * inputs, but nothing is submitted yet: validation and the API call arrive
 * with auth in Phase 3, which will also drop these local states.
 */
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
          />
          <Input
            label="Password"
            placeholder="Your password"
            secureTextEntry
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <Button label="Log in" onPress={() => {}} />

        {/* Phase 1 has no auth, so this is the only way to reach the tabs
            during review. Phase 3 replaces it with real session routing. */}
        <Link href="/home" asChild>
          <Text style={styles.link}>Preview the app</Text>
        </Link>

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
  link: {
    ...font('medium'),
    fontSize: Typography.bodySm.fontSize,
    lineHeight: Typography.bodySm.lineHeight,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
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
    color: Colors.light.textSecondary,
  },
  footerLink: {
    ...font('semiBold'),
    fontSize: Typography.bodyMd.fontSize,
    color: Colors.light.primaryHover,
  },
});