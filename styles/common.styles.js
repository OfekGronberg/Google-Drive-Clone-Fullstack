import { StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS } from './Theme';

// Common shared styles that can be reused across screens.
export const commonStyles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 20,
    color: COLORS.text,
    fontFamily: FONTS.bold,
  },
});


