import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';

const WordInfoModal = ({ visible, onClose }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>말더듬증 기능 설명서</Text>
          <Text style={styles.modalContent}>
            • 랜덤: 저장된 단어들이 무작위로 선택되어 발화 연습을 진행할 수 있습니다.{"\n\n"}
            • 단어 리스트: 사용자가 원하는 단어를 직접 선택하여 연습할 수 있습니다.{"\n\n"}
            • 즐겨찾기 단어: 즐겨찾기로 등록한 단어들로만 발화 연습을 진행할 수 있습니다.{"\n\n"}
            원하는 방법을 선택하여 학습을 시작해 보세요!
          </Text>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>닫기</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default WordInfoModal;
