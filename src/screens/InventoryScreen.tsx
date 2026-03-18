/**
 * Inventory Screen – Clean UI with Tiled Pattern Backgrounds & Duplicate Logic
 * @format
 */

// ---------------------- Imports ----------------------
import type {StackScreenProps} from '@react-navigation/stack';
import React, {useState, useCallback} from 'react';
import { 
  StyleSheet, Text, TouchableOpacity, useColorScheme, View, TextInput, 
  ScrollView, Modal, Alert, ActivityIndicator , Image,
  ImageBackground 
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import type {RootStackParamList} from '../navigation/types';

// ---------------------- Types & Constants ----------------------
type Props = StackScreenProps<RootStackParamList, 'Inventory'>;
export type Category = 'Meat' | 'Vegetable' | 'Seasoning and herbs' | 'Other';
export type Ingredient = { id: string; en: string; zh?: string; category: Category };

const CATEGORIES: Category[] = ['Meat', 'Vegetable', 'Seasoning and herbs', 'Other'];

export function InventoryScreen({ navigation }: Props) {
  // ---------------------- State Management ----------------------
  const [inventory, setInventory] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Ingredient | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // ---------------------- Theme & Styling ----------------------
  const isDarkMode = useColorScheme() === 'dark';
  const background = isDarkMode ? '#1a1a2e' : '#f5f5f7';
  const cardBg = isDarkMode ? '#16213e' : '#ffffff';
  const textColor = isDarkMode ? '#e8e8e8' : '#1a1a2e';
  const subtext = isDarkMode ? '#a0a0a0' : '#666';

  /**
   * Returns specific background, border, and pattern for each category.
   */
  const getCategoryStyles = (cat: Category) => {
    switch (cat) {
      case 'Meat': 
        return { 
          bg: '#FFF9F9', 
          border: '#FFE5E5', 
          pattern: require('../assets/pattern/meat_tile.png') 
        };
      case 'Vegetable': 
        return { 
          bg: '#F2FFF6', 
          border: '#D7F9E1', 
          pattern: require('../assets/pattern/veg_tile.png') 
        };
      case 'Seasoning and herbs': 
        return { 
          bg: '#F0FFFF', 
          border: '#D1FAFA', 
          pattern: require('../assets/pattern/herbs_tile.png') 
        };
      default: 
        return { 
          bg: '#F9FAFB', 
          border: '#F0F2F5', 
          pattern: require('../assets/pattern/dairy_tile.png') 
        };
    }
  };

  // ---------------------- Data Fetching ----------------------
  const fetchInventory = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('ingredients').select('*').order('created_at', { ascending: false });
    if (error) Alert.alert("Cloud Error", error.message);
    else setInventory(data || []);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { fetchInventory(); }, []));

  // ---------------------- Form Handlers ----------------------
  const applyChanges = async () => {
    if (!selectedItem?.en.trim()) return Alert.alert("Required", "English name is required.");

    // --- Duplicate Check Logic (Applied during manual add) ---
    if (isAddingNew) {
      const normalizedEn = selectedItem.en.toLowerCase().trim();
      const normalizedZh = (selectedItem.zh || '').trim();

      // 1. Exact Match Check (Block)
      const exactMatch = inventory.find(ex => 
        ex.en.toLowerCase().trim() === normalizedEn && 
        (ex.zh || '').trim() === normalizedZh
      );

      if (exactMatch) {
        return Alert.alert("Duplicate Item", "This exact ingredient is already in your inventory.");
      }

      // 2. Similar Match Check (Warn)
      const similarMatch = inventory.find(ex => 
        ex.en.toLowerCase().trim() === normalizedEn || 
        (ex.zh && ex.zh.trim() === normalizedZh)
      );

      if (similarMatch) {
        const confirmed = await new Promise((resolve) => {
          Alert.alert(
            "Similar Item Found",
            `"${selectedItem.en}" looks similar to an item already in stock. Add it anyway?`,
            [
              { text: "Cancel", onPress: () => resolve(false), style: "cancel" },
              { text: "Add Anyway", onPress: () => resolve(true) }
            ]
          );
        });
        if (!confirmed) return;
      }
    }

    const payload = { en: selectedItem.en, zh: selectedItem.zh, category: selectedItem.category };
    const { error } = isAddingNew 
      ? await supabase.from('ingredients').insert([payload])
      : await supabase.from('ingredients').update(payload).eq('id', selectedItem.id);

    if (error) Alert.alert("Cloud Error", error.message);
    else { fetchInventory(); setIsModalVisible(false); }
  };

  // ---------------------- Deletion Handlers ----------------------
  const confirmDelete = () => {
    if (!selectedItem) return;
    Alert.alert("Confirm Deletion", `Permanently remove "${selectedItem.en}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          const { error } = await supabase.from('ingredients').delete().eq('id', selectedItem.id);
          if (error) Alert.alert("Error", error.message);
          else { fetchInventory(); setIsModalVisible(false); }
      }}
    ]);
  };

  // ---------------------- Grid Rendering ----------------------
  const renderCategory = (cat: Category) => {
    const items = inventory.filter(i => i.category === cat);
    if (items.length === 0) return null;
    
    const { bg, border, pattern } = getCategoryStyles(cat);

    return (
      <View key={cat} style={[styles.sectionWrapper, { backgroundColor: bg, borderColor: border }]}>
        {pattern && (
          <ImageBackground 
            source={pattern} 
            resizeMode="repeat" 
            style={StyleSheet.absoluteFill} 
            imageStyle={{ opacity: 0.05 }}
          />
        )}

        <Text style={[styles.sectionHeader, { color: textColor }]}>{cat}</Text>
        <View style={styles.listContainer}>
          {items.map(item => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.fullWidthRow}
              onPress={() => {
                setSelectedItem({...item}); 
                setIsAddingNew(false); 
                setIsModalVisible(true);
              }}
            >
              <View style={styles.itemContent}>
                <Text style={[styles.itemText, { color: textColor }]}>
                  {item.en}
                </Text>
                {item.zh && <Text style={styles.zhText}>({item.zh})</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // ---------------------- Main UI ----------------------
  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>Inventory</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              onPress={() => {setSelectedItem({id:'', en:'', zh:'', category:'Other'}); setIsAddingNew(true); setIsModalVisible(true);}} 
              style={styles.headerLink}
            >
              <Text style={styles.linkText}>+ Manual</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.headerLink} 
              onPress={() => navigation.navigate('AlbumScan' as any)}
            >
              <Image source={require('../assets/Icons/camera.png')} style={styles.miniIcon} />
              <Text style={styles.linkText}>Scan Album</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView>
          {loading ? <ActivityIndicator size="large" /> : CATEGORIES.map(renderCategory)}
        </ScrollView>

        <Modal visible={isModalVisible} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalBox, {backgroundColor: cardBg}]}>
              <Text style={[styles.modalTitle, {color: textColor}]}>{isAddingNew ? 'Add Item' : 'Edit Item'}</Text>
              <TextInput style={[styles.modalInput, {color: textColor}]} value={selectedItem?.en} onChangeText={t => setSelectedItem(p => p?{...p,en:t}:null)} placeholder="Name (EN)" placeholderTextColor={subtext} />
              <TextInput style={[styles.modalInput, {color: textColor}]} value={selectedItem?.zh} onChangeText={t => setSelectedItem(p => p?{...p,zh:t}:null)} placeholder="Name (ZH)" placeholderTextColor={subtext} />
              <View style={styles.modalRow}>{CATEGORIES.map(c => (
                <TouchableOpacity key={c} onPress={() => setSelectedItem(p => p?{...p,category:c}:null)} style={[styles.miniChip, selectedItem?.category === c && styles.activeChip]}><Text style={{fontSize: 10, color: selectedItem?.category === c ? '#fff' : subtext}}>{c}</Text></TouchableOpacity>
              ))}</View>
              <View style={styles.modalFooter}>
                {!isAddingNew && <TouchableOpacity onPress={confirmDelete} style={styles.deleteLink}><Text style={{color: '#FF3B30'}}>Delete Item</Text></TouchableOpacity>}
                <View style={{flexDirection: 'row', flex: 1, justifyContent: 'flex-end'}}>
                  <TouchableOpacity style={styles.footerBtn} onPress={() => setIsModalVisible(false)}><Text style={{color:textColor}}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.footerBtn, {backgroundColor: '#007AFF'}]} onPress={applyChanges}><Text style={{color: '#fff', fontWeight: '700'}}>Apply</Text></TouchableOpacity>
                </View>
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
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: 'transparent' },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  headerButtons: { flexDirection: 'row', alignItems: 'center' },
  headerLink: { flexDirection: 'row', alignItems: 'center', padding: 8, marginLeft: 5 },
  linkText: { color: '#007AFF', fontWeight: '700', fontSize: 15 },
  miniIcon: { width: 18, height: 18, marginRight: 6, resizeMode: 'contain', tintColor: '#007AFF' },
  sectionWrapper: {
    marginVertical: 8,
    marginHorizontal: 12,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    overflow: 'hidden' 
  },
  sectionHeader: { fontSize: 12, fontWeight: '900', marginBottom: 12, textTransform: 'uppercase', opacity: 0.5, letterSpacing: 1.2 },
  listContainer: { width: '100%', gap: 4 },
  fullWidthRow: { width: '100%', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 12, backgroundColor: 'transparent', justifyContent: 'center' },
  itemContent: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  itemText: { fontSize: 15, fontWeight: '700', marginRight: 6 },
  zhText: { fontSize: 14, color: 'rgba(0,0,0,0.5)', fontWeight: '500' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '90%', padding: 25, borderRadius: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 15 },
  modalInput: { borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 10, fontSize: 16, marginBottom: 10 },
  modalRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  miniChip: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginRight: 8, marginBottom: 8 },
  activeChip: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  modalFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 35 },
  deleteLink: { marginRight: 20 },
  footerBtn: { padding: 12, borderRadius: 12, marginLeft: 10, minWidth: 80, alignItems: 'center' }
});