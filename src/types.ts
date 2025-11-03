export interface Category {
  id: number;
  name: string;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface Beverage {
  id: number;
  name: string;
  alcohol_content?: number;
  category_id: number;
  category_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BeverageAmount {
  beverage_id: number;
  beverage_name: string;
  amount: number;
  alcohol_content?: number;
}

export interface Post {
  id?: number;
  date: string;
  comment?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PostWithBeverages {
  id: number;
  date: string;
  comment?: string;
  created_at: string;
  updated_at: string;
  beverages: BeverageAmount[];
}

export interface CreatePostRequest {
  date: string;
  comment?: string;
  beverages: BeverageAmountInput[];
}

export interface BeverageAmountInput {
  beverage_id: number;
  amount: number;
}

export interface MonthlyAlcoholIntake {
  total_intake: number;
  average_per_day: number;
  drinking_days: number;
}

