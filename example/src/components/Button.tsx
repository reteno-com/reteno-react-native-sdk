import React, {FC} from 'react';
import { TouchableOpacity, Text, ViewStyle } from 'react-native';
import styles from '../screens/styles';

interface IButtonProps {
    onPress: () => void;
    label: string;
    style?: ViewStyle | ViewStyle[] 
}

export const Button: FC<IButtonProps> = ({label, onPress, style}) => (
    <TouchableOpacity style={[styles.submitBtn, style]} onPress={onPress}>
        <Text style={styles.submitBtnText}>
            {label}
        </Text>
    </TouchableOpacity>
)