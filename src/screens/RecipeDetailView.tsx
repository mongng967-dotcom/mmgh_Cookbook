/**
 * Shared Recipe Detail View
 * Used by both RecipesScreen and PresetRecipesScreen
 */

import React from 'react';
import { 
  StyleSheet, Text, TouchableOpacity, View, TextInput, 
  ScrollView, Image, ImageBackground, useColorScheme 
} from 'react-native';

interface RecipeDetailProps {
  recipe: any;
  isReadOnly: boolean;
  onClose: () => void;
  // Edit Props (Only used if !isReadOnly)
  onSave?: () => void;
  onDelete?: () => void;
  onEditIng?: (ing: any) => void;
  onEditStep?: (index: number) => void;
  onAddIng?: () => void;
  onAddStep?: () => void;
  onAiExtract?: () => void;
  onImagePick?: () => void;
  setTitle: (t: string) => void;
  // Shared Helper
  isItemInStock: (ing: any) => boolean;
}

export function RecipeDetailView({
  recipe, isReadOnly, onClose, onSave, onDelete, 
  onEditIng, onEditStep, onAddIng, onAddStep, 
  onAiExtract, onImagePick, setTitle, isItemInStock
}: RecipeDetailProps) {
  
  const isDarkMode = useColorScheme() === 'dark';
  const textColor = isDarkMode ? '#e8e8e8' : '#1a1a2e';
  const cardBg = isDarkMode ? '#16213e' : '#ffffff';
  const subtext = isDarkMode ? '#a0a0a0' : '#666';

  const CATEGORIES = ['Meat', 'Vegetable', 'Seasoning and herbs', 'Other'];

  return (
    <ScrollView keyboardShouldPersistTaps="handled" style={styles.scroll}>
      <TouchableOpacity onPress={onClose}>
        <Text style={styles.backBtn}>← Back</Text>
      </TouchableOpacity>

      <TextInput 
        editable={!isReadOnly}
        style={[styles.titleInput, {color: textColor, backgroundColor: cardBg}, isReadOnly && styles.readOnlyInput]} 
        value={recipe.title} 
        onChangeText={setTitle} 
        placeholder="Recipe Title" 
      />
      
      <TouchableOpacity disabled={isReadOnly} style={[styles.uploadBox, {backgroundColor: cardBg}]} onPress={onImagePick}>
        {recipe.image_url || recipe.image_key ? (
          <Image source={typeof recipe.image_url === 'string' ? {uri: recipe.image_url} : recipe.image_url} style={styles.previewImage} />
        ) : <Text style={{color: '#888'}}>📷 No Image</Text>}
      </TouchableOpacity>

      <View style={styles.sectionHeaderView}>
        <Text style={styles.sectionHeading}>Ingredients</Text>
        {!isReadOnly && (
          <View style={{flexDirection: 'row'}}>
            <TouchableOpacity onPress={onAddIng}><Text style={styles.actionText}>+ Manual</Text></TouchableOpacity>
            <TouchableOpacity onPress={onAiExtract}><Text style={styles.actionText}>AI Extract</Text></TouchableOpacity>
          </View>
        )}
      </View>

      {/* Ingredient Rendering Logic... (Condensed for brevity, same as your existing logic) */}

      <View style={styles.sectionHeaderView}>
        <Text style={styles.sectionHeading}>Steps</Text>
        {!isReadOnly && <TouchableOpacity onPress={onAddStep}><Text style={styles.actionText}>+ Step</Text></TouchableOpacity>}
      </View>
      {recipe.steps.map((step: string, index: number) => (
        <TouchableOpacity disabled={isReadOnly} key={index} style={[styles.row, {backgroundColor: cardBg}]} onPress={() => onEditStep?.(index)}>
          <Text style={{color: textColor}}>{index + 1}. {step}</Text>
        </TouchableOpacity>
      ))}

      {!isReadOnly && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveBtn} onPress={onSave}><Text style={styles.btnText}>Save to Cloud</Text></TouchableOpacity>
          <TouchableOpacity onPress={onDelete}><Text style={styles.deleteText}>Delete Recipe</Text></TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  backBtn: { color: '#007AFF', marginBottom: 15, fontSize: 16, fontWeight: '600' },
  titleInput: { padding: 18, borderRadius: 16, fontSize: 20, fontWeight: '800', marginBottom: 15 },
  readOnlyInput: { opacity: 0.8 },
  uploadBox: { height: 160, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  previewImage: { width: '100%', height: '100%', borderRadius: 16 },
  sectionHeaderView: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 15 },
  sectionHeading: { fontSize: 13, fontWeight: '900', color: '#666', textTransform: 'uppercase' },
  actionText: { color: '#007AFF', marginLeft: 15, fontWeight: '600' },
  row: { padding: 18, borderRadius: 16, marginBottom: 10 },
  footer: { marginTop: 20, alignItems: 'center' },
  saveBtn: { backgroundColor: '#34C759', width: '100%', padding: 18, borderRadius: 18, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '900' },
  deleteText: { color: '#FF3B30', fontWeight: '700', marginTop: 20 }
});