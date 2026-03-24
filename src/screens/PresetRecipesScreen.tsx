/**
 * Preset Recipes Screen – Browse & Detail View with Smart Navigation
 * @format
 */

// ---------------------- Imports ----------------------
import type {StackScreenProps} from '@react-navigation/stack';
import React, {useState, useMemo, useCallback} from 'react';
import { 
  StyleSheet, Text, TouchableOpacity, View, TextInput, 
  ScrollView, ActivityIndicator, Alert, Image, FlatList, 
  ImageBackground, useColorScheme 
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import type { RootStackParamList } from '../navigation/types';
import type { Ingredient, Category } from './InventoryScreen';

// Data and Image Mapping
import starterRecipes from '../assets/data/starter_recipes.json';
import { RecipeImages } from '../assets/recipeImages';

// ---------------------- Types ----------------------
type Props = StackScreenProps<RootStackParamList, 'PresetRecipes'>;
type Recipe = { 
  id: string; 
  title: string; 
  zh_title?: string;
  image_key: string; 
  ingredients: Ingredient[]; 
  steps: string[] 
};

const CATEGORIES: Category[] = ['Meat', 'Vegetable', 'Seasoning and herbs', 'Other'];

export function PresetRecipesScreen({ navigation }: Props) {
  // ---------------------- State ----------------------
  const [searchQuery, setSearchQuery] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [existingPointers, setExistingPointers] = useState<string[]>([]); // Track IDs in user library
  const [inventory, setInventory] = useState<Ingredient[]>([]); // Track user inventory

  // ---------------------- Theme ----------------------
  const isDarkMode = useColorScheme() === 'dark';
  const background = isDarkMode ? '#1a1a2e' : '#f5f5f7';
  const textColor = isDarkMode ? '#e8e8e8' : '#1a1a2e';
  const cardBg = isDarkMode ? '#16213e' : '#ffffff';
  const subtext = isDarkMode ? '#a0a0a0' : '#666';

  // ---------------------- Sync Logic ----------------------
  const fetchData = async () => {
    // Fetch IDs that are already in the user's collection
    const { data: impData } = await supabase.from('imported_recipes').select('recipe_id');
    if (impData) {
      setExistingPointers(impData.map(item => item.recipe_id));
    }

    // Fetch inventory for Missing/In-Stock comparison
    const { data: invData } = await supabase.from('ingredients').select('*');
    if (invData) {
      setInventory(invData);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const isItemInStock = (ing: Ingredient) => {
    return inventory.some(p => {
      const rEn = ing.en.toLowerCase().trim();
      const pEn = p.en.toLowerCase().trim();
      return (rEn === pEn || rEn + 's' === pEn || pEn + 's' === rEn);
    });
  };

  const getCategoryStyles = (cat: Category) => {
    switch (cat) {
      case 'Meat': return { bg: '#FFF9F9', border: '#FFE5E5', pattern: require('../assets/pattern/meat_tile.png') };
      case 'Vegetable': return { bg: '#F2FFF6', border: '#D7F9E1', pattern: require('../assets/pattern/veg_tile.png') };
      case 'Seasoning and herbs': return { bg: '#F0FFFF', border: '#D1FAFA', pattern: require('../assets/pattern/herbs_tile.png') };
      default: return { bg: '#F9FAFB', border: '#F0F2F5', pattern: require('../assets/pattern/dairy_tile.png') };
    }
  };

  // ---------------------- Logic ----------------------
  const filteredRecipes = useMemo(() => {
    return (starterRecipes as Recipe[]).filter(r => 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.zh_title && r.zh_title.includes(searchQuery)) ||
      r.ingredients.some(i => i.en.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery]);

  const handleImport = async (recipe: Recipe) => {
    setIsImporting(true);
    try {
      const { error } = await supabase
        .from('imported_recipes')
        .insert([{ recipe_id: recipe.id }]);

      if (error) {
        if (error.code === '23505') {
          Alert.alert("Already Added", `"${recipe.title}" is already in your cookbook.`);
        } else throw error;
      } else {
        Alert.alert("Success", `"${recipe.title}" added to your cookbook.`);
        fetchData(); 
      }
    } catch (e: any) {
      Alert.alert("Import Failed", e.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleAddToList = (ing: Ingredient) => {
    Alert.alert(
      "Add to Shopping List",
      `Do you want to add "${ing.en}" to your shopping list?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Add", 
          onPress: async () => {
            const { error } = await supabase.from('shopping_list').insert([{
              en: ing.en,
              zh: ing.zh,
              quantity: 1,
              category: ing.category || 'Other'
            }]);

            if (error) {
              Alert.alert("Error", "Could not add to shopping list.");
            } else {
              Alert.alert("Added", `"${ing.en}" added to your list!`);
            }
          } 
        }
      ]
    );
  };

  // Smart Navigation Logic
  const handleMainButtonClick = (recipe: Recipe, isImported: boolean) => {
    if (isImported) {
      // Direct jump to the main cookbook screen with the hydrated ID
      navigation.navigate('Recipes', { 
        autoOpenId: `import-${recipe.id}` 
      });
    } else {
      handleImport(recipe);
    }
  };

  // ---------------------- Sub-Components ----------------------
  
  const renderDetailView = (recipe: Recipe) => {
    const isAlreadyImported = existingPointers.includes(recipe.id);

    return (
      <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => setSelectedRecipe(null)} style={styles.backButton}>
          <Text style={styles.backText}>← Back to List</Text>
        </TouchableOpacity>

        <View style={[styles.detailHeader, { backgroundColor: cardBg }]}>
          <Image 
            source={RecipeImages[recipe.image_key] || RecipeImages.placeholder} 
            style={styles.detailImg} 
          />
          <View style={styles.detailTitleBox}>
            <Text style={[styles.detailTitle, { color: textColor }]}>{recipe.title}</Text>
            {recipe.zh_title && <Text style={{color: subtext, fontSize: 16}}>{recipe.zh_title}</Text>}
            <Text style={styles.detailBadge}>PRESET RECIPE (READ ONLY)</Text>
          </View>
        </View>

        <Text style={styles.sectionHeading}>Ingredients</Text>
        {CATEGORIES.map(cat => {
          const items = recipe.ingredients.filter(i => i.category === cat);
          if (items.length === 0) return null;
          const { bg, border, pattern } = getCategoryStyles(cat);
          return (
            <View key={cat} style={[styles.sectionWrapper, { backgroundColor: bg, borderColor: border }]}>
              {pattern && <ImageBackground source={pattern} resizeMode="repeat" style={StyleSheet.absoluteFill} imageStyle={{ opacity: 0.05 }} />}
              <Text style={styles.catLabel}>{cat}</Text>
              {items.map((ing, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={[styles.itemText, { color: textColor, flex: 1 }]}>{ing.en} {ing.zh ? `(${ing.zh})` : ''}</Text>
                  
                  {/* Badge on left, Cart Icon on right */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={isItemInStock(ing) ? styles.stockBadge : styles.missingBadge}>
                      <Text style={isItemInStock(ing) ? styles.stockBadgeText : styles.missingBadgeText}>
                        {isItemInStock(ing) ? 'In Stock' : 'Missing'}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={{ padding: 8, backgroundColor: '#007AFF', borderRadius: 8 }} 
                      onPress={() => handleAddToList(ing)}
                    >
                      <Image 
                        source={require('../assets/Icons/cart.png')} 
                        style={{ width: 18, height: 18, tintColor: '#FFFFFF' }} 
                      />
                    </TouchableOpacity>
                  </View>

                </View>
              ))}
            </View>
          );
        })}

        <Text style={styles.sectionHeading}>Steps</Text>
        {recipe.steps.map((step, index) => (
          <View key={index} style={[styles.stepRow, { backgroundColor: cardBg }]}>
            <Text style={{ color: textColor, lineHeight: 22 }}>
              <Text style={{ fontWeight: '800', color: '#007AFF' }}>{index + 1}. </Text>{step}
            </Text>
          </View>
        ))}

        <TouchableOpacity 
          style={[
            styles.importBtn, 
            isAlreadyImported && { backgroundColor: '#2196F3' } // Blue for navigation
          ]} 
          onPress={() => handleMainButtonClick(recipe, isAlreadyImported)}
          disabled={isImporting}
        >
          {isImporting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.importBtnText}>
              {isAlreadyImported ? '→ View in My Cookbook' : 'Add to My Cookbook'}
            </Text>
          )}
        </TouchableOpacity>
        <View style={{ height: 50 }} />
      </ScrollView>
    );
  };

  // ---------------------- Main UI ----------------------
  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, {backgroundColor: background}]}>
        {selectedRecipe ? (
          renderDetailView(selectedRecipe)
        ) : (
          <>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backLink}>← Back</Text></TouchableOpacity>
              <Text style={[styles.title, {color: textColor}]}>Starter Recipes</Text>
            </View>

            <TextInput 
              style={[styles.searchBar, {backgroundColor: cardBg, color: textColor}]}
              placeholder="Search 300+ recipes..."
              placeholderTextColor={subtext}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <FlatList 
              data={filteredRecipes}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({item}) => {
                const isImported = existingPointers.includes(item.id);
                return (
                  <TouchableOpacity 
                    style={[styles.recipeCard, {backgroundColor: cardBg}]}
                    onPress={() => setSelectedRecipe(item)}
                  >
                    <Image source={RecipeImages[item.image_key] || RecipeImages.placeholder} style={styles.cardImg} />
                    <View style={styles.cardContent}>
                      <View style={{flex: 1}}>
                        <Text style={[styles.recipeTitle, {color: textColor}]} numberOfLines={2}>{item.title}</Text>
                        {isImported && <Text style={styles.importedBadge}>IN LIBRARY</Text>}
                      </View>
                      <Text style={{color: '#007AFF', fontSize: 12, fontWeight: '700'}}>View →</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// ---------------------- Styles ----------------------
const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginVertical: 15 },
  backLink: { color: '#007AFF', fontSize: 16, fontWeight: '600', marginRight: 15 },
  title: { fontSize: 24, fontWeight: '900' },
  searchBar: { padding: 15, borderRadius: 12, marginBottom: 20, fontSize: 16 },
  recipeCard: { borderRadius: 18, marginBottom: 15, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', padding: 12 },
  cardImg: { width: 60, height: 60, borderRadius: 12 },
  cardContent: { flex: 1, marginLeft: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recipeTitle: { fontSize: 16, fontWeight: '700', marginRight: 10 },
  importedBadge: { fontSize: 9, color: '#34C759', fontWeight: '900', marginTop: 4 },
  detailScroll: { flex: 1 },
  backButton: { marginVertical: 15 },
  backText: { color: '#007AFF', fontWeight: '700' },
  detailHeader: { borderRadius: 24, overflow: 'hidden', marginBottom: 20 },
  detailImg: { width: '100%', height: 220 },
  detailTitleBox: { padding: 20 },
  detailTitle: { fontSize: 24, fontWeight: '900', marginBottom: 5 },
  detailBadge: { fontSize: 10, color: '#FF9500', fontWeight: '800', letterSpacing: 0.5 },
  sectionHeading: { fontSize: 13, fontWeight: '900', color: '#666', textTransform: 'uppercase', marginVertical: 15, letterSpacing: 1 },
  sectionWrapper: { padding: 16, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)', marginBottom: 10, overflow: 'hidden' },
  catLabel: { fontSize: 10, fontWeight: '900', marginBottom: 10, textTransform: 'uppercase', opacity: 0.5 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, justifyContent: 'space-between' },
  itemText: { fontSize: 15, fontWeight: '600' },
  stepRow: { padding: 18, borderRadius: 18, marginBottom: 10 },
  importBtn: { backgroundColor: '#34C759', padding: 20, borderRadius: 20, alignItems: 'center' },
  importBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  stockBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#34C759', minWidth: 75, alignItems: 'center' },
  stockBadgeText: { color: '#1B5E20', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  missingBadge: { backgroundColor: '#FFEBEE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#FF3B30', minWidth: 75, alignItems: 'center' },
  missingBadgeText: { color: '#B71C1C', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }
});