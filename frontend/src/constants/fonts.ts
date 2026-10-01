import type { TextStyle } from 'react-native';

/**
 * The five Plus Jakarta Sans files, registered at runtime by the root layout.
 *
 * We ship Regular / Medium / Bold / ExtraBold / Light, but DESIGN.md asks for
 * a SemiBold weight too. SemiBold maps onto the Medium file at weight 600,
 * which is visually close and avoids shipping a sixth font.
 */
export const fontAssets = {
  'PlusJakartaSans-Light': require('../../assets/fonts/PlusJakartaSans-Light.ttf'),
  'PlusJakartaSans-Regular': require('../../assets/fonts/PlusJakartaSans-Regular.ttf'),
  'PlusJakartaSans-Medium': require('../../assets/fonts/PlusJakartaSans-Medium.ttf'),
  'PlusJakartaSans-Bold': require('../../assets/fonts/PlusJakartaSans-Bold.ttf'),
  'PlusJakartaSans-ExtraBold': require('../../assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
} as const;

export const fontFamily = {
  light: 'PlusJakartaSans-Light',
  regular: 'PlusJakartaSans-Regular',
  medium: 'PlusJakartaSans-Medium',
  semiBold: 'PlusJakartaSans-Medium',
  bold: 'PlusJakartaSans-Bold',
  extraBold: 'PlusJakartaSans-ExtraBold',
} as const;

export type FontWeight = keyof typeof fontFamily;

const NUMERIC = {
  light: '300',
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
  extraBold: '800',
} as const satisfies Record<FontWeight, TextStyle['fontWeight']>;

/**
 * React Native needs both the family name and a numeric weight - it will not
 * infer one from the other. This pairs the registered file with its weight.
 */
export const font = (weight: FontWeight = 'regular'): {
  fontFamily: string;
  fontWeight: TextStyle['fontWeight'];
} => ({
  fontFamily: fontFamily[weight],
  fontWeight: NUMERIC[weight],
});