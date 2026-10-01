export const PERSON_NAME_PATTERN = /^[\p{L}][\p{L}\s.'-]*$/u;
export const TEXT_NAME_PATTERN = /^[\p{L}][\p{L}\d\s.,&()/'-]*$/u;
export const PHONE_PATTERN = /^\+?[0-9][0-9\s().-]{6,19}$/;

export const hasLetter = (value: string): boolean => /\p{L}/u.test(value);
export const isValidPersonName = (value: string): boolean => PERSON_NAME_PATTERN.test(value.trim());
export const isValidTextName = (value: string): boolean =>
  TEXT_NAME_PATTERN.test(value.trim()) && hasLetter(value);
export const isValidPhone = (value: string): boolean => {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, '');
  return PHONE_PATTERN.test(trimmed) && digits.length >= 7 && digits.length <= 15;
};
