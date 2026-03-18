/**
 * Album Scan – Cloud Integrated with Modal-only Deletion
 * @format
 */

// ---------------------- Imports ----------------------
import type {StackScreenProps} from '@react-navigation/stack';
import React, {useState} from 'react';
import { 
  Alert, Image, StyleSheet, Text, TouchableOpacity, useColorScheme, 
  View, ActivityIndicator, ScrollView, TextInput, Modal 
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { GEMINI_API_KEY } from '@env';
import { supabase } from '../lib/supabase';
import type {RootStackParamList} from '../navigation/types';
import type { Ingredient, Category } from './InventoryScreen';

// ---------------------- Types & Constants ----------------------
type Props = StackScreenProps<RootStackParamList, 'AlbumScan'>;
const CATEGORIES: Category[] = ['Meat', 'Vegetable', 'Seasoning and herbs', 'Other'];

export function AlbumScanScreen({ navigation }: Props) {
  // ---------------------- State Management ----------------------
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [items, setItems] = useState<Ingredient[]>([]);
  const [selectedItem, setSelectedItem] = useState<Ingredient | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // ---------------------- Theme & Styling ----------------------
  const isDarkMode = useColorScheme() === 'dark';
  const background = isDarkMode ? '#1a1a2e' : '#f5f5f7';
  const cardBg = isDarkMode ? '#16213e' : '#ffffff';
  const textColor = isDarkMode ? '#e8e8e8' : '#1a1a2e';
  const subtext = isDarkMode ? '#a0a0a0' : '#666';

  // ---------------------- Gemini AI Logic ----------------------
  const analyze = async (base64: string, type: string) => {
    setIsAnalyzing(true);
    setItems([]);
    try {
      const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
      const payload = {
        contents: [{
          parts: [
            { text: 'Identify ingredients. Return ONLY raw JSON array: [{"en": "name", "zh": "中文", "category": "Meat"|"Vegetable"|"Seasoning and herbs"|"Other"}]. No markdown.' },
            { inline_data: { mime_type: type, data: cleanBase64 } }
          ]
        }]
      };
      const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      const rawText = result.candidates[0].content.parts[0].text;
      const jsonMatch = rawText.replace(/```json|```/g, '').trim().match(/\[.*\]/s);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setItems(parsed.map((i: any) => ({ id: Math.random().toString(), en: i.en || 'Unknown', zh: i.zh || '', category: i.category || 'Other' })));
      }
    } catch (e: any) { Alert.alert("Analysis Failed", e.message); }
    finally { setIsAnalyzing(false); }
  };

  // ---------------------- Data Handlers ----------------------
  const saveToCloud = async () => {
    // 1. Fetch current inventory to compare
    const { data: existingIngs } = await supabase.from('ingredients').select('en, zh');
    const existing = existingIngs || [];

    const exactDuplicates: string[] = [];
    const similarDuplicates: string[] = [];

    items.forEach(item => {
      const exact = existing.find(ex => 
        ex.en.toLowerCase().trim() === item.en.toLowerCase().trim() && 
        (ex.zh || '').trim() === (item.zh || '').trim()
      );
      if (exact) {
        exactDuplicates.push(`${item.en}${item.zh ? ` (${item.zh})` : ''}`);
      } else {
        const similar = existing.find(ex => 
          ex.en.toLowerCase().trim() === item.en.toLowerCase().trim() || 
          (ex.zh && ex.zh.trim() === (item.zh || '').trim())
        );
        if (similar) {
          similarDuplicates.push(`${item.en}${item.zh ? ` (${item.zh})` : ''}`);
        }
      }
    });

    // 2. Handle Exact Matches (Block Save)
    if (exactDuplicates.length > 0) {
      return Alert.alert(
        "Duplicates in List",
        `The following items are already in your inventory:\n\n• ${exactDuplicates.join('\n• ')}\n\nPlease remove them from the scan list before saving.`
      );
    }

    // 3. Handle Similar Matches (Ask Confirmation)
    if (similarDuplicates.length > 0) {
      const confirmed = await new Promise((resolve) => {
        Alert.alert(
          "Similar Items Detected",
          `Some items look very similar to your inventory:\n\n• ${similarDuplicates.join('\n• ')}\n\nSave them as new items anyway?`,
          [
            { text: "Cancel", onPress: () => resolve(false), style: "cancel" },
            { text: "Save All", onPress: () => resolve(true) }
          ]
        );
      });
      if (!confirmed) return;
    }

    const { error } = await supabase.from('ingredients').insert(items.map(({id, ...rest}) => rest));
    if (error) Alert.alert("Error", error.message);
    else navigation.goBack();
  };

  const confirmDelete = () => {
    Alert.alert("Remove Item", "Remove this from the scan list?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => {
          setItems(items.filter(i => i.id !== selectedItem?.id));
          setIsModalVisible(false);
      }}
    ]);
  };

  // ---------------------- Main UI ----------------------
  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.safeArea, {backgroundColor: background}]}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {color: textColor}]}>Fridge Scan</Text>
          <View style={{width: 60}} />
        </View>

        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
          {!imageUri ? (
            <TouchableOpacity 
              style={styles.scanTrigger} 
              onPress={() => launchImageLibrary({mediaType: 'photo', includeBase64: true}, r => {
                if (r.assets?.[0]) { setImageUri(r.assets[0].uri!); analyze(r.assets[0].base64!, r.assets[0].type!); }
              })}
            >
              <Image source={require('../assets/Icons/camera.png')} style={styles.largeIcon} />
              <Text style={{color: textColor, fontSize: 18, fontWeight: '700', marginTop: 15}}>Select Fridge Photo</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.resultsContainer}>
              <Image source={{uri: imageUri}} style={styles.preview} />
              {isAnalyzing ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color="#007AFF" />
                  <Text style={{color: textColor, marginTop: 10}}>Analyzing fridge content...</Text>
                </View>
              ) : (
                <View style={{padding: 16}}>
                  {CATEGORIES.map(cat => {
                    const catItems = items.filter(i => i.category === cat);
                    if (catItems.length === 0) return null;
                    return (
                      <View key={cat} style={{marginBottom: 20}}>
                        <Text style={styles.catHeader}>{cat}</Text>
                        {catItems.map(item => (
                          <TouchableOpacity key={item.id} style={[styles.itemRow, {backgroundColor: cardBg}]} onPress={() => {setSelectedItem({...item}); setIsModalVisible(true);}}>
                            <Text style={{color: textColor, fontWeight: '700'}}>{item.en} {item.zh ? `(${item.zh})` : ''}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    );
                  })}
                  {items.length > 0 && (
                    <TouchableOpacity style={styles.saveBtn} onPress={saveToCloud}>
                      <Text style={styles.saveBtnText}>Save {items.length} Items to Inventory</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* --- Edit Modal section remains here --- */}
      {/* ---------------------- Edit Modal ---------------------- */}
      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, {backgroundColor: cardBg}]}>
            <Text style={[styles.modalTitle, {color: textColor}]}>Edit Item</Text>
            <TextInput style={[styles.modalInput, {color: textColor}]} value={selectedItem?.en} onChangeText={t => setSelectedItem(p => p?{...p,en:t}:null)} placeholder="Name (EN)" />
            <TextInput style={[styles.modalInput, {color: textColor}]} value={selectedItem?.zh} onChangeText={t => setSelectedItem(p => p?{...p,zh:t}:null)} placeholder="Name (ZH)" />
            <View style={styles.modalRow}>{CATEGORIES.map(c => (
              <TouchableOpacity key={c} onPress={() => setSelectedItem(p => p?{...p,category:c}:null)} style={[styles.miniChip, selectedItem?.category === c && styles.activeChip]}><Text style={{fontSize: 10, color: selectedItem?.category === c ? '#fff' : subtext}}>{c}</Text></TouchableOpacity>
            ))}</View>
            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={confirmDelete}><Text style={{color: '#FF3B30'}}>Delete</Text></TouchableOpacity>
              <View style={{flexDirection:'row', flex:1, justifyContent:'flex-end'}}>
                <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.footerBtn}><Text style={{color:textColor}}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => {setItems(prev => prev.map(i => i.id === selectedItem?.id ? selectedItem! : i)); setIsModalVisible(false);}} style={[styles.footerBtn, {backgroundColor: '#007AFF'}]}><Text style={{color:'#fff', fontWeight:'700'}}>Apply</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaProvider>
  );
}

// ---------------------- Styles ----------------------
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd'
  },
  cancelText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  scanTrigger: { 
    padding: 60, 
    alignItems: 'center', 
    borderStyle: 'dashed', 
    borderWidth: 2, 
    borderRadius: 25, 
    borderColor: '#ccc', 
    marginTop: 40,
    backgroundColor: 'rgba(0,0,0,0.02)' 
  },
  largeIcon: { width: 60, height: 60, resizeMode: 'contain', opacity: 0.3 },
  resultsContainer: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#ddd', marginTop: 20 },
  preview: { width: '100%', height: 250 },
  loadingBox: { padding: 40, alignItems: 'center' },
  catHeader: { fontSize: 11, fontWeight: '900', marginBottom: 10, textTransform: 'uppercase', color: '#888' },
  itemRow: { padding: 15, marginBottom: 8, borderRadius: 12 },
  saveBtn: { backgroundColor: '#34C759', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '90%', padding: 25, borderRadius: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 15 },
  modalInput: { borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 10, marginBottom: 15 },
  modalRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  miniChip: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginRight: 8, marginBottom: 8 },
  activeChip: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  modalFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 30 },
  footerBtn: { padding: 12, borderRadius: 12, marginLeft: 10, minWidth: 80, alignItems: 'center' }
});