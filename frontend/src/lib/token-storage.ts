import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * JWT storage backed by the Keychain (iOS) and EncryptedSharedPreferences
 * (Android). This module exists so the rest of the app never imports
 * `expo-secure-store` directly - swapping the backing store later touches one file.
 */

/**
 * SecureStore only accepts alphanumeric keys, `.` and `-`. It is also native code,
 * so the app needs a development build; it cannot run in Expo Go.
 */
const TOKEN_KEY = 'pawpoint-auth-token';

/**
 * SecureStore has no web implementation, so the browser build falls back to
 * `localStorage`. Weaker, but it keeps `expo export --platform web` working;
 * the native app always uses the keystore.
 */
const isWeb = Platform.OS === 'web';

export const tokenStorage = {
  async get(): Promise<string | null> {
    if (isWeb) {
      try {
        return globalThis.localStorage?.getItem(TOKEN_KEY) ?? null;
      } catch {
        // Private browsing or a blocked storage partition.
        return null;
      }
    }

    return SecureStore.getItemAsync(TOKEN_KEY);
  },

  async set(token: string): Promise<void> {
    if (isWeb) {
      try {
        globalThis.localStorage?.setItem(TOKEN_KEY, token);
      } catch {
        // Losing the token on refresh is survivable; failing sign-in is not.
      }
      return;
    }

    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  async clear(): Promise<void> {
    if (isWeb) {
      try {
        globalThis.localStorage?.removeItem(TOKEN_KEY);
      } catch {
        // Nothing to do - the token is already unreachable.
      }
      return;
    }

    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};

export default tokenStorage;
