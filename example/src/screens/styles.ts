import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
    justifyContent: 'center',
  },
  eventsContainer: {
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    gap: 8,
  },
  eventsTitle: {
    color: '#111827',
    fontWeight: '600',
  },
  eventsEmpty: {
    color: '#6B7280',
  },
  eventItem: {
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  eventName: {
    color: '#111827',
    fontWeight: '500',
  },
  eventNameError: {
    color: '#B42318',
    fontWeight: '500',
  },
  eventPayload: {
    color: '#374151',
    marginTop: 2,
    fontSize: 12,
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
