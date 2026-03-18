/**
 * Navigation param list for type-safe routes.
 * @format
 */

import { Session } from '@supabase/supabase-js';

export type RootStackParamList = {
  Login: undefined
  Home: { userSession: Session };
  Inventory: { scannedItems?: string[] } | undefined;
  Recipes: undefined;
  AlbumScan: undefined;
  PresetRecipes: undefined; // Add this line
};