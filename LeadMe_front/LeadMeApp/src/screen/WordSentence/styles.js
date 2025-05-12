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
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: 10,
    textAlign: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '70%',  // 아이콘 그룹 가로폭
    marginTop: 150,
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
    backgroundColor: COLORS.redBox,
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
