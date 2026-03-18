// ---------------------- Imports ----------------------
import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
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
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#FF6347" />
      ) : (
        <GoogleSigninButton
          size={GoogleSigninButton.Size.Wide}
          color={GoogleSigninButton.Color.Dark}
          onPress={handleGoogleLogin}
        />
      )}
    </View>
  );
}

// ---------------------- Styles ----------------------
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
});