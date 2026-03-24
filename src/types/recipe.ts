/** @format */
export type Category = 'Meat' | 'Vegetable' | 'Seasoning and herbs' | 'Other';

export interface Ingredient {
  id: string;
  en: string;
  zh?: string;
  category: Category;
}

export interface Recipe {
  id: string;
  title: string;
  zh_title?: string;
  image_url: string | null;
  image_key?: string; 
  ingredients: Ingredient[];
  steps: string[];
  is_imported?: boolean;
  original_id?: string;
}