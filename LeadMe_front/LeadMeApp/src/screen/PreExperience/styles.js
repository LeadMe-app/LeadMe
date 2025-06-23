import {StyleSheet} from 'react-native';
import {COLORS} from "../../styles/colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  // 버튼을 가로로 배치
  buttonRow: {
    flexDirection: 'row', // 가로 방향 정렬
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '10%',
    marginBottom: 30,
    gap: 50,                   // 부모 너비의 80% 차지
  },
  buttonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  buttonText: {
    marginTop: 6,
    fontSize: 14,
    color: '#333',
  },

  speedContainer: {
    width: '80%',
    marginTop: 30,
    alignItems: 'center',
  },
  speedLabel: {
    fontSize: 16,
    fontWeight: '500',
    backgroundColor: '#FFDDAA',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    color: '#333',
  },
  speedBox: {
    marginTop: 12,
    width: '100%',
    height: 120,
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  speedPlaceholder: {
    fontSize: 18,
    color: '#AAA',
  },
  feedbackText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  // 평균 SPM 보기 아이콘 위치
  infoIconWrapper: {
    marginTop: 20,
    padding: 8,
  },
  infoIconText: {
    fontSize: 24,
    color: '#333',
  },

  // 평균 SPM 텍스트 박스
  avgSpmBox: {
    marginTop: 8,
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: '#FFDDAA',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: '70%',
    alignItems: 'center',
  },
  avgSpmText: {
    fontSize: 16,
    color: '#333',
  },

  endButton: {
    position: 'absolute',
    bottom: 40,
    width: '80%',
    height: 50,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
