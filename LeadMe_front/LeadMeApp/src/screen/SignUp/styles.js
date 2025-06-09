import { StyleSheet } from "react-native";
import { COLORS } from "../../styles/colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 16,
    color: COLORS.headingText,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    marginVertical: 6,
  },
  inputWithButton: {
    flex: 1,
    backgroundColor: COLORS.inputBackground,
    padding: 12,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  checkBtn: {
    backgroundColor: COLORS.checkButton,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  checkText: {
    color: COLORS.headingText,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    backgroundColor: COLORS.inputBackground,
    padding: 12,
    borderRadius: 12,
    marginVertical: 6,
  },
  dropdownWrapper: {
    width: '100%',
    backgroundColor: COLORS.primaryText,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    marginVertical: 6,
    overflow: 'hidden',
  },
  dropdown: {
    width: '100%',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    padding: 14,
    width: '100%',
    borderRadius: 12,
    alignItems: 'center',
  },
  submitText: {
    color: COLORS.primaryText,
    fontWeight: 'bold',
  },
  error: {
    color: COLORS.errorText,
    fontSize: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  success: {
    color: COLORS.successText,
    fontSize: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
});
