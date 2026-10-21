import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView, TextInput, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { getUserId } from '../../src/api/CommunicationManager';
import { getRoot, getFolderContent, getFileById, createFolder, createFile, renameItem, moveItem, moveToTrash, shareFile, starFile } from '../../src/api/FileManager';
import { createAppStyles, SPACING } from '../../styles/Theme';
import { createCommonStyles } from '../../styles/common.styles';
import Header from '../../components/Header';
import { useTheme } from '../../src/theme/ThemeContext';

export default function DriveScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createAppStyles(colors), [colors]);
  const commonStyles = useMemo(() => createCommonStyles(colors), [colors]);
  const fabStyles = useMemo(() => createFabStyles(colors), [colors]);
  const { folderId } = useLocalSearchParams();
  const targetFolderId = Array.isArray(folderId) ? folderId[0] : folderId;
  const userId = getUserId();
  
  const [files, setFiles] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: 'My Drive' }]);
  const [showCreateOptions, setShowCreateOptions] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [createType, setCreateType] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showRenameInput, setShowRenameInput] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [showShareInput, setShowShareInput] = useState(false);
  const [shareTarget, setShareTarget] = useState('');
  const [shareRole, setShareRole] = useState('reader');
  const [showActionMenu, setShowActionMenu] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (targetFolderId && targetFolderId !== currentFolderId) {
        handleOpenFolderById(targetFolderId);
        return;
      }
      handleLoadFiles(currentFolderId);
    }, [currentFolderId, targetFolderId])
  );

  // Load files for current folder - triggered by button press
  async function handleLoadFiles(folderId = null) {
    try {
      let filesList = [];

      if (folderId) {
        const folder = await getFileById(folderId);
        filesList = folder.content || await getFolderContent(folderId);
      } else {
        const rootFolder = await getRoot(userId);
        filesList = rootFolder.content || await getFolderContent(rootFolder.id);
        setCurrentFolderId(rootFolder.id);
      }

      setFiles(filesList || []);
    } catch (error) {
      setFiles([]);
      Alert.alert('Error', 'Failed to load files');
    }
  }

  async function handleOpenFolderById(folderId) {
    try {
      const folder = await getFileById(folderId);
      const filesList = folder.content || await getFolderContent(folderId);
      setBreadcrumbs([{ id: null, name: 'My Drive' }, { id: folderId, name: folder.name || 'Folder' }]);
      setCurrentFolderId(folderId);
      setFiles(filesList || []);
      router.setParams({ folderId: undefined });
    } catch (error) {
      setFiles([]);
      Alert.alert('Error', 'Failed to load folder');
    }
  }

  // Handle folder click - navigate into folder
  async function handleFolderClick(folder) {
    const newBreadcrumbs = [...breadcrumbs, { id: folder.id, name: folder.name }];
    setBreadcrumbs(newBreadcrumbs);
    setCurrentFolderId(folder.id);
    await handleLoadFiles(folder.id);
  }

  // Handle file click - navigate to edit page
  function handleFileClick(file) {
    router.push(`/edit?id=${file.id}`);
  }

  // Handle breadcrumb click - navigate back to folder
  async function handleBreadcrumbClick(index) {
    if (index === 0) {
      setBreadcrumbs([{ id: null, name: 'My Drive' }]);
      setCurrentFolderId(null);
      router.setParams({ folderId: undefined });
      await handleLoadFiles();
    } else {
      const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
      setBreadcrumbs(newBreadcrumbs);
      const targetFolder = newBreadcrumbs[newBreadcrumbs.length - 1];
      setCurrentFolderId(targetFolder.id);
      await handleLoadFiles(targetFolder.id);
    }
  }

  // Format file type and date
  function getFileDetails(item) {
    const type = item.type || 'file';
    const date = item.createdAt || item.updatedAt || '';
    return `${type}${date ? ' • ' + new Date(date).toLocaleDateString() : ''}`;
  }

  // Handle FAB click - show create options
  function handleFabClick() {
    setShowCreateOptions(true);
  }

  // Handle create option selection
  function handleCreateOption(type) {
    setCreateType(type);
    setNewItemName('');
    setShowCreateOptions(false);
    setShowNameInput(true);
  }

  // Handle item creation
  async function handleCreateItem() {
    if (!newItemName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    try {
      if (createType === 'folder') {
        await createFolder(newItemName.trim(), currentFolderId);
        Alert.alert('Success', 'Folder created successfully');
      } else {
        const newFile = await createFile(newItemName.trim(), currentFolderId);
        Alert.alert('Success', 'File created successfully');
        if (newFile && newFile.id) {
          router.push(`/edit?id=${newFile.id}`);
        }
      }
      setShowNameInput(false);
      setNewItemName('');
      setCreateType(null);
      await handleLoadFiles(currentFolderId);
    } catch (error) {
      Alert.alert('Error', 'Failed to create item: ' + (error.message || 'Unknown error'));
    }
  }

  // Handle long press - show context menu
  function handleLongPress(item) {
    setSelectedItem(item);
    setShowActionMenu(true);
  }

  // Handle rename
  async function handleRename() {
    if (!selectedItem || !renameValue.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    try {
      await renameItem(selectedItem.id, renameValue.trim());
      Alert.alert('Success', 'Item renamed successfully');
      setShowRenameInput(false);
      setRenameValue('');
      setSelectedItem(null);
      await handleLoadFiles(currentFolderId);
    } catch (error) {
      Alert.alert('Error', 'Failed to rename item: ' + (error.message || 'Unknown error'));
    }
  }

  // Handle move
  async function handleMoveClick(item) {
    Alert.alert(
      'Move Item',
      'Move to My Drive (Root)?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Move', onPress: async () => {
          try {
            await moveItem(item.id, null);
            Alert.alert('Success', 'Item moved successfully');
            await handleLoadFiles(currentFolderId);
          } catch (error) {
            Alert.alert('Error', error.message || 'Failed to move item');
          }
        }},
      ]
    );
  }

  // Handle star/unstar
  async function handleToggleStar(item) {
    try {
      await starFile(item.id, !item.starred);
      await handleLoadFiles(currentFolderId);
    } catch (error) {
      Alert.alert('Error', 'Failed to update star status');
    }
  }

  // Handle share
  function handleShareClick(item) {
    setSelectedItem(item);
    setShareTarget('');
    setShareRole('reader');
    setShowShareInput(true);
  }

  async function handleShareSubmit() {
    if (!selectedItem) {
      setShowShareInput(false);
      return;
    }

    if (!shareTarget.trim()) {
      Alert.alert('Error', 'Enter a username or userId');
      return;
    }

    try {
      await shareFile(selectedItem.id, shareTarget.trim(), shareRole);
      Alert.alert('Success', 'Shared successfully');
      setShowShareInput(false);
      setShareTarget('');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to share item');
    }
  }

  // Handle delete
  async function handleDeleteClick(item) {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to move "${item.name}" to trash?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await moveToTrash(item.id);
              Alert.alert('Success', 'Item moved to trash');
              await handleLoadFiles(currentFolderId);
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to delete item');
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
      
      {/* Header: Title */}
      <View style={{ padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' }}>
        <Text style={commonStyles.titleText}>My Drive</Text>
      </View>

      {/* Breadcrumbs */}
      {breadcrumbs.length > 1 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={{ height: 44, paddingHorizontal: SPACING.md, paddingVertical: 0, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' }}
          contentContainerStyle={{ alignItems: 'center' }}
        >
          {breadcrumbs.map((crumb, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleBreadcrumbClick(index)}
              style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}
            >
              <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600', lineHeight: 20 }}>{crumb.name}</Text>
              {index < breadcrumbs.length - 1 && (
                <Text style={{ marginLeft: 4, color: colors.secondary, fontSize: 14, lineHeight: 20 }}> › </Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* List of files and folders */}
      <FlatList
        data={files}
        renderItem={({ item }) => {
          const isFolder = item.type === 'folder';
          
          return (
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: SPACING.md,
                borderBottomWidth: 1,
                borderBottomColor: '#E0E0E0',
              }}
              onPress={() => isFolder ? handleFolderClick(item) : handleFileClick(item)}
              onLongPress={() => handleLongPress(item)}
            >
              {/* File/Folder icon */}
              <Text style={{ fontSize: 28, marginRight: SPACING.md }}>{getIcon(item)}</Text>
              
              {/* File details */}
              <View style={{ flex: 1 }}>
                <Text style={[styles.text, { fontWeight: '500', marginBottom: 4 }]}>{item.name}</Text>
                <Text style={{ fontSize: 12, color: colors.secondary }}>
                  {getFileDetails(item)}
                </Text>
              </View>
              
              {/* Arrow icon */}
              <Text style={{ fontSize: 16, color: colors.secondary }}> › </Text>
            </TouchableOpacity>
          );
        }}
        keyExtractor={(item) => item.id || item._id || String(Math.random())}
        ListEmptyComponent={
          <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={styles.text}>No files found.</Text>
          </View>
        }
      />

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={fabStyles.fab}
        onPress={handleFabClick}
      >
        <Text style={fabStyles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Create Options */}
      {showCreateOptions && (
        <View style={fabStyles.overlay}>
          <View style={fabStyles.optionsContainer}>
            <Text style={fabStyles.optionsTitle}>Create New</Text>
            
            <TouchableOpacity
              style={fabStyles.optionButton}
              onPress={() => handleCreateOption('file')}
            >
              <Text style={fabStyles.optionText}>📄 New File</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={fabStyles.optionButton}
              onPress={() => handleCreateOption('folder')}
            >
              <Text style={fabStyles.optionText}>📁 New Folder</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={fabStyles.optionButton}
              onPress={() => setShowCreateOptions(false)}
            >
              <Text style={fabStyles.optionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Name Input - using Alert prompt */}
      {showNameInput && (
        <View style={fabStyles.overlay}>
          <View style={fabStyles.inputContainer}>
            <Text style={fabStyles.inputTitle}>
              {createType === 'folder' ? 'New Folder' : 'New File'}
            </Text>
            
            <TextInput
              style={fabStyles.nameInput}
              placeholder="Enter name"
              value={newItemName}
              onChangeText={setNewItemName}
              autoFocus
            />

            <View style={fabStyles.inputButtons}>
              <TouchableOpacity
                style={[fabStyles.inputButton, fabStyles.cancelButton]}
                onPress={() => {
                  setShowNameInput(false);
                  setNewItemName('');
                  setCreateType(null);
                }}
              >
                <Text style={fabStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[fabStyles.inputButton, fabStyles.createButton]}
                onPress={handleCreateItem}
              >
                <Text style={fabStyles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Rename Input */}
      {showRenameInput && (
        <View style={fabStyles.overlay}>
          <View style={fabStyles.inputContainer}>
            <Text style={fabStyles.inputTitle}>Rename</Text>
            
            <TextInput
              style={fabStyles.nameInput}
              placeholder="Enter new name"
              value={renameValue}
              onChangeText={setRenameValue}
              autoFocus
            />

            <View style={fabStyles.inputButtons}>
              <TouchableOpacity
                style={[fabStyles.inputButton, fabStyles.cancelButton]}
                onPress={() => {
                  setShowRenameInput(false);
                  setRenameValue('');
                  setSelectedItem(null);
                }}
              >
                <Text style={fabStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[fabStyles.inputButton, fabStyles.createButton]}
                onPress={handleRename}
              >
                <Text style={fabStyles.createButtonText}>Rename</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Share Input */}
      {showShareInput && (
        <View style={fabStyles.overlay}>
          <View style={fabStyles.inputContainer}>
            <Text style={fabStyles.inputTitle}>Share</Text>

            <TextInput
              style={fabStyles.nameInput}
              placeholder="Username or userId"
              value={shareTarget}
              onChangeText={setShareTarget}
              autoFocus
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.md }}>
              <TouchableOpacity
                style={[fabStyles.inputButton, shareRole === 'reader' ? fabStyles.createButton : fabStyles.cancelButton]}
                onPress={() => setShareRole('reader')}
              >
                <Text style={shareRole === 'reader' ? fabStyles.createButtonText : fabStyles.cancelButtonText}>Reader</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[fabStyles.inputButton, shareRole === 'editor' ? fabStyles.createButton : fabStyles.cancelButton]}
                onPress={() => setShareRole('editor')}
              >
                <Text style={shareRole === 'editor' ? fabStyles.createButtonText : fabStyles.cancelButtonText}>Editor</Text>
              </TouchableOpacity>
            </View>

            <View style={fabStyles.inputButtons}>
              <TouchableOpacity
                style={[fabStyles.inputButton, fabStyles.cancelButton]}
                onPress={() => {
                  setShowShareInput(false);
                  setShareTarget('');
                }}
              >
                <Text style={fabStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[fabStyles.inputButton, fabStyles.createButton]}
                onPress={handleShareSubmit}
              >
                <Text style={fabStyles.createButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Action Menu */}
      {showActionMenu && selectedItem && (
        <View style={fabStyles.overlay}>
          <View style={fabStyles.optionsContainer}>
            <Text style={fabStyles.optionsTitle}>{selectedItem.name}</Text>

            <TouchableOpacity
              style={fabStyles.optionButton}
              onPress={() => {
                setShowActionMenu(false);
                handleToggleStar(selectedItem);
              }}
            >
              <Text style={fabStyles.optionText}>{selectedItem.starred ? '⭐ Unstar' : '⭐ Star'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={fabStyles.optionButton}
              onPress={() => {
                setShowActionMenu(false);
                setRenameValue(selectedItem.name);
                setShowRenameInput(true);
              }}
            >
              <Text style={fabStyles.optionText}>✏️ Rename</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={fabStyles.optionButton}
              onPress={() => {
                setShowActionMenu(false);
                handleMoveClick(selectedItem);
              }}
            >
              <Text style={fabStyles.optionText}>📁 Move</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={fabStyles.optionButton}
              onPress={() => {
                setShowActionMenu(false);
                handleShareClick(selectedItem);
              }}
            >
              <Text style={fabStyles.optionText}>🤝 Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={fabStyles.optionButton}
              onPress={() => {
                setShowActionMenu(false);
                handleDeleteClick(selectedItem);
              }}
            >
              <Text style={[fabStyles.optionText, { color: colors.danger }]}>🗑️ Move to Trash</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={fabStyles.optionButton}
              onPress={() => setShowActionMenu(false)}
            >
              <Text style={fabStyles.optionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// Styles for FAB and overlays
const createFabStyles = (colors) =>
  StyleSheet.create({
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#E0E0E0',
    },
    fabText: {
      fontSize: 32,
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    optionsContainer: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: SPACING.lg,
      width: '80%',
      maxWidth: 300,
    },
    optionsTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: SPACING.lg,
      textAlign: 'center',
    },
    optionButton: {
      padding: SPACING.md,
      marginBottom: SPACING.md,
      borderRadius: 8,
      backgroundColor: '#F5F5F5',
      borderWidth: 1,
      borderColor: '#E0E0E0',
    },
    optionText: {
      fontSize: 16,
      color: colors.text,
      textAlign: 'center',
    },
    inputContainer: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: SPACING.lg,
      width: '80%',
      maxWidth: 300,
    },
    inputTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: SPACING.lg,
      textAlign: 'center',
    },
    nameInput: {
      borderWidth: 1,
      borderColor: '#E0E0E0',
      borderRadius: 8,
      padding: SPACING.md,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.background,
      marginBottom: SPACING.lg,
    },
    inputButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    inputButton: {
      flex: 1,
      padding: SPACING.md,
      borderRadius: 8,
      alignItems: 'center',
      marginHorizontal: SPACING.md / 2,
    },
    cancelButton: {
      backgroundColor: '#F5F5F5',
      borderWidth: 1,
      borderColor: '#E0E0E0',
    },
    createButton: {
      backgroundColor: colors.primary,
    },
    cancelButtonText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
    createButtonText: {
      fontSize: 16,
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
  });
