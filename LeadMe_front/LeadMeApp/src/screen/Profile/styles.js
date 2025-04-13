import { StyleSheet } from 'react-native';
import { COLORS } from '../../styles/colors'; // COLORS 객체는 스타일에 필요한 색상

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  menuContainer: {
    marginTop: 20,
    width : '100%',
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 15,
    borderRadius: 5,
    backgroundColor: COLORS.boxBackground, // 예시로 배경색
  },
  menuText: {
    fontSize: 18,
    color: COLORS.textPrimary, // 텍스트 색상
  },
});
