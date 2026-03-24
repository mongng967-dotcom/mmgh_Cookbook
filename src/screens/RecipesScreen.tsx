import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRecipes } from '../hooks/useRecipes';
import { RecipeLibraryList } from '../components/RecipeLibraryList';
import { RecipeFormWrapper } from '../components/RecipeFormWrapper';
import { Recipe } from '../types/recipe';

export function RecipesScreen({ navigation, route }: any) {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = {
    background: isDarkMode ? '#1a1a2e' : '#f5f5f7',
    textColor: isDarkMode ? '#e8e8e8' : '#1a1a2e',
    cardBg: isDarkMode ? '#16213e' : '#ffffff',
  };

  const { savedRecipes, inventory, loading, fetchData, isItemInStock } = useRecipes();
  const [view, setView] = useState<'LIBRARY' | 'FORM'>('LIBRARY');
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  // Auto-open logic from PresetRecipesScreen
  React.useEffect(() => {
    const autoId = route.params?.autoOpenId;
    if (autoId && savedRecipes.length > 0) {
      const target = savedRecipes.find(r => r.id === autoId);
      if (target) { setSelectedRecipe(target); setView('FORM'); navigation.setParams({ autoOpenId: undefined }); }
    }
  }, [route.params?.autoOpenId, savedRecipes]);

  const setSelectedRecipe = (recipe: Recipe | null) => {
    setActiveRecipe(recipe);
    setView(recipe || view === 'LIBRARY' ? 'FORM' : 'LIBRARY');
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, {backgroundColor: theme.background}]}>
        {view === 'LIBRARY' ? (
          <>
            <View style={styles.header}>
              <Text style={[styles.title, {color: theme.textColor}]}>Cookbook</Text>
              <TouchableOpacity style={styles.addBtn} onPress={() => setSelectedRecipe(null)}>
                <Text style={{color: '#fff', fontWeight: '800'}}>+ New</Text>
              </TouchableOpacity>
            </View>
            <RecipeLibraryList 
              data={savedRecipes} 
              onPress={setSelectedRecipe} 
              isItemInStock={isItemInStock} 
              theme={theme} 
            />
          </>
        ) : (
          <RecipeFormWrapper 
            recipe={activeRecipe} 
            inventory={inventory} 
            onBack={() => setView('LIBRARY')} 
            onRefresh={fetchData} 
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  addBtn: { backgroundColor: '#007AFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }
});