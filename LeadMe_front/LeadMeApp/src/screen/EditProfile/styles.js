import { StyleSheet } from "react-native";
import { COLORS } from "../../styles/colors"; 

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width : '100%',
    backgroundColor: COLORS.inputBackground,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  picker: {
    width : '100%',
    backgroundColor: COLORS.white,
    marginBottom: 20,
    borderRadius: 12,
  },
  applyBtn: {
    width : '100%',
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyText: {
    color: COLORS.primaryText,
    fontWeight: 'bold',
  },
  error: {
    color: COLORS.errorText,
    marginBottom: 10,
    marginLeft: 5,
    fontSize: 12,
  },
});
