import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import { ApiError, doctorsApi } from '@/lib/api';
import type { Doctor } from '@/types/doctor';

interface AsyncState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  /** Re-runs the fetch, for pull-to-refresh and after a write. */
  refetch: () => Promise<void>;
}

/**
 * Doctor reads.
 *
 * Both hooks refetch on focus: a user can edit or delete a doctor on another
 * screen and come back, and a stale list is worse than one extra request. The
 * existing data stays mounted during a refetch so returning to the list does
 * not flash an empty screen.
 */

const messageFor = (error: unknown): string =>
  error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';

export function useDoctors(): AsyncState<Doctor[]> {
  const { token } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      const result = await doctorsApi.list(token);
      setDoctors(result);
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

  return { data: doctors, error, isLoading, refetch };
}

export function useDoctor(id: string | undefined): AsyncState<Doctor> {
  const { token } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!token || !id) return;
    try {
      setError(null);
      const result = await doctorsApi.get(id, token);
      setDoctor(result);
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setIsLoading(false);
    }
  }, [token, id]);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  return { data: doctor, error, isLoading, refetch };
}
