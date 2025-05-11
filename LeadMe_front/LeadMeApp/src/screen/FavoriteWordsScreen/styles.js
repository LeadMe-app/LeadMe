import { StyleSheet } from "react-native";
import {COLORS} from "../../styles/colors";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      },
      title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
      },
      empty: {
        fontSize: 18,
        color: '#888',
      },
      wordButton: {
        backgroundColor: '#FFE5B4',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginVertical: 8,
        width: '100%',           // 전체 너비
        alignItems: 'flex-start', // 왼쪽 정렬
        justifyContent: 'center',
      },
      wordText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'left', 
      },
      card: {
        backgroundColor: '#FFECB3',  // 연노랑톤
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginVertical: 8,
        width: '100%',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3, // 안드로이드용 그림자
        alignItems: 'center',
      },

      cardText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
      },
  });