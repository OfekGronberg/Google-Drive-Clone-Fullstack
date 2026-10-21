import { StyleSheet } from 'react-native';
import { SPACING } from './Theme';

export function createCommonStyles(colors) {
  return StyleSheet.create({
    safeAreaContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    screenContainer: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: SPACING.lg,
    },
    titleText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
  });
}

