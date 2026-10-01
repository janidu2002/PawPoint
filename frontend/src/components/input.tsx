import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type ReturnKeyTypeOptions,
} from 'react-native';

import { font, fontFamily } from '@/constants/fonts';
import {
  Colors,
  InputBorderWidth,
  InputHeight,
  Radius,
  Spacing,
  Typography,
} from '@/constants/theme';

export interface InputProps {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  /** Hides characters for password fields. */
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'name' | 'email' | 'password' | 'tel' | 'off';
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: () => void;
  editable?: boolean;
  /** Grows the field for long-form text; see `multilineHeight`. */
  multiline?: boolean;
  /** Visible rows when `multiline`. */
  rows?: number;
  maxLength?: number;
  testID?: string;
}

/**
 * Text input following DESIGN.md "Form Fields & Inputs": 44px height, 1.5px
 * border, 12px radius, teal focus glow, red error glow with helper text.
 */
export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType,
  autoCapitalize = 'none',
  autoComplete = 'off',
  returnKeyType,
  onSubmitEditing,
  editable = true,
  multiline = false,
  rows = 4,
  maxLength,
  testID,
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const canTogglePassword = secureTextEntry && !multiline;

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={canTogglePassword ? styles.passwordRow : undefined}>
        <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.light.placeholder}
        // Links the visible label to the field for screen readers.
        accessibilityLabel={label}
        secureTextEntry={secureTextEntry && !visible}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        autoCorrect={false}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        editable={editable}
        maxLength={maxLength}
        multiline={multiline}
        // Grows downward from the top rather than being vertically centred, which
        // is what multiline means to a user typing a description.
        textAlignVertical={multiline ? 'top' : 'center'}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          canTogglePassword && styles.passwordInput,
          multiline && { height: InputHeight * rows, paddingTop: Spacing.sm, paddingBottom: Spacing.sm },
          focused && styles.focused,
          Boolean(error) && styles.inputError,
          !editable && styles.inputDisabled,
        ]}
        />
        {canTogglePassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            onPress={() => setVisible((current) => !current)}
            style={styles.passwordToggle}
          >
            <Text style={styles.passwordToggleText}>{visible ? 'Hide' : 'Show'}</Text>
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  label: {
    ...font('semiBold'),
    fontSize: Typography.labelMd.fontSize,
    lineHeight: Typography.labelMd.lineHeight,
    color: Colors.light.textSecondary,
  },
  input: {
    height: InputHeight,
    borderRadius: Radius.md,
    borderWidth: InputBorderWidth,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
    paddingHorizontal: Spacing.md,
    fontFamily: fontFamily.regular,
    fontSize: Typography.bodyLg.fontSize,
    lineHeight: Typography.bodyLg.lineHeight,
    color: Colors.light.text,
  },
  focused: {
    borderColor: Colors.light.primary,
    shadowColor: Colors.light.primary,
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  inputError: {
    borderColor: Colors.light.error,
    shadowColor: Colors.light.error,
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  passwordRow: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 72,
  },
  passwordToggle: {
    position: 'absolute',
    right: Spacing.sm,
    top: 0,
    height: InputHeight,
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  passwordToggleText: {
    ...font('semiBold'),
    color: Colors.light.primaryHover,
    fontSize: Typography.labelMd.fontSize,
  },
  error: {
    ...font('medium'),
    fontSize: Typography.bodySm.fontSize,
    lineHeight: Typography.bodySm.lineHeight,
    color: Colors.light.error,
  },
});
