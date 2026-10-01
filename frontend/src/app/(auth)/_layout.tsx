import { Stack } from 'expo-router';

/**
 * Auth route group. The parentheses keep it out of the URL, so these screens
 * live at /login and /register.
 *
 * The root layout mounts this group only when signed out, so nothing here needs
 * to check the session itself.
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F8FAFC' },
      }}
    />
  );
}