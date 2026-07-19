import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { DashboardStats, Result } from '../types';

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then((r) => r.data),
    retry: 1,
  });
}

export function useDiscrepancies() {
  return useQuery<Result[]>({
    queryKey: ['rows'],
    queryFn: () =>
      api
        .get('/discrepancies', {
          params: { limit: 10000 },
        })
        .then((r) => r.data),
  });
}

export function useRunReconciliation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ od, pd }: { od: number; pd: number }) =>
      api.post('/reconciliation/run', {
        orders_dataset_id: od,
        payments_dataset_id: pd,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['dashboard'] });
      await qc.invalidateQueries({ queryKey: ['rows'] });
    },
  });
}

export function useDiscrepancyDetail(id: string | undefined) {
  return useQuery<Result>({
    queryKey: ['detail', id],
    queryFn: () => api.get(`/discrepancy/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useExplainAi() {
  return useMutation({
    mutationFn: (id: number) =>
      api.post('/llm/explain', { result_id: id }).then((r) => r.data),
  });
}
