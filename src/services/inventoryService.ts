import { endOfMonth, format, startOfMonth } from 'date-fns';

import { supabase } from '@/integrations/supabase/client';
import type { AppSettings, Category, InventoryMonth, InventoryWeek, Product, Restock, WeeklyInventoryItem } from '@/types/database';

export async function getOrCreateCurrentMonth(): Promise<InventoryMonth> {
  const today = new Date();
  const year = Number(format(today, 'yyyy'));
  const month = Number(format(today, 'M'));

  const { data: existing, error: existingError } = await supabase
    .from('inventory_months')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .single();

  if (existingError && existingError.code !== 'PGRST116') {
    throw existingError;
  }

  if (existing) {
    return existing as InventoryMonth;
  }

  const { data, error } = await supabase
    .from('inventory_months')
    .insert({
      year,
      month,
      has_week_5: new Date(year, month, 0).getDate() > 28,
      status: 'open'
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as InventoryMonth;
}

export async function ensureWeeks(monthId: string) {
  const { data: month, error: monthError } = await supabase
    .from('inventory_months')
    .select('*')
    .eq('id', monthId)
    .single();

  if (monthError) throw monthError;

  const start = startOfMonth(new Date(month.year, month.month - 1));
  const end = endOfMonth(new Date(month.year, month.month - 1));

  const { data: existing, error: existingError } = await supabase
    .from('inventory_weeks')
    .select('id')
    .eq('inventory_month_id', monthId);

  if (existingError) throw existingError;
  if (existing && existing.length > 0) return;

  const weeks = [] as Array<Record<string, unknown>>;
  const cursor = new Date(start);
  let weekNumber = 1;

  while (cursor <= end) {
    const weekStart = new Date(cursor);
    const weekEnd = new Date(cursor);
    weekEnd.setDate(weekEnd.getDate() + 6);
    if (weekEnd > end) {
      weekEnd.setTime(end.getTime());
    }

    weeks.push({
      inventory_month_id: monthId,
      week_number: weekNumber,
      start_date: format(weekStart, 'yyyy-MM-dd'),
      end_date: format(weekEnd, 'yyyy-MM-dd')
    });

    weekNumber += 1;
    cursor.setDate(cursor.getDate() + 7);
  }

  const { error } = await supabase.from('inventory_weeks').insert(weeks);
  if (error) throw error;
}

export async function listCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) throw error;
  return data as Category[];
}

export async function listProducts(activeOnly = true) {
  let query = supabase
    .from('products')
    .select('*, category:categories(*)')
    .order('name', { ascending: true });

  if (activeOnly) {
    query = query.eq('active', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Product[];
}

export async function createProduct(input: {
  name: string;
  category_id: string;
  cost_price: number;
  sale_price: number;
  initial_stock: number;
  minimum_stock: number;
}) {
  const { data, error } = await supabase
    .from('products')
    .insert({
      name: input.name,
      category_id: input.category_id,
      cost_price: input.cost_price,
      sale_price: input.sale_price,
      current_stock: input.initial_stock,
      minimum_stock: input.minimum_stock
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as Product;
}

export async function updateProduct(id: string, input: Partial<Product>) {
  const { data, error } = await supabase.from('products').update(input).eq('id', id).select('*').single();
  if (error) throw error;
  return data as Product;
}

export async function archiveProduct(id: string) {
  const { data, error } = await supabase.from('products').update({ active: false }).eq('id', id).select('*').single();
  if (error) throw error;
  return data as Product;
}

export async function listWeeks(monthId: string) {
  const { data, error } = await supabase
    .from('inventory_weeks')
    .select('*')
    .eq('inventory_month_id', monthId)
    .order('week_number');
  if (error) throw error;
  return data as InventoryWeek[];
}

export async function listWeeklyItems(weekId: string) {
  const { data, error } = await supabase
    .from('weekly_inventory_items')
    .select('*, product:products(*, category:categories(*))')
    .eq('inventory_week_id', weekId)
    .order('created_at');

  if (error) throw error;
  return data as WeeklyInventoryItem[];
}

export async function ensureWeekItems(weekId: string) {
  const { error } = await supabase.rpc('ensure_weekly_items', { p_week_id: weekId });
  if (error) throw error;
}

export async function saveCountedStock(itemId: string, countedStock: number) {
  const { data, error } = await supabase
    .from('weekly_inventory_items')
    .update({ counted_stock: countedStock })
    .eq('id', itemId)
    .select('*')
    .single();

  if (error) throw error;
  return data as WeeklyInventoryItem;
}

export async function finalizeWeek(weekId: string) {
  const { data, error } = await supabase.rpc('finalize_inventory_week', { p_week_id: weekId });
  if (error) throw error;
  return data;
}

export async function reopenWeek(weekId: string) {
  const { data, error } = await supabase.rpc('reopen_inventory_week', { p_week_id: weekId });
  if (error) throw error;
  return data;
}

export async function createRestock(input: { product_id: string; quantity: number }) {
  const { data, error } = await supabase.rpc('register_restock', {
    p_product_id: input.product_id,
    p_quantity: input.quantity
  });
  if (error) throw error;
  return data;
}

export async function listRestocks(monthId?: string) {
  let query = supabase
    .from('restocks')
    .select('*, product:products(*, category:categories(*))')
    .order('restocked_at', { ascending: false });

  if (monthId) {
    query = query.eq('inventory_month_id', monthId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Restock[];
}

export async function dashboardMetrics(monthId: string) {
  const { data, error } = await supabase.rpc('dashboard_metrics', { p_month_id: monthId });
  if (error) throw error;
  return data;
}

export async function closeMonth(monthId: string) {
  const { data, error } = await supabase.rpc('close_inventory_month', { p_month_id: monthId });
  if (error) throw error;
  return data;
}

export async function listClosings() {
  const { data, error } = await supabase.from('monthly_closings').select('*').order('closed_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getClosingDetails(closingId: string) {
  const [closingResult, itemsResult] = await Promise.all([
    supabase.from('monthly_closings').select('*').eq('id', closingId).single(),
    supabase.from('monthly_closing_items').select('*').eq('monthly_closing_id', closingId).order('product_name')
  ]);

  if (closingResult.error) throw closingResult.error;
  if (itemsResult.error) throw itemsResult.error;

  return {
    closing: closingResult.data,
    items: itemsResult.data
  };
}

export async function getSettings() {
  const { data, error } = await supabase.from('settings').select('*').single();
  if (error) throw error;
  return data as AppSettings;
}

export async function upsertSettings(input: Partial<AppSettings>) {
  const { data, error } = await supabase.from('settings').upsert(input).select('*').single();
  if (error) throw error;
  return data as AppSettings;
}
