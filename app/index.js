import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { commonStyles } from '../styles/common.styles';

// Simple welcome / redirect screen.
export default function IndexScreen() {
  const router = useRouter();

  const handleStart = () => {
    // In a real app this could check auth state.
    router.push('/login');
  };

  return (
    <View style={[commonStyles.screenContainer, commonStyles.centerContent]}>
      <Text style={commonStyles.titleText}>Welcome to Mobile Drive</Text>
      <TouchableOpacity onPress={handleStart} style={{ marginTop: 24 }}>
        <Text>Go to Login</Text>
      </TouchableOpacity>
    </View>
  );
}


