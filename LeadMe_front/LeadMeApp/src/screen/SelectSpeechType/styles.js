import { StyleSheet } from "react-native";
import {COLORS} from "../../styles/colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center', 
    paddingHorizontal: 20,
  },
  optionBox: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 50,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: COLORS.boxShadow,
    elevation: 4,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  optionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});