import { StyleSheet } from "react-native";
import { COLORS } from "../../styles/colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // 배경색
    paddingTop: 60,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  empty: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center', // 텍스트 중앙 정렬
    flex: 1, // 화면에서 빈 공간을 채우도록
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordButton: {
    backgroundColor: '#FFE5B4',
    flex: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 5, // 각 단어 항목 간 간격 추가
  },
  wordText: {
    fontSize: 18,
  },
  wordItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
    padding: 12,
    borderRadius: 10,
    marginBottom: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16, // 글자 크기 조정
  },
  deleteButtonContainer: {
    marginLeft: 10, // 삭제 버튼과 단어 간 간격 추가
  },
});
