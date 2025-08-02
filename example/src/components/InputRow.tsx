import {KeyboardType, Text, TextInput, View} from 'react-native';
import styles from '../screens/styles';
import React, {FC} from 'react';

interface IInputRowProps {
  label: string;
  value: string;
  onChange: (text: string) => void;
  required?: boolean;
  keyboardType?: KeyboardType;
}

export const InputRow: FC<IInputRowProps> = ({
  label,
  value,
  onChange,
  required = false,
  keyboardType = 'default',
}) => (
  <View style={styles.row} key={label}>
    <View style={styles.rowText}>
      <Text style={styles.text}>
        {label}
        {required && <Text style={styles.rowTextRequired}>*</Text>}
      </Text>
    </View>
    <TextInput
      style={[styles.textInput, styles.text]}
      value={value}
      onChangeText={onChange}
      keyboardType={keyboardType}
    />
  </View>
);
