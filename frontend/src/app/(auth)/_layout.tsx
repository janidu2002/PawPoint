import { Stack } from 'expo-router';

/**
 * Auth route group. The parentheses keep it out of the URL, so these screens
 * live at /login and /register.
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