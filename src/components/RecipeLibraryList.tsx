import React from 'react';
import { FlatList, TouchableOpacity, Image, View, Text, StyleSheet } from 'react-native';
import { RecipeImages } from '../assets/recipeImages';
import { Recipe, Ingredient } from '../types/recipe';

interface Props {
  data: Recipe[];
  onPress: (item: Recipe) => void;
  isItemInStock: (ing: Ingredient) => boolean;
  theme: any;
}

export const RecipeLibraryList = ({ data, onPress, isItemInStock, theme }: Props) => (
  <FlatList 
    data={data} 
    numColumns={2} 
    columnWrapperStyle={styles.columnWrapper} 
    renderItem={({item}) => {
      const missing = item.ingredients.filter(ing => !isItemInStock(ing)).length;
      const imgSource = item.is_imported ? RecipeImages[item.image_key!] : (item.image_url ? {uri: item.image_url} : null);
      
      return (
        <TouchableOpacity style={[styles.card, {backgroundColor: theme.cardBg}]} onPress={() => onPress(item)}>
          {imgSource ? <Image source={imgSource} style={styles.img} /> : <View style={styles.placeholder} />}
          <View style={styles.info}>
            <Text style={[styles.title, {color: theme.textColor}]} numberOfLines={1}>{item.title}</Text>
            <View style={styles.badgeRow}>
              <Text style={{fontSize: 9, color: missing === 0 ? '#2E7D32' : '#EF6C00', fontWeight: '800'}}>
                {missing === 0 ? 'READY' : `MISSING ${missing}`}
              </Text>
              {item.is_imported && <Text style={styles.presetBadge}>PRESET</Text>}
            </View>
          </View>
        </TouchableOpacity>
      );
    }} 
  />
);

const styles = StyleSheet.create({
  columnWrapper: { justifyContent: 'space-between' },
  card: { width: '48%', borderRadius: 18, marginBottom: 15, overflow: 'hidden' },
  img: { width: '100%', height: 110 },
  placeholder: { width: '100%', height: 110, backgroundColor: '#ddd' },
  info: { padding: 12 },
  title: { fontWeight: '800', fontSize: 13, marginBottom: 4 },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  presetBadge: { fontSize: 8, color: '#FF9500', fontWeight: '700' }
});