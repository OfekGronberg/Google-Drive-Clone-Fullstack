import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Button, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { search as searchFiles } from '../src/api/FileManager';
import { createAppStyles, SPACING } from '../styles/Theme';
import { createCommonStyles } from '../styles/common.styles';
import { useTheme } from '../src/theme/ThemeContext';

export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createAppStyles(colors), [colors]);
  const commonStyles = useMemo(() => createCommonStyles(colors), [colors]);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);

  // Handle search when button is pressed
  async function handleSearch() {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      setResults([]);
      return;
    }

    try {
      const searchResults = await searchFiles(trimmedQuery);
      if (Array.isArray(searchResults)) {
        setResults(searchResults);
      } else if (searchResults && Array.isArray(searchResults.content)) {
        setResults(searchResults.content);
      } else {
        setResults([]);
      }
    } catch (error) {
      setResults([]);
      Alert.alert('Error', 'Search failed');
    }
  }

  // Handle file click - navigate to edit page
  function handleFilePress(file) {
    router.push(`/edit?id=${file.id}`);
  }

  // Get icon emoji for file type
  function getIcon(item) {
    if (item.type === 'folder') return '📁';
    return '📄';
  }

  return (
    <View style={commonStyles.screenContainer}>
      <Text style={commonStyles.title}>Search</Text>

      {/* Search bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md }}>
        <Text style={{ marginRight: SPACING.md, fontSize: 20 }}>🔍</Text>
        <TextInput
          style={{
            flex: 1,
            padding: SPACING.md,
            borderWidth: 1,
            borderColor: '#E0E0E0',
            borderRadius: 4,
            fontSize: 16,
            color: colors.text,
            backgroundColor: colors.background,
          }}
          placeholder="Search files..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Button title="Search" onPress={handleSearch} />
      </View>

      {/* Search results */}
      <FlatList
        data={results}
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
            >
              <Text style={{ fontSize: 24, marginRight: SPACING.md }}>{getIcon(item)}</Text>
              <Text style={[styles.text, { flex: 1 }]}>{item.name}</Text>
              <Text style={{ fontSize: 16, color: colors.secondary }}> › </Text>
            </TouchableOpacity>
          );
        }}
        keyExtractor={(item) => item.id || item._id || String(Math.random())}
        ListEmptyComponent={
          searchQuery.trim() ? (
            <View style={[commonStyles.centerContent, { padding: SPACING.lg }]}>
              <Text style={styles.text}>No results found</Text>
            </View>
          ) : (
            <View style={[commonStyles.centerContent, { padding: SPACING.lg }]}>
              <Text style={{ fontSize: 48, marginBottom: SPACING.md }}>🔍</Text>
              <Text style={styles.text}>Enter a search term and press Search</Text>
            </View>
          )
        }
      />
    </View>
  );
}
