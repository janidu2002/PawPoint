import { Link } from 'expo-router';
import { Image } from 'expo-image';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { font } from '@/constants/fonts';
import { Colors, Spacing, Typography } from '@/constants/theme';

/**
 * Register placeholder. The four fields hold local state so they behave like
 * real inputs, but nothing is submitted yet: validation and the API call arrive
 * with auth in Phase 3, which will also drop these local states.
 */
export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
          />
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
            placeholder="At least 8 characters"
            secureTextEntry
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
          />
          <Input
            label="Confirm password"
            placeholder="Re-enter your password"
            secureTextEntry
            autoComplete="password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        <Button label="Create account" onPress={() => {}} />

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