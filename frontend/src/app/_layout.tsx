import { DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { fontAssets } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/context/AuthContext';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Already hidden, or unavailable on this platform - safe to continue.
});

/**
 * PawPoint's light palette expressed as an expo-router Theme, so that
 * `useTheme()` inside screens returns our tokens instead of the Expo defaults.
 * The app is light-only by design (DESIGN.md targets a bright clinical canvas).
 */
const pawPointTheme: Theme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.primary,
    background: Colors.light.background,
    card: Colors.light.surface,
    text: Colors.light.text,
    border: Colors.light.border,
    notification: Colors.light.primary,
  },
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

/**
 * Reads the session, so it has to sit inside AuthProvider.
 *
 * Holds the splash until both the fonts and the token check are done, then
 * mounts one route group or the other via `Stack.Protected`.
 */
function RootNavigator() {
  const [fontsLoaded, fontError] = Font.useFonts(fontAssets);
  const { status } = useAuth();

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // Render nothing until the fonts are in, so no screen flashes in the system
  // font. fontError is tolerated so the app still starts if a file fails to
  // load - a missing font should not make the app unusable.
  //
  // Waiting for the session too avoids flashing the login screen on every launch
  // just to redirect away from it a moment later.
  if ((!fontsLoaded && !fontError) || status === 'restoring') return null;

  return (
    <ThemeProvider value={pawPointTheme}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.light.background },
        }}
      >
        {/*
          Only the group matching the session is mounted, so a signed-out user
          deep-linking to /home is sent to /login and a signed-in user cannot
          reach the auth screens.
        */}
        <Stack.Protected guard={status === 'signed-in'}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="book/[doctorId]" />
          <Stack.Screen name="doctor/[id]" />
          <Stack.Screen name="doctor-form" />
        </Stack.Protected>

        <Stack.Protected guard={status === 'signed-out'}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}