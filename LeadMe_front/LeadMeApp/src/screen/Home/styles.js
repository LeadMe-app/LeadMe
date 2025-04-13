import { StyleSheet } from 'react-native';
import { COLORS } from '../../styles/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    padding: 20,
    alignItems: 'center',
  },
  welcomeBox: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  greeting: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  nickname: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  link: {
    marginTop : 10,
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign : 'center',
  },
  optionBox: {
    width: '100%',
    borderRadius: 20,
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
  questionBox: {
    backgroundColor: '#F8D7A9',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    width : 100,
  },
  questionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
});
