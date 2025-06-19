import { StyleSheet } from 'react-native';
import { COLORS } from "../../styles/colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  iconRow: {
    flexDirection: 'row', // 가로 방향 정렬
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '10%',
    marginBottom: 30,
    gap: 50,
  },
  icon: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  iconText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 30, // 아이콘과 발화속도 상자 간 간격
  },
  resultBox: {
    backgroundColor: '#FFD8A9',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 10,
    width: '70%', // 적당히 폭 조정
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContent: {
    marginTop: 30,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    height: 50,
  },
  feedbackText: {
    color: '#E74C3C',
    fontSize: 16,
    marginTop: 8,
    fontWeight: 'bold',
  },
  imageContainer: {
    width: '100%',
  },
  graphImage: {
    height: 250,
    resizeMode: 'contain',
  },
});
