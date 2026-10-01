import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';

/**
 * Doctor detail route. Reachable from a doctor card once the doctor API
 * exists in Phase 4; registered now so the typed route exists.
 */
export default function DoctorLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.light.background },
      }}
    />
  );
}