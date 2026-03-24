import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import starterRecipes from '../assets/data/starter_recipes.json';
import { Ingredient, Recipe } from '../types/recipe';

export function useRecipes() {
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [inventory, setInventory] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [recipeRes, importedRes, inventoryRes] = await Promise.all([
        supabase.from('recipes').select('*').order('created_at', { ascending: false }),
        supabase.from('imported_recipes').select('recipe_id'),
        supabase.from('ingredients').select('*')
      ]);

      const inventoryData = inventoryRes.data || [];
      const customRecipes = recipeRes.data || [];
      
      const importedRecipes = (importedRes.data || []).map(ptr => {
        const local = (starterRecipes as any[]).find(r => r.id === ptr.recipe_id);
        return local ? { 
          ...local, 
          id: `import-${local.id}`, 
          original_id: local.id, 
          is_imported: true 
        } : null;
      }).filter(Boolean);

      setInventory(inventoryData);
      setSavedRecipes([...customRecipes, ...importedRecipes as Recipe[]]);
    } catch (e: any) {
      Alert.alert("Sync Error", e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const isItemInStock = (ing: Ingredient) => {
    return inventory.some(p => {
      const rEn = ing.en.toLowerCase().trim();
      const pEn = p.en.toLowerCase().trim();
      return (rEn === pEn || rEn + 's' === pEn || pEn + 's' === rEn);
    });
  };

  return { savedRecipes, inventory, loading, fetchData, isItemInStock };
}