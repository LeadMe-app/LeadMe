import { StyleSheet } from 'react-native';
import { COLORS } from '../../styles/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.headingText,
    marginTop: 10,
    marginBottom: 20,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    borderRadius: 5,
    backgroundColor: COLORS.white,
    marginBottom: 20,
    maxHeight: '70%',
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: COLORS.borderGray,
    backgroundColor: COLORS.inputBackground,
  },
  headerCell: {
    flex: 1,
    padding: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    color: COLORS.textPrimary,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: COLORS.borderGray,
  },
  cell: {
    flex: 1,
    padding: 10,
    textAlign: 'center',
    color: COLORS.textPrimary,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: COLORS.textGray,
  },
  backButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
});
