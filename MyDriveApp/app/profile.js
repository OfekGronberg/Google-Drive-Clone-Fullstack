import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createAppStyles, SPACING } from '../styles/Theme';
import { request, getBaseUrl, getUserId } from '../src/api/CommunicationManager';
import { useTheme } from '../src/theme/ThemeContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createAppStyles(colors), [colors]);
  const localStyles = useMemo(() => createLocalStyles(colors), [colors]);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useFocusEffect(
    useCallback(() => {
      const userId = getUserId();
      if (!userId) {
        return;
      }

      const baseUrl = getBaseUrl();

      request({
        method: 'GET',
        path: `/api/users/${userId}`,
      })
        .then((user) => {
          setName(user?.name || '');
          setUsername(user?.username || '');
          if (user?.imageUrl) {
            const rawUrl = user.imageUrl;
            setImageUrl(rawUrl.startsWith('/') ? `${baseUrl}${rawUrl}` : rawUrl);
          } else {
            setImageUrl('');
          }
        })
        .catch(() => {
          setName('');
          setUsername('');
          setImageUrl('');
        });
    }, [])
  );

  return (
    <SafeAreaView edges={['top']} style={localStyles.safeArea}>
      <View style={localStyles.container}>
        <Text style={styles.title}>Profile</Text>

        <View style={localStyles.avatar}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={localStyles.avatarImage} />
          ) : (
            <Text style={localStyles.avatarText}>
              {(name || username || 'U').charAt(0).toUpperCase()}
            </Text>
          )}
        </View>

        <Text style={localStyles.label}>Name</Text>
        <Text style={localStyles.value}>{name || '—'}</Text>

        <Text style={localStyles.label}>Username</Text>
        <Text style={localStyles.value}>{username || '—'}</Text>

        <TouchableOpacity
          style={[styles.button, { marginTop: SPACING.lg }]}
          onPress={() => router.push('/settings')}
        >
          <Text style={styles.buttonText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createLocalStyles = (colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      alignItems: 'center',
      padding: SPACING.lg,
      backgroundColor: colors.background,
    },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: SPACING.lg,
      marginBottom: SPACING.lg,
    },
    avatarText: {
      color: '#FFFFFF',
      fontSize: 36,
      fontWeight: 'bold',
    },
    avatarImage: {
      width: 96,
      height: 96,
      borderRadius: 48,
    },
    label: {
      marginTop: SPACING.md,
      color: colors.secondary,
      fontSize: 14,
    },
    value: {
      marginTop: SPACING.xs,
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
  });
