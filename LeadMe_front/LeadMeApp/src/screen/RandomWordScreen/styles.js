import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF3E0',
    paddingTop: 60,
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 200,
    marginVertical: 20,
    resizeMode: 'contain',
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  wordText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginRight: 8,
  },
  star: {
    fontSize: 26,
  },
  practiceButton: {
    backgroundColor: '#ADD8E6',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 15,
    marginBottom: 30,
  },
  practiceText: {
    fontSize: 18,
    color: '#000',
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  homeButton: {
    backgroundColor: 'green',
    flex: 1,
    padding: 15,
    borderRadius: 15,
    marginRight: 10,
  },
  nextButton: {
    backgroundColor: 'tomato',
    flex: 1,
    padding: 15,
    borderRadius: 15,
    marginLeft: 10,
  },
  bottomButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
