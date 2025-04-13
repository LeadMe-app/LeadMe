import { StyleSheet } from "react-native";
import { COLORS } from "../../styles/colors"; 

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center', 
    paddingHorizontal: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 50,
  },
  optionBox: {
    width: '48%',
    borderRadius: 16,
    paddingVertical: 60,
    alignItems: 'center',
    shadowColor: COLORS.boxShadow,
    elevation: 4,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  fullWidthBox: {
    width: '100%',
    backgroundColor: COLORS.boxBackground,
    borderRadius: 16,
    paddingVertical: 40,
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: COLORS.boxShadow,
    elevation: 2,
  },
  fullWidthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
});