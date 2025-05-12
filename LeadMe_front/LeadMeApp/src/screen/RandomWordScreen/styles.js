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
  image: {
    width: 200,
    height: 200,
    marginVertical: 16,
    resizeMode: 'contain',
  },
  wordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  wordText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginRight: 8,
    marginLeft: 15,
  },
  starIcon: {
    marginTop: 7,
  },
  practiceButton: {
    backgroundColor: COLORS.blue,
    paddingVertical: 12,
    paddingHorizontal: 60,
    borderRadius: 10,
    marginBottom: 30,
  },
  practiceButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    position: 'absolute',
    bottom: 30,
    paddingHorizontal: 20,
  },
  navButton: {
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    backgroundColor: COLORS.experienceButton,
  },
  nextButton: {
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    backgroundColor: COLORS.redBox,
  },
  navButtonText: {
    fontSize: 14,
    color: COLORS.primaryText,
    fontWeight: 'bold',
  },
});
