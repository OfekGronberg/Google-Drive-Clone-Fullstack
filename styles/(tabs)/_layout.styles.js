import { StyleSheet } from 'react-native';
import { COLORS } from '../Theme';

// Styles for the main tabs layout (tab bar and headers).
export const tabsLayoutStyles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.background,
    borderTopColor: '#E0E0E0',
    borderTopWidth: 1,
  },
  tabBarLabel: {
    fontSize: 12,
    color: COLORS.text,
  },
  header: {
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    color: '#FFFFFF',
  },
});


