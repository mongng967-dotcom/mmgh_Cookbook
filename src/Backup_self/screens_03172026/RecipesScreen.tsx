/**
 * Recipes Screen – AI Review with Inline Editing & Manual Duplicate Logic
 * @format
 */

// ---------------------- Imports ----------------------
import type {StackScreenProps} from '@react-navigation/stack';
import React, {useState, useCallback} from 'react';
import { 
  StyleSheet, Text, TouchableOpacity, View, TextInput, 
  ScrollView, ActivityIndicator, Alert, Image, FlatList, Modal, Keyboard,
  ImageBackground, useColorScheme 
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { decode } from 'base64-arraybuffer'; 
import { GEMINI_API_KEY } from '@env';
import { supabase } from '../lib/supabase';
import type { RootStackParamList } from '../navigation/types';
import type { Ingredient, Category } from './InventoryScreen';

// ---------------------- Types & Constants ----------------------
type Props = StackScreenProps<RootStackParamList, 'Recipes'>;
type Recipe = { id: string; title: string; image_url: string | null; ingredients: Ingredient[]; steps: string[] };

const CATEGORIES: Category[] = ['Meat', 'Vegetable', 'Seasoning and herbs', 'Other'];

export function RecipesScreen(_props: Props) {
  // ---------------------- State Management ----------------------
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [inventory, setInventory] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'LIBRARY' | 'FORM'>('LIBRARY');
  const [activeRecipeId, setActiveRecipeId] = useState<string | null>(null);

  const [fTitle, setFTitle] = useState('');
  const [fImage, setFImage] = useState<string | null>(null); 
  const [fIngredients, setFIngredients] = useState<Ingredient[]>([]);
  const [fSteps, setFSteps] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false); 

  // AI Review State
  const [tempAiIngredients, setTempAiIngredients] = useState<Ingredient[]>([]);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);

  const [selectedIng, setSelectedIng] = useState<Ingredient | null>(null);
  const [isIngModalVisible, setIsIngModalVisible] = useState(false);
  const [isAddingIng, setIsAddingIng] = useState(false);

  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const [editingStepText, setEditingStepText] = useState('');
  const [isStepModalVisible, setIsStepModalVisible] = useState(false);
  const [isAddingStep, setIsAddingStep] = useState(false);

  // ---------------------- Theme & Styling ----------------------
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

  // ---------------------- Data Fetching ----------------------
  const fetchData = async () => {
    setLoading(true);
    const [recipeRes, inventoryRes] = await Promise.all([
      supabase.from('recipes').select('*').order('created_at', { ascending: false }),
      supabase.from('ingredients').select('*')
    ]);
    if (recipeRes.data) setSavedRecipes(recipeRes.data);
    if (inventoryRes.data) setInventory(inventoryRes.data);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  // ---------------------- Gemini AI Extraction ----------------------
  const extractAI = async (base64: string, type: string) => {
    setIsProcessing(true);
    try {
      const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
      const payload = {
        contents: [{
          parts: [
            { text: 'Extract ingredients. Return ONLY raw JSON array: [{"en": "Name", "zh": "Name", "category": "Meat"|"Vegetable"|"Seasoning and herbs"|"Other"}]. No markdown.' },
            { inline_data: { mime_type: type, data: cleanBase64 } }
          ]
        }]
      };
      const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      const rawText = result.candidates[0].content.parts[0].text;
      const jsonMatch = rawText.replace(/```json|```/g, '').trim().match(/\[.*\]/s);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);
        setTempAiIngredients(parsedData.map((i: any) => ({
          id: `ai-${Date.now()}-${Math.random()}`, 
          en: i.en || 'Unknown', 
          zh: i.zh || '', 
          category: i.category || 'Other'
        })));
        setIsReviewModalVisible(true);
      }
    } catch (e: any) { Alert.alert("AI Error", e.message); }
    finally { setIsProcessing(false); }
  };

  // ---------------------- Handlers ----------------------
  const updateTempItem = (id: string, field: keyof Ingredient, value: string) => {
    setTempAiIngredients(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const confirmReviewAndAdd = async () => {
    const exactDuplicates: string[] = [];
    const similarDuplicates: string[] = [];
    const validToAdd: Ingredient[] = [];

    tempAiIngredients.forEach(item => {
      const isExact = fIngredients.find(ex => 
        ex.en.toLowerCase().trim() === item.en.toLowerCase().trim() && 
        (ex.zh || '').trim() === (item.zh || '').trim()
      );
      if (isExact) {
        exactDuplicates.push(`${item.en}${item.zh ? ` (${item.zh})` : ''}`);
      } else {
        const isSimilar = fIngredients.find(ex => 
          ex.en.toLowerCase().trim() === item.en.toLowerCase().trim() || 
          (ex.zh && ex.zh.trim() === (item.zh || '').trim())
        );
        if (isSimilar) similarDuplicates.push(`${item.en}${item.zh ? ` (${item.zh})` : ''}`);
        validToAdd.push(item);
      }
    });

    if (exactDuplicates.length > 0) return Alert.alert("Already in Recipe", `Skipped duplicates:\n• ${exactDuplicates.join('\n• ')}`);

    if (similarDuplicates.length > 0) {
      const confirmed = await new Promise(r => Alert.alert("Similar Items Found", `Add anyway?\n• ${similarDuplicates.join('\n• ')}`, [{text:"Cancel", onPress:()=>r(false)}, {text:"Add All", onPress:()=>r(true)}]));
      if (!confirmed) return;
    }

    setFIngredients([...fIngredients, ...validToAdd]);
    setIsReviewModalVisible(false);
  };

  const confirmDeleteRecipe = () => {
    if (!activeRecipeId) return;
    Alert.alert("Delete Recipe", "Permanently remove this recipe from cloud?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          setIsProcessing(true);
          const { error } = await supabase.from('recipes').delete().eq('id', activeRecipeId);
          setIsProcessing(false);
          if (error) Alert.alert("Error", error.message);
          else { fetchData(); setView('LIBRARY'); }
      }}
    ]);
  };

  const handleSave = async () => {
    if (!fTitle.trim()) return Alert.alert("Required", "Dish name is required.");
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
        const { error } = await supabase.storage.from('recipe-images').upload(fileName, decode(base64), { contentType: 'image/jpeg' });
        if (error) throw error;
        const { data: publicUrl } = supabase.storage.from('recipe-images').getPublicUrl(fileName);
        finalImageUrl = publicUrl.publicUrl;
      } catch (e: any) {
        Alert.alert("Cloud Upload Failed", e.message);
        setIsProcessing(false);
        return;
      }
    }
    const recipeData = { title: fTitle, image_url: finalImageUrl, ingredients: fIngredients.map(({ id, ...rest }) => rest), steps: fSteps };
    const { error } = activeRecipeId ? await supabase.from('recipes').update(recipeData).eq('id', activeRecipeId) : await supabase.from('recipes').insert([recipeData]);
    setIsProcessing(false);
    if (error) Alert.alert("Error", error.message); else { fetchData(); setView('LIBRARY'); }
  };

  const isItemInStock = (ing: Ingredient) => {
    return inventory.some(p => {
      const rEn = ing.en.toLowerCase().trim();
      const pEn = p.en.toLowerCase().trim();
      return (rEn === pEn || rEn + 's' === pEn || pEn + 's' === rEn);
    });
  };

  // ---------------------- Main UI ----------------------
  if (view === 'LIBRARY') {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={[styles.container, {backgroundColor: background}]}>
          <View style={styles.header}>
            <Text style={[styles.title, {color: textColor}]}>Cookbook</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => {setFTitle(''); setFImage(null); setFIngredients([]); setFSteps([]); setActiveRecipeId(null); setView('FORM');}}>
              <Text style={{color: '#fff', fontWeight: '800'}}>+ New</Text>
            </TouchableOpacity>
          </View>
          <FlatList data={savedRecipes} numColumns={2} columnWrapperStyle={{justifyContent: 'space-between'}} renderItem={({item}) => {
            const missing = item.ingredients.filter(ing => !isItemInStock(ing)).length;
            return (
              <TouchableOpacity style={[styles.recipeCard, {backgroundColor: cardBg}]} onPress={() => {setFTitle(item.title); setFImage(item.image_url); setFIngredients(item.ingredients.map(ing => ({...ing, id: `ing-${Math.random()}`}))); setFSteps(item.steps || []); setActiveRecipeId(item.id); setView('FORM');}}>
                {item.image_url ? <Image source={{uri: item.image_url}} style={styles.cardImg} /> : <View style={styles.imgPlaceholder} />}
                <View style={styles.cardInfo}><Text style={[styles.recipeTitle, {color: textColor}]} numberOfLines={1}>{item.title}</Text><Text style={{fontSize: 10, color: missing === 0 ? '#2E7D32' : '#EF6C00', fontWeight: '800'}}>{missing === 0 ? 'READY' : `MISSING ${missing}`}</Text></View>
              </TouchableOpacity>
            );
          }} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, {backgroundColor: background}]}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => setView('LIBRARY')}><Text style={{color: '#007AFF', marginBottom: 15, fontSize: 16, fontWeight: '600'}}>← Library</Text></TouchableOpacity>
          <TextInput style={[styles.titleInput, {color: textColor, backgroundColor: cardBg}]} value={fTitle} onChangeText={setFTitle} placeholder="Recipe Title" placeholderTextColor={subtext} />
          
          <TouchableOpacity style={[styles.uploadBox, {backgroundColor: cardBg}]} onPress={() => launchImageLibrary({mediaType: 'photo'}, (r) => { if (r.assets?.[0]?.uri) setFImage(r.assets[0].uri); })}>
            {fImage ? <Image source={{uri: fImage}} style={styles.previewImage} /> : <Text style={{color: '#888'}}>📷 Add Dish Image</Text>}
          </TouchableOpacity>

          <View style={styles.sectionHeaderView}>
            <Text style={styles.sectionHeading}>Ingredients</Text>
            <View style={{flexDirection: 'row'}}>
              <TouchableOpacity onPress={() => {setSelectedIng({id:`m-${Date.now()}`, en:'', zh:'', category:'Other'}); setIsAddingIng(true); setIsIngModalVisible(true);}}><Text style={{color: '#007AFF', marginRight: 15, fontWeight: '600'}}>+ Manual</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => launchImageLibrary({mediaType: 'photo', includeBase64: true}, r => r.assets?.[0] && extractAI(r.assets[0].base64!, r.assets[0].type!))}><Text style={{color: '#007AFF', fontWeight: '600'}}>AI Extract</Text></TouchableOpacity>
            </View>
          </View>

          {CATEGORIES.map(cat => {
            const items = fIngredients.filter(i => i.category === cat);
            if (items.length === 0) return null;
            const { bg, border, pattern } = getCategoryStyles(cat);
            return (
              <View key={cat} style={[styles.sectionWrapper, { backgroundColor: bg, borderColor: border }]}>
                {pattern && <ImageBackground source={pattern} resizeMode="repeat" style={StyleSheet.absoluteFill} imageStyle={{ opacity: 0.05 }} />}
                <Text style={styles.catLabel}>{cat}</Text>
                <View style={styles.listContainer}>
                  {items.map(ing => (
                    <TouchableOpacity key={ing.id} style={styles.fullWidthRow} onPress={() => {setSelectedIng({...ing}); setIsAddingIng(false); setIsIngModalVisible(true);}}>
                      <View style={styles.itemContent}>
                        <Text style={[styles.itemText, { color: textColor }]}>{ing.en} {ing.zh ? `(${ing.zh})` : ''}</Text>
                        <View style={isItemInStock(ing) ? styles.stockBadge : styles.missingBadge}><Text style={isItemInStock(ing) ? styles.stockBadgeText : styles.missingBadgeText}>{isItemInStock(ing) ? 'In Stock' : 'Missing'}</Text></View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })}

          <View style={styles.sectionHeaderView}>
            <Text style={styles.sectionHeading}>Steps</Text>
            <TouchableOpacity onPress={() => {setEditingStepText(''); setSelectedStepIndex(null); setIsAddingStep(true); setIsStepModalVisible(true);}}><Text style={{color: '#007AFF', fontWeight: '600'}}>+ Step</Text></TouchableOpacity>
          </View>
          {fSteps.map((step, index) => (
            <TouchableOpacity key={`step-${index}`} style={[styles.row, {backgroundColor: cardBg}]} onPress={() => {setSelectedStepIndex(index); setEditingStepText(step); setIsAddingStep(false); setIsStepModalVisible(true);}}>
              <Text style={{color: textColor, lineHeight: 20}}>{index + 1}. {step}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={{color: '#fff', fontWeight: '900'}}>Save to Cloud</Text></TouchableOpacity>
          {activeRecipeId && <TouchableOpacity style={styles.deleteRecipeLink} onPress={confirmDeleteRecipe}><Text style={{color:'#FF3B30', fontWeight:'700'}}>Delete Entire Recipe</Text></TouchableOpacity>}
          <View style={{height: 50}} />
        </ScrollView>

        <Modal transparent visible={isProcessing} animationType="fade">
          <View style={styles.loadingOverlay}><View style={styles.loadingBox}><ActivityIndicator size="large" color="#007AFF" /><Text style={styles.loadingText}>Processing...</Text></View></View>
        </Modal>

        {/* ---------------------- AI Review Modal (Inline Edit) ---------------------- */}
        <Modal visible={isReviewModalVisible} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalBox, {backgroundColor: cardBg, maxHeight: '90%', width: '95%'}]}>
              <Text style={[styles.modalTitle, {color: textColor}]}>Review AI Extraction</Text>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {tempAiIngredients.map(item => (
                  <View key={item.id} style={styles.inlineEditRow}>
                    <View style={{flex: 1, marginRight: 10}}>
                      <TextInput 
                        style={[styles.inlineInput, {color: textColor, fontWeight: '700'}]} 
                        value={item.en} 
                        onChangeText={t => updateTempItem(item.id, 'en', t)} 
                        placeholder="EN Name"
                      />
                      <TextInput 
                        style={[styles.inlineInput, {color: subtext, fontSize: 13}]} 
                        value={item.zh} 
                        onChangeText={t => updateTempItem(item.id, 'zh', t)} 
                        placeholder="ZH Name"
                      />
                      <View style={styles.inlineChips}>
                        {CATEGORIES.map(c => (
                          <TouchableOpacity 
                            key={c} 
                            onPress={() => updateTempItem(item.id, 'category', c)} 
                            style={[styles.miniChip, item.category === c && styles.activeChip, {paddingVertical: 4, paddingHorizontal: 6, marginVertical: 2}]}
                          >
                            <Text style={{fontSize: 9, color: item.category === c ? '#fff' : subtext}}>{c}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                    <TouchableOpacity style={styles.smallRemoveBtn} onPress={() => setTempAiIngredients(prev => prev.filter(i => i.id !== item.id))}>
                      <Text style={styles.smallRemoveText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.modalFooter}>
                <TouchableOpacity onPress={() => setIsReviewModalVisible(false)} style={styles.footerBtn}><Text style={{color: textColor}}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity onPress={confirmReviewAndAdd} style={[styles.footerBtn, {backgroundColor: '#34C759'}]}><Text style={{color: '#fff', fontWeight: '700'}}>Add to Recipe</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ---------------------- Main Ingredient Modal (Duplicate Logic Added) ---------------------- */}
        <Modal visible={isIngModalVisible} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalBox, {backgroundColor: cardBg}]}>
              <Text style={[styles.modalTitle, {color: textColor}]}>{isAddingIng ? 'Add' : 'Edit'} Ingredient</Text>
              <TextInput style={[styles.modalInput, {color: textColor}]} value={selectedIng?.en} onChangeText={t => setSelectedIng(p => p?{...p,en:t}:null)} placeholder="Name (EN)" placeholderTextColor={subtext} />
              <TextInput style={[styles.modalInput, {color: textColor}]} value={selectedIng?.zh} onChangeText={t => setSelectedIng(p => p?{...p,zh:t}:null)} placeholder="Name (ZH)" placeholderTextColor={subtext} />
              <View style={styles.modalRow}>{CATEGORIES.map(c => (
                <TouchableOpacity key={c} onPress={() => setSelectedIng(p => p?{...p,category:c}:null)} style={[styles.miniChip, selectedIng?.category === c && styles.activeChip]}><Text style={{fontSize: 10, color: selectedIng?.category === c ? '#fff' : subtext}}>{c}</Text></TouchableOpacity>
              ))}</View>
              <View style={styles.modalFooter}>
                {!isAddingIng && <TouchableOpacity onPress={() => {Alert.alert("Remove Item", "Remove from recipe?", [{text:"Cancel"},{text:"Delete", style:"destructive", onPress:()=>{setFIngredients(fIngredients.filter(i=>i.id!==selectedIng?.id));setIsIngModalVisible(false);}}])}}><Text style={{color: '#FF3B30', fontWeight: '600'}}>Delete</Text></TouchableOpacity>}
                <View style={{flexDirection:'row', flex:1, justifyContent:'flex-end'}}>
                  <TouchableOpacity onPress={() => setIsIngModalVisible(false)} style={styles.footerBtn}><Text style={{color:textColor}}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity 
                    onPress={async () => { 
                      if (!selectedIng?.en.trim()) return; 
                      
                      if (isAddingIng) {
                        const normalizedEn = selectedIng.en.toLowerCase().trim();
                        const normalizedZh = (selectedIng.zh || '').trim();

                        // 1. Exact Match Check (Block)
                        const exactMatch = fIngredients.find(ex => 
                          ex.en.toLowerCase().trim() === normalizedEn && 
                          (ex.zh || '').trim() === normalizedZh
                        );

                        if (exactMatch) {
                          return Alert.alert("Duplicate Item", "This item is already in your recipe.");
                        }

                        // 2. Similar Match Check (Warn)
                        const similarMatch = fIngredients.find(ex => 
                          ex.en.toLowerCase().trim() === normalizedEn || 
                          (ex.zh && ex.zh.trim() === normalizedZh)
                        );

                        if (similarMatch) {
                          const confirmed = await new Promise(r => Alert.alert("Similar Item", "Add anyway?", [{text:"No", onPress:()=>r(false)}, {text:"Yes", onPress:()=>r(true)}]));
                          if (!confirmed) return;
                        }

                        setFIngredients([...fIngredients, selectedIng]); 
                      } else { 
                        setFIngredients(fIngredients.map(i => i.id === selectedIng.id ? selectedIng : i)); 
                      } 
                      setIsIngModalVisible(false); 
                    }} 
                    style={[styles.footerBtn, {backgroundColor: '#007AFF'}]}
                  >
                    <Text style={{color:'#fff', fontWeight:'700'}}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* ---------------------- Step Modal ---------------------- */}
        <Modal visible={isStepModalVisible} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalBox, {backgroundColor: cardBg}]}>
              <Text style={[styles.modalTitle, {color: textColor}]}>{isAddingStep ? 'Add Step' : 'Edit Step'}</Text>
              <TextInput style={[styles.modalInput, {color: textColor, minHeight: 100}]} value={editingStepText} onChangeText={setEditingStepText} multiline placeholder="Describe step..." placeholderTextColor={subtext} autoFocus />
              <View style={styles.modalFooter}>
                {!isAddingStep && <TouchableOpacity onPress={() => {Alert.alert("Delete Step", "Remove this step?", [{text:"Cancel"},{text:"Delete", style:"destructive", onPress:()=>{setFSteps(fSteps.filter((_,i)=>i!==selectedStepIndex));setIsStepModalVisible(false);}}])}}><Text style={{color: '#FF3B30', fontWeight: '600'}}>Delete</Text></TouchableOpacity>}
                <View style={{flexDirection:'row', flex:1, justifyContent:'flex-end'}}><TouchableOpacity onPress={() => setIsStepModalVisible(false)} style={styles.footerBtn}><Text style={{color:textColor}}>Cancel</Text></TouchableOpacity><TouchableOpacity onPress={() => { if (!editingStepText.trim()) return; if (isAddingStep) setFSteps([...fSteps, editingStepText.trim()]); else { const s = [...fSteps]; s[selectedStepIndex!] = editingStepText.trim(); setFSteps(s); } setIsStepModalVisible(false); Keyboard.dismiss(); }} style={[styles.footerBtn, {backgroundColor: '#007AFF'}]}><Text style={{color:'#fff', fontWeight:'700'}}>Apply</Text></TouchableOpacity></View>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// ---------------------- Styles ----------------------
const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  addBtn: { backgroundColor: '#007AFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  recipeCard: { width: '48%', borderRadius: 18, marginBottom: 15, overflow: 'hidden', elevation: 2 },
  cardImg: { width: '100%', height: 110 },
  imgPlaceholder: { width: '100%', height: 110, backgroundColor: '#ddd' },
  cardInfo: { padding: 12 },
  recipeTitle: { fontWeight: '800', fontSize: 13, marginBottom: 4 },
  titleInput: { padding: 18, borderRadius: 16, fontSize: 20, fontWeight: '800', marginBottom: 15 },
  uploadBox: { height: 160, borderRadius: 18, borderStyle: 'dashed', borderWidth: 2, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  previewImage: { width: '100%', height: '100%', borderRadius: 16 },
  sectionHeaderView: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 15 },
  sectionHeading: { fontSize: 13, fontWeight: '900', color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionWrapper: { marginVertical: 8, padding: 16, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)', overflow: 'hidden' },
  catLabel: { fontSize: 11, fontWeight: '900', marginBottom: 12, textTransform: 'uppercase', opacity: 0.5, letterSpacing: 1.2 },
  listContainer: { width: '100%', gap: 4 },
  fullWidthRow: { width: '100%', paddingVertical: 10, backgroundColor: 'transparent' },
  itemContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemText: { fontSize: 15, fontWeight: '700', flex: 1, marginRight: 10 },
  row: { padding: 18, borderRadius: 16, marginBottom: 10, elevation: 1 },
  saveBtn: { backgroundColor: '#34C759', padding: 18, borderRadius: 18, alignItems: 'center', marginTop: 30 },
  deleteRecipeLink: { marginTop: 20, padding: 15, alignItems:'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '90%', padding: 25, borderRadius: 24, elevation: 10 },
  modalTitle: { fontSize: 22, fontWeight: '900', marginBottom: 20 },
  modalInput: { borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 12, fontSize: 16, marginBottom: 15 },
  modalRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 },
  miniChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', marginRight: 8, marginBottom: 8 },
  activeChip: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  modalFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 30 },
  footerBtn: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 14, marginLeft: 12, minWidth: 90, alignItems: 'center' },
  stockBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#34C759' },
  stockBadgeText: { color: '#1B5E20', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  missingBadge: { backgroundColor: '#FFEBEE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#FF3B30' },
  missingBadgeText: { color: '#B71C1C', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  loadingOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  loadingBox: { backgroundColor: '#fff', padding: 30, borderRadius: 20, alignItems: 'center' },
  loadingText: { marginTop: 15, fontSize: 16, fontWeight: '700', color: '#333' },
  smallRemoveBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#FFF5F5' },
  smallRemoveText: { color: '#FF3B30', fontSize: 11, fontWeight: '700' },
  inlineEditRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  inlineInput: { padding: 4, marginBottom: 2 },
  inlineChips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }
});