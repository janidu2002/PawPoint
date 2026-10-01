import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import { appointmentsApi } from '@/lib/api';
import type { Appointment, AppointmentStatusFilter } from '@/types/appointment';
import { messageFor, type AsyncState } from './use-async-state';

/**
 * The clinic-wide appointment queue, admin only.
 *
 * Separate from `useAppointments` rather than a parameter on it: the two hit
 * different endpoints with different authorisation, and an owner calling the
 * admin one just gets a 403 that would sit in the UI looking like a network
 * fault.
 *
 * The filter is a dependency of the fetch rather than something applied on the
 * client, so the queue never holds rows the admin cannot see and the server stays
 * the single source of truth for what a status filter means.
 */
export function useAdminAppointments(
  status: AppointmentStatusFilter
): AsyncState<Appointment[]> {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      const result = await appointmentsApi.adminList(token, status);
      setAppointments(result);
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setIsLoading(false);
    }
  }, [status, token]);

  // Focus refetch rather than an effect on `status`: both a tab return and a
  // filter change need fresh rows, and one mechanism covering both keeps the two
  // from drifting apart.
  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  return { data: appointments, error, isLoading, refetch };
}