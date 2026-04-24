import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteApplication,
  listApplications,
  updateApplication,
} from "../api/applications";
import type { Application, UpdateApplicationRequest } from "../types";

const KEY = ["applications"] as const;

export function useApplications() {
  return useQuery({
    queryKey: KEY,
    queryFn: listApplications,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useUpdateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: number; body: UpdateApplicationRequest }) =>
      updateApplication(vars.id, vars.body),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: KEY });
      const prev = qc.getQueryData<Application[]>(KEY);
      if (prev) {
        qc.setQueryData<Application[]>(
          KEY,
          prev.map((a) =>
            a.id === vars.id ? { ...a, ...vars.body } : a,
          ),
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteApplication(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
