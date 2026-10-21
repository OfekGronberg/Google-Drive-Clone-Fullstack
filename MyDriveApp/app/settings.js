import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { createAppStyles, SPACING } from '../styles/Theme';
import { createCommonStyles } from '../styles/common.styles';
import * as ImagePicker from 'expo-image-picker';
import { request, getBaseUrl, getUserId, setToken, setUserId } from '../src/api/CommunicationManager';
import { useTheme } from '../src/theme/ThemeContext';
import { validatePassword, validateUsername } from '../src/validation/authValidation';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, theme: activeTheme, setTheme: setThemeContext } = useTheme();
  const styles = useMemo(() => createAppStyles(colors), [colors]);
  const commonStyles = useMemo(() => createCommonStyles(colors), [colors]);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState(activeTheme);
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
          if (user?.theme) {
            setTheme(user.theme);
            setThemeContext(user.theme);
          }
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

  // Handle theme change (auto-save)
  async function handleThemeChange(newTheme) {
    const previousTheme = theme;
    setTheme(newTheme);
    setThemeContext(newTheme);

    const userId = getUserId();
    if (!userId) {
      return;
    }

    try {
      const updated = await request({
        method: 'PATCH',
        path: `/api/users/${userId}`,
        body: { theme: newTheme },
      });

      if (updated?.theme) {
        setTheme(updated.theme);
        setThemeContext(updated.theme);
      }
    } catch (error) {
      setTheme(previousTheme);
      setThemeContext(previousTheme);
      Alert.alert('Error', error.message || 'Failed to save theme');
    }
  }

  async function handleSave() {
    const userId = getUserId();
    if (!userId) {
      Alert.alert('Error', 'Not logged in');
      return;
    }

    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    if (!username.trim()) {
      Alert.alert('Error', 'Username is required');
      return;
    }

    const trimmedUsername = username.trim();
    const trimmedPassword = newPassword.trim();

    const validationErrors = [
      ...validateUsername(trimmedUsername),
      ...(trimmedPassword ? validatePassword(trimmedPassword) : []),
    ];

    if (validationErrors.length > 0) {
      Alert.alert('Error', validationErrors.join('\n'));
      return;
    }

    const patch = {
      name: name.trim(),
      username: trimmedUsername,
      theme,
    };

    if (trimmedPassword) {
      patch.password = trimmedPassword;
    }

    if (imageUrl) {
      patch.imageUrl = imageUrl;
    }

    setSaving(true);
    try {
      const updated = await request({
        method: 'PATCH',
        path: `/api/users/${userId}`,
        body: patch,
      });
      setNewPassword('');
      if (updated) {
        setName(updated?.name || name.trim());
        setUsername(updated?.username || username.trim());
        if (updated?.theme) {
          setTheme(updated.theme);
          setThemeContext(updated.theme);
        }
        if (updated?.imageUrl) {
          const baseUrl = getBaseUrl();
          const rawUrl = updated.imageUrl;
          setImageUrl(rawUrl.startsWith('/') ? `${baseUrl}${rawUrl}` : rawUrl);
        }
      }
      Alert.alert('Success', 'Settings saved');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  async function uploadImage(asset) {
    if (!asset || !asset.base64) {
      Alert.alert('Error', 'Could not read image');
      return;
    }

    const mimeType = asset.mimeType || 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${asset.base64}`;

    try {
      const result = await request({
        method: 'POST',
        path: '/api/images',
        body: {
          image: dataUrl,
          filename: asset.fileName || 'profile.jpg',
        },
      });

      const baseUrl = getBaseUrl();
      const fullUrl = result?.url ? `${baseUrl}${result.url}` : '';
      if (!fullUrl) {
        Alert.alert('Error', 'Image upload failed');
        return;
      }

      setImageUrl(fullUrl);
      Alert.alert('Success', 'Profile image uploaded');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to upload image');
    }
  }

  async function handlePickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Error', 'Permission to access photos is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.8,
    });

    if (result.canceled) {
      return;
    }

    await uploadImage(result.assets[0]);
  }

  async function handleTakePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Error', 'Permission to use camera is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.8,
    });

    if (result.canceled) {
      return;
    }

    await uploadImage(result.assets[0]);
  }

  // Handle logout
  function handleLogout() {
    setToken(null);
    setUserId(null);
    router.replace('/login');
  }

  return (
    <ScrollView
      style={commonStyles.screenContainer}
      contentContainerStyle={{ paddingBottom: SPACING.lg * 3 }}
    >
      <Text style={commonStyles.title}>Settings</Text>

      {/* Profile photo */}
      <View style={{ marginBottom: SPACING.lg, alignItems: 'center' }}>
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: SPACING.md,
            overflow: 'hidden',
          }}
        >
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={{ width: 96, height: 96 }} />
          ) : (
            <Text style={{ color: '#FFFFFF', fontSize: 32, fontWeight: 'bold' }}>
              {(name || username || 'U').charAt(0).toUpperCase()}
            </Text>
          )}
        </View>

        <View style={{ flexDirection: 'row', width: '100%' }}>
          <TouchableOpacity
            style={[styles.button, { flex: 1, marginRight: SPACING.md }]}
            onPress={handlePickImage}
          >
            <Text style={styles.buttonText}>Choose Image</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { flex: 1 }]}
            onPress={handleTakePhoto}
          >
            <Text style={styles.buttonText}>Take Photo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Name section */}
      <View style={{ marginBottom: SPACING.lg }}>
        <Text style={{ fontSize: 16, fontWeight: '500', color: colors.text, marginBottom: SPACING.md }}>
          Name
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
          editable={true}
        />
        <Text style={{ fontSize: 12, color: colors.secondary, marginTop: 4 }}>
          Name can be changed
        </Text>
      </View>

      {/* Username section */}
      <View style={{ marginBottom: SPACING.lg }}>
        <Text style={{ fontSize: 16, fontWeight: '500', color: colors.text, marginBottom: SPACING.md }}>
          Username
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          editable={true}
        />
        <Text style={{ fontSize: 12, color: colors.secondary, marginTop: 4 }}>
          Username can be changed
        </Text>
      </View>

      {/* Password section */}
      <View style={{ marginBottom: SPACING.lg }}>
        <Text style={{ fontSize: 16, fontWeight: '500', color: colors.text, marginBottom: SPACING.md }}>
          Password
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={false}
        />
        <Text style={{ fontSize: 12, color: colors.secondary, marginTop: 4 }}>
          Current password is not shown
        </Text>
      </View>

      <View style={{ marginBottom: SPACING.lg }}>
        <Text style={{ fontSize: 16, fontWeight: '500', color: colors.text, marginBottom: SPACING.md }}>
          New Password
        </Text>
        <TextInput
          style={styles.input}
          placeholder="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />
      </View>
      <TouchableOpacity
        style={[styles.button, { opacity: saving ? 0.7 : 1 }]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save Settings'}</Text>
      </TouchableOpacity>


      {/* Theme section */}
      <View style={{ marginBottom: SPACING.lg }}>
        <Text style={{ fontSize: 16, fontWeight: '500', color: colors.text, marginBottom: SPACING.md }}>
          Theme
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md }}>
          <TouchableOpacity
            style={{
              flex: 1,
              minWidth: '30%',
              padding: SPACING.md,
              borderRadius: 4,
              borderWidth: 2,
              borderColor: theme === 'light' ? colors.primary : '#E0E0E0',
              backgroundColor: theme === 'light' ? '#E3F2FD' : colors.background,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => handleThemeChange('light')}
          >
            <Text style={{ fontSize: 20, marginBottom: SPACING.xs }}>☀️</Text>
            <Text style={{ color: theme === 'light' ? colors.primary : colors.text, fontWeight: 'bold', textAlign: 'center' }}>
              Light Theme
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              minWidth: '30%',
              padding: SPACING.md,
              borderRadius: 4,
              borderWidth: 2,
              borderColor: theme === 'dark' ? colors.primary : '#E0E0E0',
              backgroundColor: theme === 'dark' ? '#E3F2FD' : colors.background,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => handleThemeChange('dark')}
          >
            <Text style={{ fontSize: 20, marginBottom: SPACING.xs }}>🌙</Text>
            <Text style={{ color: theme === 'dark' ? colors.primary : colors.text, fontWeight: 'bold', textAlign: 'center' }}>
              Dark Theme
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              minWidth: '30%',
              padding: SPACING.md,
              borderRadius: 4,
              borderWidth: 2,
              borderColor: theme === 'bball' ? colors.primary : '#E0E0E0',
              backgroundColor: theme === 'bball' ? '#E3F2FD' : colors.background,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => handleThemeChange('bball')}
          >
            <Text style={{ fontSize: 20, marginBottom: SPACING.xs }}>🏀</Text>
            <Text style={{ color: theme === 'bball' ? colors.primary : colors.text, fontWeight: 'bold', textAlign: 'center' }}>
              Bball Theme
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout button */}
      <TouchableOpacity
        style={{
          backgroundColor: colors.danger,
          padding: SPACING.md,
          borderRadius: 4,
          alignItems: 'center',
          marginTop: SPACING.lg,
          marginBottom: SPACING.lg,
        }}
        onPress={handleLogout}
      >
        <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
