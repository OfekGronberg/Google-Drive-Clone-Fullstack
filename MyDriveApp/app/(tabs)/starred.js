import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { getUserId } from '../../src/api/CommunicationManager';
import { getStarred, starFile } from '../../src/api/FileManager';
import { createAppStyles, SPACING } from '../../styles/Theme';
import Header from '../../components/Header';
import { useTheme } from '../../src/theme/ThemeContext';

export default function StarredScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createAppStyles(colors), [colors]);
  const userId = getUserId();
  
  const [files, setFiles] = useState([]);

  useFocusEffect(
    useCallback(() => {
      handleLoadStarredFiles();
    }, [])
  );

  // Load starred files - triggered by button press
  async function handleLoadStarredFiles() {
    try {
      const starredData = await getStarred(userId);
      if (Array.isArray(starredData)) {
        setFiles(starredData);
      } else if (starredData && Array.isArray(starredData.content)) {
        setFiles(starredData.content);
      } else {
        setFiles([]);
      }
    } catch (error) {
      setFiles([]);
      Alert.alert('Error', 'Failed to load starred files');
    }
  }

  // Handle file click - navigate to edit page
  function handleFilePress(file) {
    const targetId = file.targetId || file.id;
    if (file.type === 'folder') {
      router.push(`/(tabs)?folderId=${targetId}`);
      return;
    }
    router.push(`/edit?id=${targetId}`);
  }

  // Handle long press - unstar file
  async function handleUnstar(file) {
    try {
      const targetId = file.targetId || file.id;
      await starFile(targetId, false);
      await handleLoadStarredFiles();
      Alert.alert('Success', 'File removed from favorites');
    } catch (error) {
      Alert.alert('Error', 'Failed to remove from favorites');
    }
  }

  // Get icon emoji for file type
  function getIcon(item) {
    if (item.type === 'folder') return '📁';
    return '📄';
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header />
      
      <View style={styles.container}>
        <Text style={styles.title}>Starred Files</Text>

        <FlatList
          data={files}
          renderItem={({ item }) => {
            return (
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: SPACING.md,
                  borderBottomWidth: 1,
                  borderBottomColor: '#E0E0E0',
                }}
                onPress={() => handleFilePress(item)}
                onLongPress={() => handleUnstar(item)}
              >
                <Text style={{ fontSize: 20, marginRight: SPACING.md }}>⭐</Text>
                <Text style={{ fontSize: 24, marginRight: SPACING.md }}>{getIcon(item)}</Text>
                <Text style={[styles.text, { flex: 1 }]}>{item.name}</Text>
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item) => item.id || item._id || String(Math.random())}
          ListEmptyComponent={
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={styles.text}>No favorite files yet.</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}
