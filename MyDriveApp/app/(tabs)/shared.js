import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { getUserId } from '../../src/api/CommunicationManager';
import { getShared } from '../../src/api/FileManager';
import { createAppStyles, SPACING } from '../../styles/Theme';
import Header from '../../components/Header';
import { useTheme } from '../../src/theme/ThemeContext';

export default function SharedScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createAppStyles(colors), [colors]);
  const userId = getUserId();
  
  const [files, setFiles] = useState([]);

  useFocusEffect(
    useCallback(() => {
      handleLoadSharedFiles();
    }, [])
  );

  // Load shared files - triggered by button press
  async function handleLoadSharedFiles() {
    try {
      const sharedData = await getShared(userId);
      if (Array.isArray(sharedData)) {
        setFiles(sharedData);
      } else if (sharedData && Array.isArray(sharedData.content)) {
        setFiles(sharedData.content);
      } else {
        setFiles([]);
      }
    } catch (error) {
      setFiles([]);
      Alert.alert('Error', 'Failed to load shared files');
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

  // Get permission level from file
  function getPermissionLevel(file) {
    if (file.permission) return file.permission;
    if (file.role) return file.role;
    return 'Reader';
  }

  // Get owner name from file
  function getOwnerName(file) {
    if (file.ownerName) return file.ownerName;
    if (file.owner) return file.owner;
    if (file.sharedBy) return file.sharedBy;
    return 'Unknown';
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
        <Text style={styles.title}>Shared with Me</Text>

        <FlatList
          data={files}
          renderItem={({ item }) => {
            const permission = getPermissionLevel(item);
            const ownerName = getOwnerName(item);
            const isEditor = permission === 'Editor' || permission === 'editor';
            
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
              >
                <Text style={{ fontSize: 24, marginRight: SPACING.md }}>{getIcon(item)}</Text>
                
                <View style={{ flex: 1 }}>
                  <Text style={[styles.text, { fontWeight: 'bold' }]}>{item.name}</Text>
                  <Text style={{ fontSize: 12, color: colors.secondary, marginTop: 4 }}>
                    Shared by: {ownerName}
                  </Text>
                </View>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: SPACING.md }}>
                  <Text style={{ fontSize: 16, marginRight: 4 }}>{isEditor ? '✏️' : '👁️'}</Text>
                  <Text style={{ fontSize: 12, color: colors.secondary }}>
                    {isEditor ? 'Editor' : 'Reader'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item) => item.id || item._id || String(Math.random())}
          ListEmptyComponent={
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ fontSize: 48, marginBottom: SPACING.md }}>👥</Text>
              <Text style={styles.text}>No shared files yet.</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}
