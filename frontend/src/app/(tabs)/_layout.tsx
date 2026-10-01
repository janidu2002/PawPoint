import { Tabs } from 'expo-router';

import { TabIcon } from '@/components/tab-icon';
import { fontFamily } from '@/constants/fonts';
import { Colors, Typography } from '@/constants/theme';

/**
 * Tab group for signed-in users. The parentheses keep it out of the URL, so
 * these screens live at /home, /appointments and /profile.
 *
 * The Doctors tab is intentionally absent: the doctor API does not exist until
 * Phase 4, and an unregistered screen cannot be reached by any route - not just
 * hidden from the tab bar. Phase 4 adds `(tabs)/doctors.tsx` here.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.light.primaryHover,
        tabBarInactiveTintColor: Colors.light.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.light.surface,
          borderTopColor: Colors.light.border,
        },
        tabBarLabelStyle: {
          fontFamily: fontFamily.medium,
          fontSize: Typography.labelSm.fontSize,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appointments',
          tabBarIcon: ({ color }) => <TabIcon name="appointments" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabIcon name="profile" color={color} />,
        }}
      />
    </Tabs>
  );
}