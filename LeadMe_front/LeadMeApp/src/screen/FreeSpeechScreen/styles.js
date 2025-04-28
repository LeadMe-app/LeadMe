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
    flexDirection: 'row',
    justifyContent: 'center',
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
  },
  resultBox: {
    backgroundColor: '#FFD8A9',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContent: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  feedbackText: {
    color: '#E74C3C',
    fontSize: 16,
    marginTop: 8,
    fontWeight: 'bold',
  },
});