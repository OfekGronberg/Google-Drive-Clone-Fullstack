import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SPACING } from '../styles/Theme';
import { request, getBaseUrl, getUserId, setToken, setUserId } from '../src/api/CommunicationManager';
import { useTheme } from '../src/theme/ThemeContext';

export default function Header() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Navigate to search screen
  function handleSearchPress() {
    router.push('/search');
  }

  const [menuOpen, setMenuOpen] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [userId, setUserIdState] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Open profile menu
  function handleProfilePress() {
    const currentUserId = getUserId();
    if (currentUserId) {
      setUserIdState(String(currentUserId));
    }

    if (currentUserId) {
      request({
        method: 'GET',
        path: `/api/users/${currentUserId}`,
      })
        .then((user) => {
          setName(user?.name || '');
          setUsername(user?.username || '');
          if (user?.imageUrl) {
            const baseUrl = getBaseUrl();
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
    }
    setMenuOpen(true);
  }

  function handleLogout() {
    setToken(null);
    setUserId(null);
    setMenuOpen(false);
    router.replace('/login');
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        {/* Left side: App title */}
        <TouchableOpacity onPress={() => router.push('/(tabs)')}>
          <Text style={styles.title}>MyDrive</Text>
        </TouchableOpacity>

        {/* Right side: Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={handleSearchPress} style={styles.iconButton}>
            <Text style={styles.iconText}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleProfilePress} style={styles.iconButton}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.profileImage} />
            ) : (
              <Text style={styles.iconText}>👤</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={styles.menuOverlay} onPress={() => setMenuOpen(false)}>
          <Pressable style={styles.menuCard} onPress={(event) => event.stopPropagation()}>
            <View style={styles.menuAvatar}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.menuAvatarImage} />
              ) : (
                <Text style={styles.menuAvatarText}>
                  {(name || username || 'U').charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <Text style={styles.menuName}>{name || username || '—'}</Text>
            <Text style={styles.menuUsername}>UserName: {username || name || '—'}</Text>
            <Text style={styles.menuUserId}>ID: {userId || '—'}</Text>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => {
                setMenuOpen(false);
                router.push('/profile');
              }}
            >
              <Text style={styles.menuButtonText}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => {
                setMenuOpen(false);
                router.push('/settings');
              }}
            >
              <Text style={styles.menuButtonText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuButton} onPress={handleLogout}>
              <Text style={styles.menuButtonText}>Logout</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
    },
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.primary,
    },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: SPACING.md,
  },
  iconText: {
    fontSize: 24,
  },
  profileImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
    menuCard: {
      width: '85%',
      maxWidth: 360,
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: SPACING.md,
      borderWidth: 1,
      borderColor: '#E0E0E0',
    },
    menuAvatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginBottom: SPACING.md,
    },
  menuAvatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  menuAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
    menuName: {
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    menuUsername: {
      textAlign: 'center',
      fontSize: 12,
      color: colors.secondary,
      marginBottom: SPACING.xs,
    },
    menuUserId: {
      textAlign: 'center',
      fontSize: 12,
      color: colors.secondary,
      marginBottom: SPACING.md,
    },
  menuButton: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
    menuButtonText: {
      color: colors.primary,
      fontWeight: '600',
      fontSize: 16,
    },
  });
