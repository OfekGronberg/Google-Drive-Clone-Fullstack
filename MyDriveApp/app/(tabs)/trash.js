import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getUserId } from '../../src/api/CommunicationManager';
import { getTrash, restoreFile, deleteFile } from '../../src/api/FileManager';
import { createAppStyles, SPACING } from '../../styles/Theme';
import Header from '../../components/Header';
import { useTheme } from '../../src/theme/ThemeContext';

export default function TrashScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createAppStyles(colors), [colors]);
  const userId = getUserId();
  
  const [files, setFiles] = useState([]);

  useFocusEffect(
    useCallback(() => {
      handleLoadTrashFiles();
    }, [])
  );

  // Load trash files - triggered by button press
  async function handleLoadTrashFiles() {
    try {
      const trashData = await getTrash(userId);
      if (Array.isArray(trashData)) {
        setFiles(trashData);
      } else if (trashData && Array.isArray(trashData.content)) {
        setFiles(trashData.content);
      } else {
        setFiles([]);
      }
    } catch (error) {
      setFiles([]);
      Alert.alert('Error', 'Failed to load trash');
    }
  }

  // Handle restore button click
  async function handleRestore(file) {
    try {
      await restoreFile(file.id);
      await handleLoadTrashFiles();
      Alert.alert('Success', 'File restored successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to restore file');
    }
  }

  // Handle delete permanently button click
  async function handleDeletePermanently(file) {
    Alert.alert(
      'Delete Permanently',
      'Are you sure? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFile(file.id);
              await handleLoadTrashFiles();
              Alert.alert('Success', 'File deleted permanently');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete file');
            }
          },
        },
      ]
    );
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
        <Text style={styles.title}>Trash Bin</Text>

        <FlatList
          data={files}
          renderItem={({ item }) => {
            return (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: SPACING.md,
                  borderBottomWidth: 1,
                  borderBottomColor: '#E0E0E0',
                }}
              >
                <Text style={{ fontSize: 24, marginRight: SPACING.md }}>{getIcon(item)}</Text>
                <Text style={[styles.text, { flex: 1 }]}>{item.name}</Text>
                
                {/* Restore button */}
                <TouchableOpacity
                  onPress={() => handleRestore(item)}
                  style={{ padding: SPACING.md, marginRight: SPACING.md }}
                >
                  <Text style={{ fontSize: 24, color: colors.success }}>↩️</Text>
                </TouchableOpacity>
                
                {/* Delete permanently button */}
                <TouchableOpacity
                  onPress={() => handleDeletePermanently(item)}
                  style={{ padding: SPACING.md }}
                >
                  <Text style={{ fontSize: 24, color: colors.danger }}>🗑️</Text>
                </TouchableOpacity>
              </View>
            );
          }}
          keyExtractor={(item) => item.id || item._id || String(Math.random())}
          ListEmptyComponent={
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ fontSize: 48, marginBottom: SPACING.md }}>🗑️</Text>
              <Text style={styles.text}>Your trash is empty.</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}
