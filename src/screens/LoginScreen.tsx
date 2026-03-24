/**
 * Login Screen
 * @format
 */

// ---------------------- Imports ----------------------
import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, Text, Image, StatusBar } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { GoogleSignin, GoogleSigninButton } from '@react-native-google-signin/google-signin';
import { supabase } from '../lib/supabase';

// ---------------------- Configuration ----------------------
GoogleSignin.configure({
  webClientId: '916838884073-ie0kkl6lr6km5tnkn265jeb3vqkshbf7.apps.googleusercontent.com', 
  iosClientId: '916838884073-aaviq15mhofupi4rdq46g69d0lfo7emt.apps.googleusercontent.com',
});

export default function LoginScreen() {
  // ---------------------- State ----------------------
  const [loading, setLoading] = useState(false);

  // ---------------------- Handlers ----------------------
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      
      const idToken = response.data?.idToken;

      if (idToken) {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });
        if (error) throw error;
      } else {
        throw new Error('Google Login failed: No ID Token');
      }
    } catch (error: any) {
      if (error.code !== 'SIGN_IN_CANCELLED') {
        Alert.alert('Login Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------------------- Main UI ----------------------
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF9F2" />
        
        {/* Cover Section (Logo & Title) */}
        <View style={styles.coverSection}>
          <View style={styles.iconBackground}>
            <Image 
              source={require('../assets/Icons/cookbook.png')} 
              style={styles.logo} 
            />
          </View>
          <Text style={styles.title}>My Cookbook</Text>
          <Text style={styles.subtitle}>Your personal recipe & inventory manager</Text>
        </View>

        {/* Action Section (Login Button) */}
        <View style={styles.actionSection}>
          {loading ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : (
            <GoogleSigninButton
              size={GoogleSigninButton.Size.Wide}
              color={GoogleSigninButton.Color.Dark}
              onPress={handleGoogleLogin}
              style={styles.googleButton}
            />
          )}
        </View>
        
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// ---------------------- Styles ----------------------
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFF9F2' // Warm, welcoming kitchen tone
  },
  coverSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  iconBackground: {
    width: 140,
    height: 140,
    backgroundColor: '#fff',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    elevation: 10,
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    tintColor: '#FF9500', // Apple-like orange/amber tone for food
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#2C3E50',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 22,
  },
  actionSection: {
    paddingHorizontal: 30,
    paddingBottom: 60,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  googleButton: {
    width: '100%',
    height: 55,
  }
});