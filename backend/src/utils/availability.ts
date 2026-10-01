import { SLOT_MINUTES } from "../types/appointment";
import { WEEKDAYS, type Weekday } from "../types/doctor";

/**
 * Slot arithmetic for doctor availability.
 *
 * Every function here is pure - the controller supplies the clock reading and
 * the blocked times, so this can be reasoned about without a database or a
 * fixed "now".
 *
 * All date and time maths is done in UTC and on zero-padded strings. Deriving
 * the weekday from the host's local time would shift availability by a day
 * depending on where the server runs, and "YYYY-MM-DD" compares correctly as a
 * string only while both sides are UTC-derived.
 */

export interface SlotAvailability {
  /** 24-hour "HH:mm". */
  time: string;
  available: boolean;
}

export interface AvailabilityDay {
  date: string;
  weekday: Weekday;
  startTime: string;
  endTime: string;
  slots: SlotAvailability[];
}

export interface AvailabilityQuery {
  /** ISO calendar date, "YYYY-MM-DD". */
  date: string;
  startTime: string;
  endTime: string;
  availableDays: Weekday[];
  /** Appointment times already held by a blocking appointment. */
  blockedTimes: Iterable<string>;
  /** When the requested date is today, slots starting before this "HH:mm" are
   *  omitted rather than listed as unavailable - they can no longer be booked. */
  minStartTime?: string;
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Minutes since midnight, or null when the input is not "HH:mm". */
export const toMinutes = (time: string): number | null => {
  const match = TIME_PATTERN.exec(time);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

/** Inverse of `toMinutes`, for minutes within a single day. */
const toTime = (minutes: number): string => {
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mins = String(minutes % 60).padStart(2, "0");
  return `${hours}:${mins}`;
};

/**
 * Whether the string is a real calendar date.
 *
 * The round-trip comparison is what rejects dates like "2026-02-30": the
 * pattern alone accepts them, and relying on `Date` to reject them is
 * engine-dependent.
 */
export const isValidDate = (date: string): boolean => {
  const match = DATE_PATTERN.exec(date);
  if (!match) return false;

  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return false;

  return (
    parsed.getUTCFullYear() === Number(match[1]) &&
    parsed.getUTCMonth() + 1 === Number(match[2]) &&
    parsed.getUTCDate() === Number(match[3])
  );
};

/**
 * Weekday for an ISO date.
 *
 * `Date.getUTCDay()` is Sunday-first, `WEEKDAYS` is Monday-first, hence the
 * shift.
 */
export const weekdayOf = (date: string): Weekday | null => {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return WEEKDAYS[(parsed.getUTCDay() + 6) % 7];
};

/** ISO date for a moment in time, in UTC. */
export const toIsoDate = (at: Date): string =>
  `${at.getUTCFullYear()}-${String(at.getUTCMonth() + 1).padStart(2, "0")}-${String(at.getUTCDate()).padStart(2, "0")}`;

/** "HH:mm" for a moment in time, in UTC. */
export const toTimeOfDay = (at: Date): string => toTime(at.getUTCHours() * 60 + at.getUTCMinutes());

/**
 * Builds the slot grid for one day.
 *
 * A slot is offered only when it finishes by `endTime`, so a 09:00-17:00 clinic
 * on 15-minute slots ends at 16:45. A zero or negative span yields no slots
 * rather than throwing: the doctor document is already validated to have
 * `endTime` after `startTime`, and an empty grid is the safe answer if that ever
 * stops being true.
 */
export const buildSlots = (
  startTime: string,
  endTime: string,
  blockedTimes: ReadonlySet<string>
): SlotAvailability[] => {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  if (start === null || end === null || end <= start) return [];

  const slots: SlotAvailability[] = [];
  for (let cursor = start; cursor + SLOT_MINUTES <= end; cursor += SLOT_MINUTES) {
    const time = toTime(cursor);
    slots.push({ time, available: !blockedTimes.has(time) });
  }

  return slots;
};

/**
 * Resolves one date into its bookable slots.
 *
 * Returns null only for a date that is not a real calendar date; a working-day
 * miss is a legitimate answer and comes back as an empty slot list, which is
 * what lets a picker render "not working that day" instead of an error.
 */
export const computeAvailability = (query: AvailabilityQuery): AvailabilityDay | null => {
  if (!isValidDate(query.date)) return null;

  const weekday = weekdayOf(query.date);
  if (!weekday) return null;

  const day: AvailabilityDay = {
    date: query.date,
    weekday,
    startTime: query.startTime,
    endTime: query.endTime,
    slots: [],
  };

  if (!query.availableDays.includes(weekday)) return day;

  const blocked = new Set(query.blockedTimes);
  day.slots = buildSlots(query.startTime, query.endTime, blocked).filter(
    (slot) => !query.minStartTime || slot.time >= query.minStartTime
  );

  return day;
};
