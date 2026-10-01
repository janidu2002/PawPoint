/**
 * Calendar-date helpers for the booking flow.
 *
 * Dates are plain "YYYY-MM-DD" strings rather than `Date` objects so what the
 * user types is exactly what goes on the wire, with no timezone conversion in
 * between. The server does its own calendar arithmetic in UTC and has the final
 * say; these helpers only need to catch obvious mistakes before a round trip.
 */

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parses a strict "YYYY-MM-DD", rejecting rolled-over dates like 2026-02-30. */
export const parseDate = (date: string): Date | null => {
  const match = DATE_PATTERN.exec(date.trim());
  if (!match) return null;

  const [, year, month, day] = match.map(Number);
  const parsed = new Date(year, month - 1, day);

  const roundTrips =
    parsed.getFullYear() === year &&
    parsed.getMonth() + 1 === month &&
    parsed.getDate() === day;

  return roundTrips ? parsed : null;
};

export const isValidDate = (date: string): boolean => parseDate(date) !== null;

/**
 * Whether a date has already gone by.
 *
 * Compared against today's calendar date at midnight, so a date is "past" only
 * once the whole day is behind us - booking later today is still allowed.
 */
export const isPastDate = (date: string): boolean => {
  const parsed = parseDate(date);
  if (!parsed) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return parsed.getTime() < today.getTime();
};

/** Today as "YYYY-MM-DD", for seeding the date field. */
export const todayIso = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

/** "Thu 9 Oct", so the picked date is readable without a calendar widget. */
export const formatDateLabel = (date: string): string => {
  const parsed = parseDate(date);
  if (!parsed) return date;

  return parsed.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};
