import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import { doctorsApi } from '@/lib/api';
import { isPastDate, isValidDate } from '@/lib/date';
import type { Availability } from '@/types/appointment';
import { messageFor, type AsyncState } from './use-async-state';

/**
 * A doctor's bookable slots for one date.
 *
 * Fetched on demand rather than for every date: the date is typed by hand, so
 * there is nothing to ask for until the user has supplied one, and a request per
 * keystroke would be waste. An unparseable or past date never reaches the network
 * - the server answers both with 400, and the form has already flagged them.
 *
 * Refetches on focus like the doctor hooks, because a slot can be taken on
 * another screen while this form is open.
 */
export function useAvailability(
  doctorId: string | undefined,
  date: string | undefined,
): AsyncState<Availability> {
  const { token } = useAuth();

  // The response is stored alongside the date it was fetched for, so a grid left
  // over from a previous date is dropped during render rather than displayed
  // under the newly typed one.
  const [result, setResult] = useState<{
    date: string;
    availability: Availability | null;
    error: string | null;
  } | null>(null);

  const normalisedDate = date?.trim() ?? '';
  const isQueryable =
    Boolean(token && doctorId) &&
    isValidDate(normalisedDate) &&
    !isPastDate(normalisedDate);

  const refetch = useCallback(async () => {
    if (!token || !doctorId || !normalisedDate) return;

    try {
      const availability = await doctorsApi.getAvailability(
        doctorId,
        normalisedDate,
        token,
      );
      setResult({ date: normalisedDate, availability, error: null });
    } catch (err) {
      setResult({ date: normalisedDate, availability: null, error: messageFor(err) });
    }
  }, [token, doctorId, normalisedDate]);

  useFocusEffect(
    useCallback(() => {
      if (isQueryable) void refetch();
    }, [isQueryable, refetch])
  );

  const current = isQueryable && result?.date === normalisedDate ? result : null;

  // No loading flag is stored: while the date is queryable and nothing has come
  // back for it yet, the request is necessarily still in flight.
  const isLoading = isQueryable && current === null;

  return {
    data: current?.availability ?? null,
    error: current?.error ?? null,
    isLoading,
    refetch,
  };
}
