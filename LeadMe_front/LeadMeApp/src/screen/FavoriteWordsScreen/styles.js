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
        padding: 16,
        marginVertical: 8,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
      },
      wordText: {
        fontSize: 18,
      },
  });