import { View, Text, TextInput, type TextInputProps } from 'react-native';
import { forwardRef, type ReactNode } from 'react';

export interface FormFieldProps extends Omit<TextInputProps, 'className'> {
    label: string;
    error?: string;
    helper?: string;
    rightAction?: ReactNode;
}

const FormField = forwardRef<TextInput, FormFieldProps>(
    ({ label, error, helper, rightAction, ...inputProps }, ref) => (
        <View className="auth-field">
            <Text className="auth-label">{label}</Text>
            <View className="auth-input-wrap">
                <TextInput
                    ref={ref}
                    className={`auth-input ${error ? 'auth-input-error' : ''}`}
                    placeholderTextColor="rgba(0, 0, 0, 0.4)"
                    {...inputProps}
                />
                {rightAction}
            </View>
            {error ? (
                <Text className="auth-error">{error}</Text>
            ) : helper ? (
                <Text className="auth-helper">{helper}</Text>
            ) : null}
        </View>
    )
);

FormField.displayName = 'FormField';

export default FormField;