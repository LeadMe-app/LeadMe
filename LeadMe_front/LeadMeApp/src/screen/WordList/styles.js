import { StyleSheet } from "react-native";
import { COLORS } from "../../styles/colors"; 

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // 배경색
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  optionBox: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 30,
    alignItems: 'center',
    shadowColor: COLORS.boxShadow,
    elevation: 4,
    marginBottom: 30,
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
});