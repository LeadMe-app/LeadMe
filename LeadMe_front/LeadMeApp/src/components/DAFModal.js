import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';

const DAFModal = ({ visible, onClose }) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>학습 방법</Text>
          <Text style={styles.content}>
            1. 화면에 문장이 표시됩니다. (사용자 연령대에 맞춘 문장 제공){'\n\n'}
            2. 이어폰을 착용합니다. (이어폰 없이는 DAF 효과를 체험하기 어렵습니다){'\n\n'}
            3. 'DAF 시작' 버튼을 누릅니다.{'\n\n'}
            4. 화면의 문장을 따라 천천히 발화해보세요.{'\n\n'}
            {"\n"}
            🔍 *DAF(Delayed Auditory Feedback)란?{'\n'}
            본인이 말한 소리를 짧게 지연시켜 다시 들려줌으로써, 발화 속도 조절과 말더듬 완화에 도움을 주는 기술입니다.
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  content: {
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

export default DAFModal;