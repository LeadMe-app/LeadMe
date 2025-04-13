import { StyleSheet } from 'react-native';
import { COLORS } from '../../styles/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: COLORS.inputBackground,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginVertical: 8,
  },
  errorText: {
    color: COLORS.errorText,
    fontSize: 14,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  loginButton: {
    width: '100%',
    height: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginVertical: 10,
  },
  loginButtonText: {
    color: COLORS.primaryText,
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginVertical: 5, 
  },
  linkText: {
    color: COLORS.textGray,
    fontSize: 13,
  },
  experienceButton: {
    width: '50%',
    height: 50,
    backgroundColor: COLORS.experienceButton,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 50,
  },
  experienceButtonText: {
    color: COLORS.primaryText,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
