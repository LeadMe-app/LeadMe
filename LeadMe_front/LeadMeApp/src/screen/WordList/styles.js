import { StyleSheet } from "react-native";
import { COLORS } from "../../styles/colors"; 

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // 배경색
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  optionBox: {
    flex: 0.48,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: COLORS.boxShadow, // 그림자 색상
    elevation: 4,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary, // 제목 텍스트 색상
    marginBottom: 8,
  },
  optionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary, // 서브 텍스트 색상
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginBottom: 20,
  },
});