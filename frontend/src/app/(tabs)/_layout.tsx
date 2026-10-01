import { Tabs } from 'expo-router';

import { TabIcon } from '@/components/tab-icon';
import { useAuth } from '@/context/AuthContext';
import { fontFamily } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

/**
 * Tab group for signed-in users. The parentheses keep it out of the URL, so
 * these screens live at /home, /doctors, /appointments, /queue and /profile.
 *
 * The root layout mounts this group only when a session exists, so these
 * screens assume `user` is populated.
 */
export default function TabsLayout() {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin ?? false;

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
          // 10px matches native iOS tab bar label sizing and keeps
          // "Appointments" from truncating on 375pt screens when 5 tabs render.
          fontSize: 10,
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
        name="doctors"
        options={{
          title: 'Doctors',
          tabBarIcon: ({ color }) => <TabIcon name="doctors" color={color} />,
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
        name="queue"
        options={{
          title: 'Queue',
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color }) => <TabIcon name="queue" color={color} />,
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