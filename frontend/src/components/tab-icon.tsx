import type { ColorValue } from 'react-native';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';

export type TabIconName = 'home' | 'appointments' | 'profile' | 'doctors';

/**
 * Tab bar icons.
 *
 * `expo-symbols` renders SF Symbols on iOS and Material Symbols on Android and
 * web from one component, so no icon font needs registering and no
 * `@expo/vector-icons` dependency is required.
 */
const SYMBOLS: Record<TabIconName, { ios: SFSymbol; android: AndroidSymbol }> = {
  home: { ios: 'house', android: 'home' },
  appointments: { ios: 'calendar', android: 'calendar_month' },
  profile: { ios: 'person.crop.circle', android: 'person' },
  doctors: { ios: 'stethoscope', android: 'medical_services' },
};

interface TabIconProps {
  name: TabIconName;
  color: ColorValue;
  size?: number;
}

export function TabIcon({ name, color, size = 24 }: TabIconProps) {
  const symbol = SYMBOLS[name];

  return <SymbolView name={symbol} tintColor={color} size={size} />;
}