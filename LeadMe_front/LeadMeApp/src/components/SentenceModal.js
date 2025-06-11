import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

const SentenceModal = ({ visible, onClose }) => {
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
            <Text style={styles.title}>문장 발화 연습 사용 방법</Text>
            <Text style={styles.text}>1. 화면에 문장이 제공됩니다. 사용자의 연령에 따라 적절한 문장이 선택됩니다.</Text>
            <Text style={styles.text}>2. 왼쪽 아래 스피커 아이콘을 눌러 평균 속도의 예시 발화 음성을 들어보세요.</Text>
            <Text style={styles.text}>3. 오른쪽에서 원하는 발화 속도를 선택하세요. (현재 발화 속도보다 조금 느린 속도부터 시작해 점차 빠르게 연습하는 것을 추천드립니다.)</Text>
            <Text style={styles.text}>4. '연습 시작' 버튼을 누르면 노래방 효과가 시작됩니다.</Text>
            <Text style={styles.text}>5. 글자에 따라 하이라이트가 이동하는 속도에 맞춰 문장을 발화하세요.</Text>
            <Text style={styles.text}>6. '연습 종료' 버튼을 눌러 연습을 마무리하세요.</Text>
            <Text style={styles.text}>7. '재생' 버튼을 눌러 자신의 발화 음성을 들어보세요.</Text>
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

export default SentenceModal;