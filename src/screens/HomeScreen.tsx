/**
 * Home Screen – Simplified Dashboard (No Sign Out)
 * @format
 */

// ---------------------- Imports ----------------------
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

// ---------------------- Types & Metadata ----------------------
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;
type HomeRouteProp = RouteProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  // ---------------------- Hooks & State ----------------------
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<HomeRouteProp>();
  
  const userMetadata = route.params?.userSession?.user?.user_metadata;
  const firstName = userMetadata?.full_name?.split(' ')[0] || 'Chef';

  // ---------------------- Main UI ----------------------
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          
          <View style={styles.welcomeBanner}>
            <Text style={styles.greeting}>Hello, {firstName}!</Text>
            <Text style={styles.subtitle}>What are we cooking today?</Text>
          </View>
          
          <View style={styles.menuGrid}>
            {/* Shopping List Card (Moved to First Position) */}
            <TouchableOpacity 
              style={[styles.menuCard, { backgroundColor: '#F3E5F5' }]} 
              onPress={() => navigation.navigate('ShoppingList' as any)}
            >
              <View style={styles.iconWrapper}>
                <Image 
                  source={require('../assets/Icons/inventory.png')} 
                  style={[styles.cardIconImage, { tintColor: '#9C27B0' }]} 
                />
              </View>
              <Text style={styles.cardTitle}>Shopping List</Text>
              <Text style={styles.cardDesc}>Items to buy for your kitchen</Text>
            </TouchableOpacity>

            {/* My Cookbook Card */}
            <TouchableOpacity 
              style={[styles.menuCard, { backgroundColor: '#FFF3E0' }]} 
              onPress={() => navigation.navigate('Recipes')}
            >
              <View style={styles.iconWrapper}>
                <Image 
                  source={require('../assets/Icons/cookbook.png')} 
                  style={styles.cardIconImage} 
                />
              </View>
              <Text style={styles.cardTitle}>My Cookbook</Text>
              <Text style={styles.cardDesc}>View recipes & AI extractions</Text>
            </TouchableOpacity>

            {/* Inventory Card */}
            <TouchableOpacity 
              style={[styles.menuCard, { backgroundColor: '#E3F2FD' }]} 
              onPress={() => navigation.navigate('Inventory')}
            >
              <View style={styles.iconWrapper}>
                <Image 
                  source={require('../assets/Icons/inventory.png')} 
                  style={styles.cardIconImage} 
                />
              </View>
              <Text style={styles.cardTitle}>Inventory</Text>
              <Text style={styles.cardDesc}>Manage ingredients & fridge scans</Text>
            </TouchableOpacity>

            {/* Starter Recipes Card */}
            <TouchableOpacity 
              style={[styles.menuCard, { backgroundColor: '#F1F8E9' }]} 
              onPress={() => navigation.navigate('PresetRecipes')}
            >
              <View style={styles.iconWrapper}>
                <Image 
                  source={require('../assets/Icons/cookbook.png')} 
                  style={[styles.cardIconImage, { tintColor: '#4CAF50' }]} 
                />
              </View>
              <Text style={styles.cardTitle}>Starter Recipes</Text>
              <Text style={styles.cardDesc}>Browse 300+ preset dishes</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// ---------------------- Styles ----------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { padding: 20, alignItems: 'center' },
  welcomeBanner: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 30,
    marginTop: 10,
  },
  greeting: { fontSize: 32, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 4 },
  menuGrid: { width: '100%', gap: 20, marginBottom: 40 },
  menuCard: {
    width: '100%',
    padding: 25,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIconImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: '#2C3E50' },
  cardDesc: { fontSize: 14, color: '#546E7A', marginTop: 5 },
});