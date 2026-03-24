/**
 * Recipe Form Wrapper – Handles AI Extraction, Modals, and Cloud CRUD
 * Updated: Integrated View/Edit Toggle and Smart Deletion Logic
 * @format
 */

import React, { useState } from 'react';
import { 
  Alert, Modal, View, TextInput, TouchableOpacity, Text, 
  ScrollView, Keyboard, StyleSheet, useColorScheme, ActivityIndicator 
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';
import { RecipeDetailView } from './RecipeDetailView';
import { extractIngredientsFromAI } from '../utils/aiHelper';
import { Ingredient, Category, Recipe } from '../types/recipe';

interface Props {
  recipe: Recipe | null;
  inventory: Ingredient[];
  onBack: () => void;
  onRefresh: () => void;
}

const CATEGORIES: Category[] = ['Meat', 'Vegetable', 'Seasoning and herbs', 'Other'];

export function RecipeFormWrapper({ recipe, inventory, onBack, onRefresh }: Props) {
  // ---------------------- Local Form State ----------------------
  const [fTitle, setFTitle] = useState(recipe?.title || '');
  const [fImage, setFImage] = useState<string | null>(recipe?.is_imported ? null : recipe?.image_url || null);
  const [fIngredients, setFIngredients] = useState<Ingredient[]>(
    recipe?.ingredients.map(ing => ({...ing, id: ing.id || `ing-${Math.random()}`})) || []
  );
  const [fSteps, setFSteps] = useState<string[]>(recipe?.steps || []);
  const [isProcessing, setIsProcessing] = useState(false);
  const isReadOnly = !!recipe?.is_imported;

  // Modals & Temp States
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [tempAiIngredients, setTempAiIngredients] = useState<Ingredient[]>([]);
  
  const [selectedIng, setSelectedIng] = useState<Ingredient | null>(null);
  const [isIngModalVisible, setIsIngModalVisible] = useState(false);
  const [isAddingIng, setIsAddingIng] = useState(false);

  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const [editingStepText, setEditingStepText] = useState('');
  const [isStepModalVisible, setIsStepModalVisible] = useState(false);
  const [isAddingStep, setIsAddingStep] = useState(false);

  const isDarkMode = useColorScheme() === 'dark';
  const theme = {
    textColor: isDarkMode ? '#e8e8e8' : '#1a1a2e',
    cardBg: isDarkMode ? '#16213e' : '#ffffff',
    subtext: isDarkMode ? '#a0a0a0' : '#666',
  };

  // ---------------------- Shopping List Logic ----------------------
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

  // ---------------------- AI Extraction Logic ----------------------
  const handleAiExtract = () => {
    launchImageLibrary({ mediaType: 'photo', includeBase64: true }, async (r) => {
      if (!r.assets?.[0]) return;
      setIsProcessing(true);
      try {
        const parsedData = await extractIngredientsFromAI(r.assets[0].base64!, r.assets[0].type!);
        setTempAiIngredients(parsedData.map((i: any) => ({
          id: `ai-${Date.now()}-${Math.random()}`, 
          en: i.en || 'Unknown', 
          zh: i.zh || '', 
          category: i.category || 'Other'
        })));
        setIsReviewModalVisible(true);
      } catch (e: any) {
        Alert.alert("AI Extraction Failed", e.message);
      } finally {
        setIsProcessing(false);
      }
    });
  };

  // ---------------------- Cloud Saving Logic ----------------------
  const handleSave = async () => {
    if (isReadOnly) return;
    if (!fTitle.trim()) return Alert.alert("Required", "Recipe title is required.");
    
    setIsProcessing(true);
    let finalImageUrl = fImage;

    if (fImage && !fImage.startsWith('http')) {
      try {
        const fileName = `recipe-${Date.now()}.jpg`;
        const response = await fetch(fImage);
        const blob = await response.blob();
        const reader = new FileReader();
        const base64Data: string = await new Promise((res, rej) => {
          reader.onload = () => res(reader.result as string);
          reader.onerror = rej;
          reader.readAsDataURL(blob);
        });
        const base64 = base64Data.split(',')[1];
        const { error: uploadError } = await supabase.storage.from('recipe-images').upload(fileName, decode(base64), { contentType: 'image/jpeg' });
        if (uploadError) throw uploadError;
        const { data: publicUrl } = supabase.storage.from('recipe-images').getPublicUrl(fileName);
        finalImageUrl = publicUrl.publicUrl;
      } catch (e: any) {
        Alert.alert("Upload Error", e.message);
        setIsProcessing(false);
        return;
      }
    }

    const payload = { 
      title: fTitle, 
      image_url: finalImageUrl, 
      ingredients: fIngredients.map(({ id, ...rest }) => rest), 
      steps: fSteps 
    };

    const { error } = recipe?.id && !recipe.is_imported
      ? await supabase.from('recipes').update(payload).eq('id', recipe.id)
      : await supabase.from('recipes').insert([payload]);

    setIsProcessing(false);
    if (error) Alert.alert("Save Failed", error.message);
    else { onRefresh(); onBack(); }
  };

  // ---------------------- Deletion Handlers ----------------------
  const handleDeleteRecipe = () => {
    if (!recipe?.id) return;
    
    const title = isReadOnly ? "Remove from Cookbook" : "Delete Recipe";
    const msg = isReadOnly 
      ? "This will remove the link to this starter recipe from your library." 
      : "This will permanently delete this recipe and its image from the cloud.";

    Alert.alert(title, msg, [
      { text: "Cancel", style: "cancel" },
      { 
        text: isReadOnly ? "Remove" : "Delete", 
        style: "destructive", 
        onPress: async () => {
          setIsProcessing(true);
          const table = isReadOnly ? 'imported_recipes' : 'recipes';
          const column = isReadOnly ? 'recipe_id' : 'id';
          const idValue = isReadOnly ? recipe.original_id : recipe.id;

          const { error } = await supabase.from(table).delete().eq(column, idValue);
          
          setIsProcessing(false);
          if (error) {
            Alert.alert("Error", error.message);
          } else {
            onRefresh();
            onBack();
          }
        } 
      }
    ]);
  };

  const handleDeleteIngredient = () => {
    if (!selectedIng) return;
    Alert.alert(
      "Remove Ingredient",
      `Are you sure you want to remove "${selectedIng.en}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive", 
          onPress: () => {
            setFIngredients(prev => prev.filter(i => i.id !== selectedIng.id));
            setIsIngModalVisible(false);
          } 
        }
      ]
    );
  };

  const handleDeleteStep = () => {
    if (selectedStepIndex === null) return;
    Alert.alert(
      "Remove Step",
      `Are you sure you want to remove step ${selectedStepIndex + 1}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive", 
          onPress: () => {
            setFSteps(prev => prev.filter((_, idx) => idx !== selectedStepIndex));
            setIsStepModalVisible(false);
          } 
        }
      ]
    );
  };

  // ---------------------- Helper Logic ----------------------
  const isItemInStock = (ing: Ingredient) => {
    return inventory.some(p => {
      const rEn = ing.en.toLowerCase().trim();
      const pEn = p.en.toLowerCase().trim();
      return (rEn === pEn || rEn + 's' === pEn || pEn + 's' === rEn);
    });
  };

  return (
    <View style={{flex: 1}}>
      <RecipeDetailView 
        recipe={{ 
          title: fTitle, 
          image_url: fImage, 
          image_key: recipe?.image_key, 
          ingredients: fIngredients, 
          steps: fSteps 
        }}
        isReadOnly={isReadOnly}
        onClose={onBack}
        onSave={handleSave}
        setTitle={setFTitle}
        isItemInStock={isItemInStock}
        onImagePick={() => launchImageLibrary({mediaType: 'photo'}, r => r.assets?.[0]?.uri && setFImage(r.assets[0].uri))}
        onAddIng={() => { setSelectedIng({id:`m-${Date.now()}`, en:'', zh:'', category:'Other'}); setIsAddingIng(true); setIsIngModalVisible(true); }}
        onEditIng={(ing) => { setSelectedIng({...ing}); setIsAddingIng(false); setIsIngModalVisible(true); }}
        onAddStep={() => { setEditingStepText(''); setSelectedStepIndex(null); setIsAddingStep(true); setIsStepModalVisible(true); }}
        onEditStep={(idx) => { setSelectedStepIndex(idx); setEditingStepText(fSteps[idx]); setIsAddingStep(false); setIsStepModalVisible(true); }}
        onAiExtract={handleAiExtract}
        onDelete={handleDeleteRecipe}
        onAddToList={handleAddToList}
      />

      <Modal transparent visible={isProcessing} animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        </View>
      </Modal>

      {/* --- Ingredient Modal --- */}
      <Modal visible={isIngModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, {backgroundColor: theme.cardBg}]}>
            <Text style={[styles.modalTitle, {color: theme.textColor}]}>{isAddingIng ? 'Add Ingredient' : 'Edit Ingredient'}</Text>
            <TextInput style={[styles.modalInput, {color: theme.textColor}]} value={selectedIng?.en} onChangeText={t => setSelectedIng(p => p?{...p,en:t}:null)} placeholder="Name (EN)" placeholderTextColor={theme.subtext} />
            <TextInput style={[styles.modalInput, {color: theme.textColor}]} value={selectedIng?.zh} onChangeText={t => setSelectedIng(p => p?{...p,zh:t}:null)} placeholder="Name (ZH)" placeholderTextColor={theme.subtext} />
            <View style={styles.modalRow}>
              {CATEGORIES.map(c => (
                <TouchableOpacity key={c} onPress={() => setSelectedIng(p => p?{...p,category:c}:null)} style={[styles.miniChip, selectedIng?.category === c && styles.activeChip]}>
                  <Text style={{fontSize: 10, color: selectedIng?.category === c ? '#fff' : theme.subtext}}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalFooter}>
              {!isAddingIng && (
                <TouchableOpacity onPress={handleDeleteIngredient} style={styles.deleteLink}>
                  <Text style={{color: '#FF3B30', fontWeight: '600'}}>Delete</Text>
                </TouchableOpacity>
              )}
              <View style={styles.footerRightGroup}>
                <TouchableOpacity onPress={() => setIsIngModalVisible(false)} style={styles.cancelBtn}>
                  <Text style={{color: theme.textColor, fontWeight: '600'}}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.applyBtn, {backgroundColor: '#007AFF'}]}
                  onPress={() => {
                     if (!selectedIng?.en.trim()) return;
                     if (isAddingIng) setFIngredients([...fIngredients, selectedIng]);
                     else setFIngredients(fIngredients.map(i => i.id === selectedIng.id ? selectedIng : i));
                     setIsIngModalVisible(false);
                  }}
                >
                  <Text style={{color:'#fff', fontWeight:'700'}}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- Step Modal --- */}
      <Modal visible={isStepModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, {backgroundColor: theme.cardBg}]}>
            <Text style={[styles.modalTitle, {color: theme.textColor}]}>{isAddingStep ? 'Add Step' : 'Edit Step'}</Text>
            <TextInput style={[styles.modalInput, {color: theme.textColor, minHeight: 100}]} value={editingStepText} onChangeText={setEditingStepText} multiline placeholder="Describe step..." placeholderTextColor={theme.subtext} />
            <View style={styles.modalFooter}>
              {!isAddingStep && (
                <TouchableOpacity onPress={handleDeleteStep} style={styles.deleteLink}>
                  <Text style={{color: '#FF3B30', fontWeight: '600'}}>Delete</Text>
                </TouchableOpacity>
              )}
              <View style={styles.footerRightGroup}>
                <TouchableOpacity onPress={() => setIsStepModalVisible(false)} style={styles.cancelBtn}>
                  <Text style={{color: theme.textColor, fontWeight: '600'}}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => {
                    if (!editingStepText.trim()) return;
                    if (isAddingStep) setFSteps([...fSteps, editingStepText.trim()]);
                    else { const s = [...fSteps]; s[selectedStepIndex!] = editingStepText.trim(); setFSteps(s); }
                    setIsStepModalVisible(false);
                    Keyboard.dismiss();
                  }}
                  style={[styles.applyBtn, {backgroundColor: '#007AFF'}]}
                >
                  <Text style={{color:'#fff', fontWeight:'700'}}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  loadingBox: { backgroundColor: '#fff', padding: 30, borderRadius: 20, alignItems: 'center' },
  loadingText: { marginTop: 15, fontSize: 16, fontWeight: '700', color: '#333' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '90%', padding: 25, borderRadius: 24 },
  modalTitle: { fontSize: 22, fontWeight: '900', marginBottom: 20 },
  modalInput: { borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 12, fontSize: 16, marginBottom: 15 },
  modalRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 },
  miniChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', marginRight: 8, marginBottom: 8 },
  activeChip: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  modalFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 30 },
  footerRightGroup: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' },
  deleteLink: { paddingVertical: 10, paddingRight: 10 },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginRight: 8 },
  applyBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, minWidth: 90, alignItems: 'center' },
});