export interface Profile {
  id: string;
  tabacaria_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface Product {
  id: string;
  user_id: string;
  category_id: string;
  name: string;
  normalized_name: string;
  cost_price: number;
  sale_price: number;
  current_stock: number;
  minimum_stock: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Restock {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  stock_before: number;
  stock_after: number;
  restocked_at: string;
  inventory_month_id: string;
  inventory_week_id: string;
  created_at: string;
  product?: Product;
}

export interface InventoryMonth {
  id: string;
  user_id: string;
  year: number;
  month: number;
  status: 'open' | 'closed';
  has_week_5: boolean;
  closed_at: string | null;
  created_at: string;
}

export interface InventoryWeek {
  id: string;
  user_id: string;
  inventory_month_id: string;
  week_number: number;
  start_date: string;
  end_date: string;
  is_finalized: boolean;
  finalized_at: string | null;
  reopened_at: string | null;
  created_at: string;
}

export interface WeeklyInventoryItem {
  id: string;
  user_id: string;
  inventory_week_id: string;
  product_id: string;
  start_stock: number;
  restock_qty: number;
  expected_stock: number;
  counted_stock: number | null;
  sold_qty: number;
  revenue: number;
  cost_amount: number;
  gross_profit: number;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface AppSettings {
  id: string;
  user_id: string;
  tabacaria_name: string;
  logo_url: string | null;
  commission_percent: number;
  currency: string;
  date_format: string;
  sidebar_collapsed: boolean;
  created_at: string;
  updated_at: string;
}
