import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createApplication,
  deleteApplication,
  getCompaniesForStatus,
  getStatusHistory,
  getTransitions,
  listApplications,
  updateApplication,
} from "../api/applications";
import type { Application, CreateApplicationRequest, UpdateApplicationRequest } from "../types";

const KEY = ["applications"] as const;
const TRANSITIONS_KEY = ["transitions"] as const;

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

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateApplicationRequest) => createApplication(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteApplication(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useTransitions() {
  return useQuery({
    queryKey: TRANSITIONS_KEY,
    queryFn: getTransitions,
  });
}

export function useCompaniesForStatus(status: string | null) {
  return useQuery({
    queryKey: ["companies", status],
    queryFn: () => getCompaniesForStatus(status!),
    enabled: status !== null,
  });
}

export function useStatusHistory(applicationId: number | null) {
  return useQuery({
    queryKey: ["history", applicationId],
    queryFn: () => getStatusHistory(applicationId!),
    enabled: applicationId !== null,
  });
}
