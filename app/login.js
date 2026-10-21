import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { commonStyles } from '../styles/common.styles';

// Placeholder login screen for routing demonstration.
export default function LoginScreen() {
  const router = useRouter();

  const handleLogin = () => {
    // For now this is a simple placeholder.
    // After a successful login we replace the stack with the tabs layout.
    router.replace('/(tabs)');
  };

  return (
    <View style={[commonStyles.screenContainer, commonStyles.centerContent]}>
      <Text style={commonStyles.titleText}>Login Screen</Text>
      <TouchableOpacity onPress={handleLogin} style={{ marginTop: 24 }}>
        <Text>Simulate Login</Text>
      </TouchableOpacity>
    </View>
  );
}


