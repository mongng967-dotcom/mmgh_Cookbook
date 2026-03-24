/**
 * App Entry – Navigation & Global Header Configuration
 * @format
 */

// ---------------------- Imports ----------------------
import React, { useState, useEffect } from 'react';
import { View, Image, TouchableOpacity, Alert, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Session } from '@supabase/supabase-js';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { supabase } from './src/lib/supabase';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import { InventoryScreen } from './src/screens/InventoryScreen';
import { RecipesScreen } from './src/screens/RecipesScreen';
import { PresetRecipesScreen } from './src/screens/PresetRecipesScreen';
import { AlbumScanScreen } from './src/screens/AlbumScanScreen';
import { ShoppingListScreen } from './src/screens/ShoppingListScreen'; // Added
import { RootStackParamList } from './src/navigation/types';

import { LogBox } from 'react-native';

// ---------------------- Configuration ----------------------
LogBox.ignoreLogs(['Sending `onAnimatedValueUpdate` with no listeners registered.']);

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  // ---------------------- State & Auth Logic ----------------------
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleHeaderSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out of your account?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Sign Out", 
          style: "destructive", 
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              await GoogleSignin.signOut();
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          } 
        }
      ]
    );
  };

  if (loading) return null;

  // ---------------------- Navigation UI ----------------------
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#333',
        }}
      >
        {session ? (
          <>
            <Stack.Screen 
              name="Home" 
              component={HomeScreen} 
              initialParams={{ userSession: session }}
              options={{ 
                headerTitle: "Cookbook",
                headerTitleStyle: { fontSize: 18, fontWeight: '800' },
                headerRight: () => {
                  const avatar = session.user.user_metadata.avatar_url;
                  const initial = session.user.user_metadata.full_name?.charAt(0) || 'U';
                  
                  return (
                    <TouchableOpacity 
                      style={{ marginRight: 5 }} 
                      onPress={handleHeaderSignOut}
                    >
                      {avatar ? (
                        <Image 
                          source={{ uri: avatar }} 
                          style={{ width: 34, height: 34, borderRadius: 17 }} 
                        />
                      ) : (
                        <View style={{ 
                          width: 34, height: 34, borderRadius: 17, 
                          backgroundColor: '#455A64', justifyContent: 'center', alignItems: 'center' 
                        }}>
                          <Text style={{ color: '#fff', fontWeight: 'bold' }}>{initial}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                },
              }} 
            />
            <Stack.Screen 
              name="ShoppingList" 
              component={ShoppingListScreen} 
              options={{ title: "My Shopping List" }} 
            />
            <Stack.Screen name="Inventory" component={InventoryScreen} />
            <Stack.Screen name="Recipes" component={RecipesScreen} />
            <Stack.Screen name="AlbumScan" component={AlbumScanScreen} options={{ headerShown: false }} />  
            <Stack.Screen 
              name="PresetRecipes" 
              component={PresetRecipesScreen} 
              options={{ title: "Starter Recipes" }}
            />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}