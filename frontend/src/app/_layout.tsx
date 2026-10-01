import { DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { fontAssets } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

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

/**
 * Root layout: loads the Plus Jakarta Sans files, holds the splash screen until
 * they are ready, and provides the PawPoint theme to every screen.
 */
export default function RootLayout() {
  const [fontsLoaded, fontError] = Font.useFonts(fontAssets);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // Render nothing until the fonts are in, so no screen flashes in the system
  // font. fontError is tolerated so the app still starts if a file fails to
  // load - a missing font should not make the app unusable.
  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider value={pawPointTheme}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.light.background },
        }}
      />
    </ThemeProvider>
  );
}