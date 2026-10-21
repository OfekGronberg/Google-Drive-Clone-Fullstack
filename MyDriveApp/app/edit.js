import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFileById, patchFileFields, starFile } from '../src/api/FileManager';
import { SPACING } from '../styles/Theme';
import { useTheme } from '../src/theme/ThemeContext';

export default function EditScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [isStarred, setIsStarred] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      handleLoadFile();
    }, [id])
  );

  // Load file data - triggered by button press
  async function handleLoadFile() {
    if (!id) {
      Alert.alert('Error', 'File ID is missing');
      return;
    }

    try {
      const fileData = await getFileById(id);
      setFileName(fileData.name || '');
      setFileContent(fileData.content || '');
      setIsStarred(Boolean(fileData.starred));
      setIsLoaded(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load file: ' + (error.message || 'Unknown error'));
    }
  }

  // Handle save button click
  async function handleSave() {
    if (!id) {
      Alert.alert('Error', 'File ID is missing');
      return;
    }

    try {
      await patchFileFields(id, {
        name: fileName.trim(),
        content: fileContent,
      });
      Alert.alert('Success', 'File saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save file: ' + (error.message || 'Unknown error'));
    }
  }

  // Handle star button click
  async function handleStar() {
    if (!id) {
      return;
    }

    const newStarredState = !isStarred;
    setIsStarred(newStarredState);

    try {
      await starFile(id, newStarredState);
    } catch (error) {
      setIsStarred(!newStarredState);
      Alert.alert('Error', 'Failed to update star status: ' + (error.message || 'Unknown error'));
    }
  }

  if (!isLoaded) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={[styles.container, styles.centerContent]}>
          <Text style={styles.loadingText}>Loading file...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
      {/* Custom Header with Back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit File</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Top Bar: File name input and Star button */}
      <View style={styles.topBar}>
        <TextInput
          style={styles.nameInput}
          placeholder="File name"
          value={fileName}
          onChangeText={setFileName}
        />
        <TouchableOpacity onPress={handleStar} style={styles.starButton}>
          <Text style={styles.starText}>{isStarred ? '⭐' : '☆'}</Text>
        </TouchableOpacity>
      </View>

      {/* Main Area: File content editor */}
      <TextInput
        style={styles.contentInput}
        placeholder="File content"
        value={fileContent}
        onChangeText={setFileContent}
        multiline
        textAlignVertical="top"
      />

      {/* Bottom: Save button */}
      <TouchableOpacity 
        onPress={handleSave} 
        style={styles.saveButton}
      >
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: SPACING.md,
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: SPACING.md,
      color: colors.text,
      fontSize: 16,
      marginBottom: SPACING.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: SPACING.md,
      paddingBottom: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
    },
    backButton: {
      padding: SPACING.md,
    },
    backText: {
      fontSize: 16,
      color: colors.primary,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.md,
    },
    nameInput: {
      flex: 1,
      padding: SPACING.md,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      borderRadius: 4,
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      backgroundColor: '#F5F5F5',
      marginRight: SPACING.md,
    },
    starButton: {
      padding: SPACING.md,
    },
    starText: {
      fontSize: 28,
      color: colors.text,
    },
    contentInput: {
      flex: 1,
      padding: SPACING.md,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      borderRadius: 4,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.background,
      marginBottom: SPACING.md,
    },
    saveButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      borderRadius: 4,
      alignItems: 'center',
      width: '100%',
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
      fontSize: 16,
    },
  });
