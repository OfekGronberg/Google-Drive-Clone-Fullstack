import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { createAppStyles, SPACING } from '../styles/Theme';
import { request, setToken, setUserId } from '../src/api/CommunicationManager';
import { useTheme } from '../src/theme/ThemeContext';

export default function LoginScreen() {
  const router = useRouter();
  const { colors, setTheme } = useTheme();
  const styles = useMemo(() => createAppStyles(colors), [colors]);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    
    // Original authentication code - commented out for development
    if (!username.trim()) {
      Alert.alert('Error', 'Username is required');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Password is required');
      return;
    }

    setLoading(true);

    try {
      const data = await request({
        method: 'POST',
        path: '/api/tokens',
        body: {
          username: username.trim(),
          password: password.trim(),
        },
      });

      const token = data.token;
      
      if (!token) {
        Alert.alert('Error', 'Invalid username or password');
        return;
      }

      // Extract userId from JWT token
      let userId = null;
      try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload && payload.userId) {
          userId = String(payload.userId);
        }
      } catch (e) {
        // Continue without userId if parsing fails
      }

      setToken(token);
      if (userId) {
        setUserId(userId);
        try {
          const user = await request({
            method: 'GET',
            path: `/api/users/${userId}`,
          });
          if (user?.theme) {
            setTheme(user.theme);
          }
        } catch (e) {
          // ignore theme load errors
        }
      }
      router.replace('/(tabs)');
    } catch (error) {
      if (error.status === 401) {
        Alert.alert('Error', 'Invalid username or password');
      } else {
        Alert.alert('Error', error.message || 'Could not connect to server');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={styles.title}>Log in</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Log in'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/signup')}
        style={{ marginTop: SPACING.lg }}
      >
        <Text style={{ color: colors.primary, textDecorationLine: 'underline' }}>
          New user? Create an account
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/health')}
        style={{ marginTop: SPACING.md }}
      >
        <Text style={{ color: colors.primary, textDecorationLine: 'underline' }}>
          Test API connection
        </Text>
      </TouchableOpacity>
    </View>
  );
}
