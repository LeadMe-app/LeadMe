import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

const HyperModal = ({ visible, onClose }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
            <ScrollView>
                <Text style={styles.title}>음성 피로도 분석 결과 해석 - 1분 이상의 음성</Text>

                <Text style={styles.title}>📊 그래프 읽는 방법</Text>

                <Text style={styles.text}>기본 구조:</Text>
                <Text style={styles.text}>- X축 (가로): 발화 구간 번호 (1~12구간)</Text>
                <Text style={styles.text}>- Y축 (세로): SPM (Syllables Per Minute, 분당 음절 수)</Text>
                <Text style={styles.text}>- 파란색 선: 각 구간별 발화 속도 변화</Text>

                <Text style={styles.title}>🎯 핵심 수치</Text>
                <Text style={styles.text}>- 전기 평균: 초기 구간 (1~4구간)의 평균 발화 속도</Text>
                <Text style={styles.text}>- 중기 평균: 중간 구간 (5~8구간)의 평균 발화 속도</Text>
                <Text style={styles.text}>- 말기 평균: 후반 구간 (9~12구간)의 평균 발화 속도</Text>
                <Text style={styles.text}>- 변화율: 초기 대비 후반 구간의 속도 변화 비율</Text>

                <Text style={styles.title}>📈 피로도 판단 기준</Text>
                <Text style={styles.text}>- 변화율 5% 이하: 안정적 발화 (정상)</Text>
                <Text style={styles.text}>- 변화율 5% 초과: 피로 감지됨 (주의 필요)</Text>

                <Text style={styles.title}>🔍 그래프 패턴 해석</Text>
                <Text style={styles.text}>정상 패턴:</Text>
                <Text style={styles.text}>- 전체적으로 일정한 속도 유지</Text>
                <Text style={styles.text}>- 구간별 변화가 크지 않음</Text>
                <Text style={styles.text}>- 후반부에도 안정적인 발화 속도</Text>

                <Text style={styles.text}>피로 패턴:</Text>
                <Text style={styles.text}>- 후반부로 갈수록 발화 속도 감소</Text>
                <Text style={styles.text}>- 중간에 급격한 속도 변화</Text>
                <Text style={styles.text}>- 불규칙한 패턴 반복</Text>

                <Text style={styles.title}>💡 추가 정보</Text>
                <Text style={styles.text}>- 전기 구간 (1~4): 연한 녹색 배경</Text>
                <Text style={styles.text}>- 중기 구간 (5~8): 연한 노란색 배경</Text>
                <Text style={styles.text}>- 말기 구간 (9~12): 연한 빨간색 배경</Text>
                
            </ScrollView>

          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>닫기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default HyperModal;