/**
 * Shopping List Screen – Grouped by Category with Blended Themed Backgrounds
 * @format
 */

import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  ActivityIndicator, Alert, useColorScheme, ScrollView, ImageBackground 
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

type Category = 'Meat' | 'Vegetable' | 'Seasoning and herbs' | 'Other';
const CATEGORIES: Category[] = ['Meat', 'Vegetable', 'Seasoning and herbs', 'Other'];

export function ShoppingListScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isDarkMode = useColorScheme() === 'dark';

  const theme = {
    background: isDarkMode ? '#1a1a2e' : '#f5f5f7',
    textColor: isDarkMode ? '#e8e8e8' : '#1a1a2e',
    subtext: isDarkMode ? '#a0a0a0' : '#666',
  };

  const getCategoryStyles = (cat: Category) => {
    switch (cat) {
      case 'Meat': return { bg: '#FFF9F9', border: '#FFE5E5', pattern: require('../assets/pattern/meat_tile.png') };
      case 'Vegetable': return { bg: '#F2FFF6', border: '#D7F9E1', pattern: require('../assets/pattern/veg_tile.png') };
      case 'Seasoning and herbs': return { bg: '#F0FFFF', border: '#D1FAFA', pattern: require('../assets/pattern/herbs_tile.png') };
      default: return { bg: '#F9FAFB', border: '#F0F2F5', pattern: require('../assets/pattern/dairy_tile.png') };
    }
  };

  const fetchList = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('shopping_list')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) Alert.alert("Error", error.message);
    else setItems(data || []);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { fetchList(); }, []));

  const confirmRemoveItem = (id: string, itemName: string) => {
    Alert.alert(
      "Remove Item",
      `Are you sure you want to remove ${itemName} from your shopping list?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive", 
          onPress: async () => {
            const { error } = await supabase.from('shopping_list').delete().eq('id', id);
            if (error) Alert.alert("Error", "Could not remove item.");
            else fetchList();
          } 
        }
      ]
    );
  };

  const renderCategory = (cat: Category) => {
    // Treat null/undefined category as 'Other' to ensure it renders somewhere
    const catItems = items.filter(i => (i.category || 'Other') === cat);
    if (catItems.length === 0) return null;
    
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

        <Text style={styles.sectionHeader}>{cat}</Text>
        <View style={styles.listContainer}>
          {catItems.map(item => (
            <View key={item.id} style={styles.itemRow}>
              <TouchableOpacity onPress={() => confirmRemoveItem(item.id, item.en)} style={styles.checkCircle} />
              <View style={styles.itemInfo}>
                <Text style={[styles.itemText, { color: theme.textColor }]}>{item.en}</Text>
                {item.zh && <Text style={styles.zhText}> ({item.zh})</Text>}
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textColor }]}>Shopping List</Text>
          <Text style={{ color: theme.subtext, fontWeight: '600' }}>{items.length} Items</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" style={{ marginTop: 50 }} color="#007AFF" />
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {items.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.subtext }]}>Your shopping list is empty.</Text>
              </View>
            ) : (
              CATEGORIES.map(renderCategory)
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 20 },
  title: { fontSize: 28, fontWeight: '900' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, fontWeight: '600' },
  sectionWrapper: {
    marginVertical: 8,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden' 
  },
  sectionHeader: { 
    fontSize: 12, 
    fontWeight: '900', 
    marginBottom: 12, 
    textTransform: 'uppercase', 
    opacity: 0.5, 
    letterSpacing: 1.2,
    color: '#333'
  },
  listContainer: { width: '100%' },
  itemRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 10, 
    paddingHorizontal: 5,
    backgroundColor: 'transparent'
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#C7C7CC', // Apple Reminders style gray border
    marginRight: 15,
    backgroundColor: 'transparent'
  },
  itemInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, flexWrap: 'wrap' },
  itemText: { fontSize: 16, fontWeight: '700' },
  zhText: { fontSize: 15, color: '#666', fontWeight: '600' }
});