/**
 * Preset Recipes Screen – Browse & Detail View (Import from Detail only)
 * @format
 */

// ---------------------- Imports ----------------------
import type {StackScreenProps} from '@react-navigation/stack';
import React, {useState, useMemo} from 'react';
import { 
  StyleSheet, Text, TouchableOpacity, View, TextInput, 
  ScrollView, ActivityIndicator, Alert, Image, FlatList, 
  ImageBackground, useColorScheme 
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
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

  // ---------------------- Theme ----------------------
  const isDarkMode = useColorScheme() === 'dark';
  const background = isDarkMode ? '#1a1a2e' : '#f5f5f7';
  const textColor = isDarkMode ? '#e8e8e8' : '#1a1a2e';
  const cardBg = isDarkMode ? '#16213e' : '#ffffff';
  const subtext = isDarkMode ? '#a0a0a0' : '#666';

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
      }
    } catch (e: any) {
      Alert.alert("Import Failed", e.message);
    } finally {
      setIsImporting(false);
    }
  };

  // ---------------------- Sub-Components ----------------------
  
  const renderDetailView = (recipe: Recipe) => (
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
                <Text style={[styles.itemText, { color: textColor }]}>{ing.en} {ing.zh ? `(${ing.zh})` : ''}</Text>
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
        style={[styles.importBtn, isImporting && { opacity: 0.7 }]} 
        onPress={() => handleImport(recipe)}
        disabled={isImporting}
      >
        {isImporting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.importBtnText}>Add to My Cookbook</Text>
        )}
      </TouchableOpacity>
      <View style={{ height: 50 }} />
    </ScrollView>
  );

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
              renderItem={({item}) => (
                <TouchableOpacity 
                  style={[styles.recipeCard, {backgroundColor: cardBg}]}
                  onPress={() => setSelectedRecipe(item)}
                >
                  <Image source={RecipeImages[item.image_key] || RecipeImages.placeholder} style={styles.cardImg} />
                  <View style={styles.cardContent}>
                    <Text style={[styles.recipeTitle, {color: textColor}]} numberOfLines={2}>{item.title}</Text>
                    <Text style={{color: '#007AFF', fontSize: 12, fontWeight: '700'}}>View →</Text>
                  </View>
                </TouchableOpacity>
              )}
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
  recipeTitle: { fontSize: 16, fontWeight: '700', flex: 1, marginRight: 10 },
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
  itemRow: { paddingVertical: 4 },
  itemText: { fontSize: 15, fontWeight: '600' },
  stepRow: { padding: 18, borderRadius: 18, marginBottom: 10 },
  importBtn: { backgroundColor: '#34C759', padding: 20, borderRadius: 20, alignItems: 'center' },
  importBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 }
});