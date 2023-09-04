import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
    justifyContent: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    paddingLeft: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  rowText: {
    flex: 0.45,
    paddingVertical: 20,
  },
  rowTextRequired: {
    color: 'red',
  },
  textInput: {
    flex: 1,
    height: '100%',
  },
  submitBtn: {
    borderColor: '#EBEBEB',
    borderWidth: 1,
    borderRadius: 5,
    alignItems: 'center',
    paddingVertical: 20,
  },
  submitBtnText: {
    color: '#000',
  },
  text: {
    color: '#000',
  },
});
