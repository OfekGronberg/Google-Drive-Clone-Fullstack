import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { createAppStyles, SPACING } from '../styles/Theme';
import { useTheme } from '../src/theme/ThemeContext';

export default function HealthScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createAppStyles(colors), [colors]);
  const baseUrl = useMemo(
    () => process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
    []
  );

  const [status, setStatus] = useState('Checking...');
  const [details, setDetails] = useState('');

  async function runCheck() {
    setStatus('Checking...');
    setDetails('');

    try {
      const response = await fetch(`${baseUrl}/api/health`);
      const data = await response.json();

      if (!response.ok) {
        setStatus('Failed');
        setDetails(`HTTP ${response.status}: ${JSON.stringify(data)}`);
        return;
      }

      setStatus('OK');
      setDetails(JSON.stringify(data));
    } catch (error) {
      setStatus('Failed');
      setDetails(error?.message || 'Network request failed');
    }
  }

  useEffect(() => {
    runCheck();
  }, []);

  return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={styles.title}>API Health Check</Text>
      <Text style={{ marginTop: SPACING.md }}>Base URL</Text>
      <Text style={{ marginTop: SPACING.xs }}>{baseUrl}</Text>

      <Text style={{ marginTop: SPACING.lg }}>Status</Text>
      <Text style={{ marginTop: SPACING.xs, fontWeight: 'bold' }}>{status}</Text>

      {details ? (
        <Text style={{ marginTop: SPACING.md, textAlign: 'center' }}>{details}</Text>
      ) : null}

      <TouchableOpacity
        style={[styles.button, { marginTop: SPACING.lg }]}
        onPress={runCheck}
      >
        <Text style={styles.buttonText}>Retest</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.back()}
        style={{ marginTop: SPACING.lg }}
      >
        <Text style={{ color: colors.primary, textDecorationLine: 'underline' }}>
          Back
        </Text>
      </TouchableOpacity>
    </View>
  );
}
