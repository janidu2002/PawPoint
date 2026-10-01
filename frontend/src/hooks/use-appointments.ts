import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import { appointmentsApi } from '@/lib/api';
import type { Appointment } from '@/types/appointment';
import { messageFor, type AsyncState } from './use-async-state';

/**
 * The signed-in user's own appointments.
 *
 * Refetches on focus for the same reason the doctor hooks do: cancelling or
 * booking on another screen has to be reflected on return, and a stale list is
 * worse than one extra request. Existing data stays mounted through a refetch so
 * returning to the tab does not flash the empty state.
 */
export function useAppointments(): AsyncState<Appointment[]> {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      const result = await appointmentsApi.list(token);
      setAppointments(result);
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  return { data: appointments, error, isLoading, refetch };
}