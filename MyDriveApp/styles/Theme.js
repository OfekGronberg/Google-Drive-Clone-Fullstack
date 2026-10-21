import { StyleSheet } from 'react-native';

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
};

export function createAppStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: SPACING.lg,
    },
    input: {
      width: '100%',
      padding: SPACING.md,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      borderRadius: 4,
      marginBottom: SPACING.md,
      fontSize: 16,
      color: colors.text,
    },
    button: {
      backgroundColor: colors.primary,
      padding: SPACING.md,
      borderRadius: 4,
      alignItems: 'center',
      width: '100%',
    },
    buttonText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
      fontSize: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: SPACING.lg,
      textAlign: 'center',
    },
    text: {
      fontSize: 16,
      color: colors.text,
    },
  });
}
