/**
 * PawPoint design tokens.
 *
 * Values come from DESIGN.md ("Clinical Warmth & Pet Care SaaS") - the source
 * of truth for colours, type, spacing, radii and elevation.
 */

export const Colors = {
  light: {
    /** Primary teal - primary CTA fill */
    primary: '#14B8A6',
    /** Hover/pressed state for primary teal */
    primaryHover: '#0D9488',
    /** Secondary button background */
    primarySoft: '#F0FDFA',
    /** Secondary button border */
    primaryBorder: '#CCFBF1',

    /** Deep navy - navigation, headers, structure */
    navy: '#123B5D',

    /** Base canvas */
    background: '#F8FAFC',
    /** Card / panel surface */
    surface: '#FFFFFF',
    /** Subtle border for containment */
    border: '#E2E8F0',
    /** Hover border */
    borderHover: '#CBD5E1',

    /** Primary text - deep navy, not harsh black */
    text: '#0F2840',
    /** Metadata, timestamps, field labels */
    textSecondary: '#475569',
    /** Input placeholder */
    placeholder: '#94A3B8',

    /** Hairline dividers */
    divider: '#F1F5F9',
    /** Modal / overlay backdrop */
    backdrop: 'rgba(15, 40, 64, 0.4)',

    /** Focus ring glow around inputs */
    focusGlow: 'rgba(20, 184, 166, 0.15)',
    /** Error glow around inputs */
    errorGlow: 'rgba(239, 68, 68, 0.15)',

    error: '#EF4444',
    /** Error helper text and destructive button hover */
    errorHover: '#DC2626',
    errorText: '#991B1B',
    errorContainer: '#FEF2F2',

    success: '#10B981',
    successText: '#065F46',
    successContainer: '#ECFDF5',

    warning: '#F59E0B',
    warningText: '#92400E',
    warningContainer: '#FEF3C7',

    neutral: '#64748B',
    neutralText: '#475569',
    neutralContainer: '#F1F5F9',

    white: '#FFFFFF',
  },
  dark: {
    primary: '#14B8A6',
    primaryHover: '#0D9488',
    primarySoft: '#0B2B28',
    primaryBorder: '#0D9488',

    navy: '#E9F1FF',

    background: '#021D34',
    surface: '#0B2233',
    border: '#1A324A',
    borderHover: '#3C4947',

    text: '#E9F1FF',
    textSecondary: '#A8BFCB',
    placeholder: '#6C7A77',

    divider: '#1A324A',
    backdrop: 'rgba(2, 29, 52, 0.6)',

    focusGlow: 'rgba(20, 184, 166, 0.25)',
    errorGlow: 'rgba(239, 68, 68, 0.25)',

    error: '#EF4444',
    errorHover: '#DC2626',
    errorText: '#FFB4AB',
    errorContainer: '#3B0A08',

    success: '#10B981',
    successText: '#6EE7B7',
    successContainer: '#022C22',

    warning: '#F59E0B',
    warningText: '#FCD34D',
    warningContainer: '#3B2E06',

    neutral: '#64748B',
    neutralText: '#CBD5E1',
    neutralContainer: '#1A324A',

    white: '#021D34',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** 8pt geometric spacing scale from DESIGN.md. */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/** Page gutter - 24px desktop, 16px mobile per DESIGN.md. */
export const Gutter = Spacing.lg;

/**
 * Shape scale. Inputs and buttons use `md` (12px), cards `lg` (16px), and
 * badges and chips are fully pill-shaped - DESIGN.md calls primary components
 * `rounded-md` to `rounded-lg` for space-efficient data entry.
 */
export const Radius = {
  sm: 6,
  DEFAULT: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

/**
 * Typography. Sizes and weights mirror DESIGN.md; the family itself is
 * loaded at runtime in the root layout via expo-font.
 */
export const Typography = {
  displayLg: { fontSize: 40, fontWeight: '800', lineHeight: 48, letterSpacing: -0.02 * 16 },
  displayLgMobile: { fontSize: 30, fontWeight: '800', lineHeight: 38, letterSpacing: -0.015 * 16 },
  headlineLg: { fontSize: 32, fontWeight: '700', lineHeight: 40, letterSpacing: -0.015 * 16 },
  headlineLgMobile: { fontSize: 24, fontWeight: '700', lineHeight: 32, letterSpacing: -0.01 * 16 },
  headlineMd: { fontSize: 24, fontWeight: '600', lineHeight: 32, letterSpacing: -0.01 * 16 },
  headlineSm: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
  titleMd: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
  titleSm: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  bodyLg: { fontSize: 16, fontWeight: '400', lineHeight: 26 },
  bodyMd: { fontSize: 14, fontWeight: '400', lineHeight: 22 },
  bodySm: { fontSize: 12, fontWeight: '400', lineHeight: 18 },
  labelMd: { fontSize: 13, fontWeight: '600', lineHeight: 18, letterSpacing: 0.01 * 13 },
  labelSm: { fontSize: 11, fontWeight: '700', lineHeight: 16, letterSpacing: 0.04 * 11 },
} as const;

/**
 * Elevation. Ambient navy-tinted shadows paired with crisp low-contrast
 * outlines, per DESIGN.md "Elevation & Depth".
 */
export const Shadows = {
  level1: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#123B5D',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  level2: {
    borderWidth: 1,
    borderColor: Colors.light.borderHover,
    shadowColor: '#123B5D',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  level3: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#123B5D',
    shadowOpacity: 0.1,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 20 },
    elevation: 8,
  },
} as const;

/** Input height and border weight from DESIGN.md "Form Fields & Inputs". */
export const InputHeight = 44;
export const InputBorderWidth = 1.5;

/** Status badge colours, keyed by AppointmentStatus. */
export const statusColors = {
  Pending: { bg: Colors.light.warningContainer, fg: Colors.light.warningText, dot: Colors.light.warning },
  Confirmed: { bg: Colors.light.successContainer, fg: Colors.light.successText, dot: Colors.light.success },
  Completed: { bg: Colors.light.neutralContainer, fg: Colors.light.neutralText, dot: Colors.light.neutral },
  Cancelled: { bg: Colors.light.errorContainer, fg: Colors.light.errorText, dot: Colors.light.error },
} as const;

export const MaxContentWidth = 800;