import { StyleSheet } from 'react-native';
import {COLORS} from "../../styles/colors";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center', 
        paddingHorizontal: 20,
      },
  sentence: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  sentenceActive: {
    color: COLORS.errorText,
  },
  dropdown: {
    width: '80%',
    height: 40,
    backgroundColor: COLORS.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
    borderRadius: 5,
  },
  dropdownText: {
    color: COLORS.textGray,
  },
  startButton: {
    width: '70%',
    height: 85,
    backgroundColor: COLORS.checkButton,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginVertical: 20,
  },
  stopButton: {
    width: '70%',
    height: 85,
    backgroundColor: COLORS.blue,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginVertical: 20,
  },
  practiceButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  iconContainer: {
    flexDirection: 'row',
    marginVertical: 20,
    width: '50%',
    justifyContent: 'space-around',
  },
  
  bottomButtons: {
    flexDirection: 'row',
    marginTop: 30,
    width: '80%',
    justifyContent: 'space-around',
  },
  endButton: {
    backgroundColor: COLORS.experienceButton,
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  otherButton: {
    backgroundColor: '#980000',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  bottomButtonText: {
    color: COLORS.primaryText,
    fontWeight: 'bold',
  },
});

export default styles;
