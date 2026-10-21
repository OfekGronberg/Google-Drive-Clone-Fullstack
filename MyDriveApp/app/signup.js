import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { createAppStyles, SPACING } from '../styles/Theme';
import { request } from '../src/api/CommunicationManager';
import { useTheme } from '../src/theme/ThemeContext';
import { validatePassword, validateUsername } from '../src/validation/authValidation';

export default function SignupScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createAppStyles(colors), [colors]);
  
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!username.trim()) {
      Alert.alert('Error', 'Username is required');
      return;
    }
    
    if (!password.trim()) {
      Alert.alert('Error', 'Password is required');
      return;
    }

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    const validationErrors = [
      ...validateUsername(trimmedUsername),
      ...validatePassword(trimmedPassword),
    ];

    if (validationErrors.length > 0) {
      Alert.alert('Error', validationErrors.join('\n'));
      return;
    }

    setLoading(true);

    try {
      const requestBody = {
        username: trimmedUsername,
        password: trimmedPassword,
      };
      
      if (name.trim()) {
        requestBody.name = name.trim();
      }

      await request({
        method: 'POST',
        path: '/api/users',
        body: requestBody,
      });

      Alert.alert('Success', 'Account created!', [
        {
          text: 'OK',
          onPress: () => router.replace('/login'),
        },
      ]);
    } catch (error) {
      if (error.status === 400) {
        Alert.alert('Error', 'Invalid input. Please check your information.');
      } else if (error.status === 409) {
        Alert.alert('Error', 'Username already exists');
      } else {
        Alert.alert('Error', error.message || 'Could not connect to server');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.title}>Sign Up</Text>
        
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

        <TextInput
          style={styles.input}
          placeholder="Name (Optional)"
          value={name}
          onChangeText={setName}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleSignup}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Signing Up...' : 'Sign Up'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: SPACING.lg }}
        >
          <Text style={{ color: colors.primary, textDecorationLine: 'underline' }}>
            Back to Login
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
