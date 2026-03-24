/**
 * Recipe Detail View – Presentational Component
 * Updated: Added "Save to Cloud" button at bottom when in Edit Mode
 * @format
 */

import React, { useState } from 'react';
import { 
  StyleSheet, Text, TouchableOpacity, View, TextInput, 
  ScrollView, Image, ImageBackground, useColorScheme 
} from 'react-native';
import { RecipeImages } from '../assets/recipeImages';
import { Ingredient, Category } from '../types/recipe';

interface Props {
  recipe: {
    title: string;
    image_url: string | null;
    image_key?: string;
    ingredients: Ingredient[];
    steps: string[];
  };
  isReadOnly: boolean;
  onClose: () => void;
  onSave?: () => void;
  setTitle: (t: string) => void;
  isItemInStock: (ing: Ingredient) => boolean;
  onImagePick?: () => void;
  onAddIng?: () => void;
  onEditIng?: (ing: Ingredient) => void;
  onAddStep?: () => void;
  onEditStep?: (index: number) => void;
  onAiExtract?: () => void;
  onDelete?: () => void;
  onAddToList?: (ing: Ingredient) => void;
}

const CATEGORIES: Category[] = ['Meat', 'Vegetable', 'Seasoning and herbs', 'Other'];

export function RecipeDetailView({
  recipe, isReadOnly, onClose, onSave, setTitle, 
  isItemInStock, onImagePick, onAddIng, onEditIng, 
  onAddStep, onEditStep, onAiExtract, onDelete, onAddToList
}: Props) {
  
  const [isEditing, setIsEditing] = useState(false);
  const isDarkMode = useColorScheme() === 'dark';
  const theme = {
    textColor: isDarkMode ? '#e8e8e8' : '#1a1a2e',
    cardBg: isDarkMode ? '#16213e' : '#ffffff',
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

  const handleTopRightAction = () => {
    if (isReadOnly) {
      if (onDelete) onDelete();
    } else {
      if (isEditing && onSave) onSave();
      setIsEditing(!isEditing);
    }
  };

  return (
    <ScrollView keyboardShouldPersistTaps="handled" style={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* Top Navigation Bar */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={onClose} style={styles.backTouch}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={handleTopRightAction} 
          style={styles.editToggleBtn}
        >
          <Text style={styles.editToggleText}>
            {isReadOnly ? 'Remove' : (isEditing ? 'Done' : 'Edit')}
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput 
        editable={isEditing && !isReadOnly}
        style={[
          styles.titleInput, 
          {color: theme.textColor, backgroundColor: theme.cardBg}, 
          (!isEditing || isReadOnly) && styles.readOnlyInput
        ]} 
        value={recipe.title} 
        onChangeText={setTitle} 
        placeholder="Recipe Title" 
        placeholderTextColor={theme.subtext}
      />
      
      <TouchableOpacity 
        disabled={!isEditing || isReadOnly} 
        style={[styles.uploadBox, {backgroundColor: theme.cardBg}]} 
        onPress={onImagePick}
      >
        {recipe.image_key ? (
          <Image source={RecipeImages[recipe.image_key] || RecipeImages.placeholder} style={styles.previewImage} />
        ) : (
          recipe.image_url ? 
            <Image source={{uri: recipe.image_url}} style={styles.previewImage} /> : 
            <View style={styles.placeholderBox}><Text style={{color: '#888'}}>📷 Add Dish Image</Text></View>
        )}
      </TouchableOpacity>

      <View style={styles.sectionHeaderView}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.sectionHeading}>Ingredients</Text>
          {isEditing && !isReadOnly && (
            <TouchableOpacity onPress={onAiExtract}>
              <Text style={styles.aiBtn}>AI Extract</Text>
            </TouchableOpacity>
          )}
        </View>
        {isEditing && !isReadOnly && (
          <TouchableOpacity onPress={onAddIng} style={styles.addIngTouch}>
            <Text style={styles.actionText}>+ Add Ingredient</Text>
          </TouchableOpacity>
        )}
      </View>

      {CATEGORIES.map(cat => {
        const items = (recipe.ingredients || []).filter(i => i.category === cat);
        if (items.length === 0) return null;
        const { bg, border, pattern } = getCategoryStyles(cat);
        return (
          <View key={cat} style={[styles.sectionWrapper, { backgroundColor: bg, borderColor: border }]}>
            {pattern && <ImageBackground source={pattern} resizeMode="repeat" style={StyleSheet.absoluteFill} imageStyle={{ opacity: 0.05 }} />}
            <Text style={styles.catLabel}>{cat}</Text>
            <View style={styles.listContainer}>
              {items.map((ing, idx) => (
                <TouchableOpacity 
                  disabled={!isEditing || isReadOnly} 
                  key={ing.id || `ing-${idx}`} 
                  style={styles.fullWidthRow} 
                  onPress={() => onEditIng?.(ing)}
                >
                  <View style={styles.itemContent}>
                    <Text style={[styles.itemText, { color: theme.textColor }]}>
                      {ing.en} {ing.zh ? `(${ing.zh})` : ''}
                    </Text>
                    
                    {/* Badge on left, Cart Icon on right */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={isItemInStock(ing) ? styles.stockBadge : styles.missingBadge}>
                        <Text style={isItemInStock(ing) ? styles.stockBadgeText : styles.missingBadgeText}>
                          {isItemInStock(ing) ? 'In Stock' : 'Missing'}
                        </Text>
                      </View>
                      <TouchableOpacity 
                        style={{ padding: 8, backgroundColor: '#007AFF', borderRadius: 8 }} 
                        onPress={() => onAddToList?.(ing)}
                      >
                        <Image 
                          source={require('../assets/Icons/cart.png')} 
                          style={{ width: 18, height: 18, tintColor: '#FFFFFF', resizeMode: 'contain' }} 
                        />
                      </TouchableOpacity>
                    </View>

                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      })}

      <View style={styles.sectionHeaderView}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.sectionHeading}>Steps</Text>
          {isEditing && !isReadOnly && (
            <TouchableOpacity onPress={onAddStep}>
              <Text style={styles.actionText}>+ Step</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {recipe.steps.map((step, index) => (
        <TouchableOpacity 
          disabled={!isEditing || isReadOnly} 
          key={`step-${index}`} 
          style={[styles.row, {backgroundColor: theme.cardBg}]} 
          onPress={() => onEditStep?.(index)}
        >
          <Text style={{color: theme.textColor, lineHeight: 22}}>
            <Text style={{fontWeight:'800', color:'#007AFF'}}>{index + 1}. </Text>{step}
          </Text>
        </TouchableOpacity>
      ))}

      {/* --- BOTTOM ACTION AREA --- */}
      {isEditing && !isReadOnly && (
        <>
          <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
            <Text style={styles.saveBtnText}>Save to Cloud</Text>
          </TouchableOpacity>
          
          {onDelete && (
            <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
              <Text style={styles.deleteBtnText}>Delete Entire Recipe</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Logic for imported recipes removal */}
      {isEditing && isReadOnly && onDelete && (
         <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
            <Text style={styles.deleteBtnText}>Remove from Cookbook</Text>
         </TouchableOpacity>
      )}
      
      <View style={{height: 60}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  backTouch: { paddingVertical: 10, width: 80 },
  backBtn: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
  editToggleBtn: { paddingVertical: 10, paddingHorizontal: 15 },
  editToggleText: { color: '#007AFF', fontSize: 16, fontWeight: '700' },
  titleInput: { padding: 18, borderRadius: 16, fontSize: 20, fontWeight: '800', marginBottom: 15 },
  readOnlyInput: { backgroundColor: 'transparent', elevation: 0, paddingLeft: 0 },
  uploadBox: { height: 180, borderRadius: 20, borderStyle: 'dashed', borderWidth: 2, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden' },
  placeholderBox: { alignItems: 'center' },
  previewImage: { width: '100%', height: '100%', borderRadius: 16 },
  sectionHeaderView: { marginVertical: 15, gap: 6 },
  headerTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addIngTouch: { alignSelf: 'flex-start' },
  sectionHeading: { fontSize: 13, fontWeight: '900', color: '#888', textTransform: 'uppercase', letterSpacing: 1 },
  actionText: { color: '#007AFF', fontWeight: '600' },
  aiBtn: { color: '#007AFF', fontWeight: '700' },
  sectionWrapper: { marginVertical: 8, padding: 16, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)', overflow: 'hidden' },
  catLabel: { fontSize: 11, fontWeight: '900', marginBottom: 12, textTransform: 'uppercase', opacity: 0.4, letterSpacing: 1.2 },
  listContainer: { width: '100%' },
  fullWidthRow: { width: '100%', paddingVertical: 10 },
  itemContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 12 },
  itemText: { fontSize: 15, fontWeight: '700', flex: 1 },
  row: { padding: 18, borderRadius: 18, marginBottom: 12 },
  saveBtn: { backgroundColor: '#34C759', padding: 20, borderRadius: 20, alignItems: 'center', marginTop: 30 },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  deleteBtn: { marginTop: 25, padding: 15, alignItems:'center' },
  deleteBtnText: { color:'#FF3B30', fontWeight:'700' },
  stockBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#34C759', minWidth: 75, alignItems: 'center' },
  stockBadgeText: { color: '#1B5E20', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  missingBadge: { backgroundColor: '#FFEBEE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#FF3B30', minWidth: 75, alignItems: 'center' },
  missingBadgeText: { color: '#B71C1C', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }
});