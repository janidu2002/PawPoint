import { Redirect } from 'expo-router';

import { LoadingIndicator } from '@/components/loading-indicator';
import { useAuth } from '@/context/AuthContext';

/**
 * Entry dispatcher for `/`.
 *
 * Sends a signed-in user to the tabs and everyone else to `/login`, which is
 * also where a signed-out user lands after logging out.
 *
 * The signed-in Home tab lives at `/home` rather than `/`, precisely so this
 * dispatcher can own the root path without two routes competing for it.
 *
 * This screen sits outside both route guards in the root layout, so it stays
 * reachable no matter the session state.
 */
export default function IndexScreen() {
  const { status } = useAuth();

  if (status === 'restoring') {
    return <LoadingIndicator fullScreen label="Loading your session…" />;
  }

  return <Redirect href={status === 'signed-in' ? '/home' : '/login'} />;
}