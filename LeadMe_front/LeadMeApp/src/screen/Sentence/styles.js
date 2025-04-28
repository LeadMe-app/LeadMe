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
    width: '70%',
    height: 40,
    backgroundColor: COLORS.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
    borderRadius: 5,
    marginLeft: 20
  },
  dropdownText: {
    color: COLORS.textGray,
  },
  topRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    width : '90%',
  },
  startButton: {
    marginTop: 30,
    width: '80%',
    height: 100,
    backgroundColor: COLORS.checkButton,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginVertical: 20,
  },
  stopButton: {
    marginTop: 30,
    width: '80%',
    height: 100,
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
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '70%',  // 아이콘 그룹 가로폭
    marginTop: 30,
  },
  
  iconWithLabel: {
    alignItems: 'center', // 아이콘과 텍스트를 수직 정렬
  },
  iconLabel: {
    marginTop: 10,
    fontSize: 20,
    color: '#333',
  },
  bottomButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    position: 'absolute',
    bottom : 20,
  },
  endButton: {
    backgroundColor: COLORS.experienceButton,
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 8,
    width: '45%',
    alignItems: 'center',
  },
  otherButton: {
    backgroundColor: '#980000',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 8,
    width: '45%',
    alignItems: 'center',
  },
  bottomButtonText: {
    color: COLORS.primaryText,
    fontWeight: 'bold',
  },
  underline: {
    height: 1.5,           // 선 두께
    backgroundColor: 'gray',  // 선 색상 (회색 계열 추천)
    marginVertical: 5,   // 위아래 여백
    width: '100%',         // 줄 길이 (원하면 퍼센트로 조절 가능)
    alignSelf: 'center',  // 가운데 정렬
  },
});

export default styles;
