import { Redirect } from 'expo-router';

/**
 * Entry dispatcher for `/`.
 *
 * Auth does not exist yet, so the app always starts at `/register`. Phase 3
 * turns this into a real decision: send a signed-in user to the tabs, everyone
 * else to `/register`.
 *
 * The signed-in Home tab lives at `/home` rather than `/`, precisely so this
 * dispatcher can own the root path without two routes competing for it.
 */
export default function IndexScreen() {
  return <Redirect href="/register" />;
}