import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  archiveProduct,
  closeMonth,
  createProduct,
  createRestock,
  dashboardMetrics,
  ensureWeekItems,
  ensureWeeks,
  finalizeWeek,
  getClosingDetails,
  getOrCreateCurrentMonth,
  getSettings,
  listCategories,
  listClosings,
  listProducts,
  listRestocks,
  listWeeklyItems,
  listWeeks,
  reopenWeek,
  saveCountedStock,
  updateProduct,
  upsertSettings
} from '@/services/inventoryService';

export const queryKeys = {
  month: ['month'] as const,
  categories: ['categories'] as const,
  products: ['products'] as const,
  weeks: (monthId: string) => ['weeks', monthId] as const,
  weekItems: (weekId: string) => ['week-items', weekId] as const,
  restocks: (monthId?: string) => ['restocks', monthId] as const,
  dashboard: (monthId: string) => ['dashboard', monthId] as const,
  closings: ['closings'] as const,
  closing: (id: string) => ['closing', id] as const,
  settings: ['settings'] as const
};

export function useCurrentMonth() {
  return useQuery({
    queryKey: queryKeys.month,
    queryFn: getOrCreateCurrentMonth
  });
}

export function useCategories() {
  return useQuery({ queryKey: queryKeys.categories, queryFn: listCategories });
}

export function useProducts() {
  return useQuery({ queryKey: queryKeys.products, queryFn: () => listProducts(false) });
}

export function useWeeks(monthId?: string) {
  return useQuery({
    enabled: Boolean(monthId),
    queryKey: monthId ? queryKeys.weeks(monthId) : ['weeks-empty'],
    queryFn: async () => {
      if (!monthId) return [];
      await ensureWeeks(monthId);
      return listWeeks(monthId);
    }
  });
}

export function useWeekItems(weekId?: string) {
  return useQuery({
    enabled: Boolean(weekId),
    queryKey: weekId ? queryKeys.weekItems(weekId) : ['week-items-empty'],
    queryFn: async () => {
      if (!weekId) return [];
      await ensureWeekItems(weekId);
      return listWeeklyItems(weekId);
    }
  });
}

export function useRestocks(monthId?: string) {
  return useQuery({
    queryKey: queryKeys.restocks(monthId),
    queryFn: () => listRestocks(monthId)
  });
}

export function useDashboard(monthId?: string) {
  return useQuery({
    enabled: Boolean(monthId),
    queryKey: monthId ? queryKeys.dashboard(monthId) : ['dashboard-empty'],
    queryFn: () => dashboardMetrics(monthId as string)
  });
}

export function useClosings() {
  return useQuery({ queryKey: queryKeys.closings, queryFn: listClosings });
}

export function useClosingDetails(closingId?: string) {
  return useQuery({
    enabled: Boolean(closingId),
    queryKey: closingId ? queryKeys.closing(closingId) : ['closing-empty'],
    queryFn: () => getClosingDetails(closingId as string)
  });
}

export function useSettings() {
  return useQuery({ queryKey: queryKeys.settings, queryFn: getSettings });
}

export function useInventoryMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.products }),
      queryClient.invalidateQueries({ queryKey: queryKeys.restocks() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.month }),
      queryClient.invalidateQueries({ queryKey: queryKeys.closings }),
      queryClient.invalidateQueries({ queryKey: queryKeys.settings })
    ]);
  };

  return {
    createProduct: useMutation({
      mutationFn: createProduct,
      onSuccess: invalidateAll
    }),
    updateProduct: useMutation({
      mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof updateProduct>[1] }) => updateProduct(id, patch),
      onSuccess: invalidateAll
    }),
    archiveProduct: useMutation({
      mutationFn: archiveProduct,
      onSuccess: invalidateAll
    }),
    createRestock: useMutation({
      mutationFn: createRestock,
      onSuccess: invalidateAll
    }),
    saveCountedStock: useMutation({
      mutationFn: ({ itemId, countedStock }: { itemId: string; countedStock: number }) => saveCountedStock(itemId, countedStock),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['week-items'] })
    }),
    finalizeWeek: useMutation({
      mutationFn: finalizeWeek,
      onSuccess: invalidateAll
    }),
    reopenWeek: useMutation({
      mutationFn: reopenWeek,
      onSuccess: invalidateAll
    }),
    closeMonth: useMutation({
      mutationFn: closeMonth,
      onSuccess: invalidateAll
    }),
    upsertSettings: useMutation({
      mutationFn: upsertSettings,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.settings })
    })
  };
}
