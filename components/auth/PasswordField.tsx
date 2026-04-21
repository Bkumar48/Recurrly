import { Pressable, Text, TextInput } from 'react-native';
import { forwardRef, useState } from 'react';
import FormField, { type FormFieldProps } from './FormField';

type PasswordFieldProps = Omit<FormFieldProps, 'secureTextEntry' | 'rightAction'>;

const PasswordField = forwardRef<TextInput, PasswordFieldProps>((props, ref) => {
    const [visible, setVisible] = useState(false);

    return (
        <FormField
            ref={ref}
            {...props}
            secureTextEntry={!visible}
            rightAction={
                <Pressable
                    onPress={() => setVisible((v) => !v)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={visible ? 'Hide password' : 'Show password'}
                    className="auth-input-action"
                >
                    <Text className="auth-input-action-text">{visible ? 'Hide' : 'Show'}</Text>
                </Pressable>
            }
        />
    );
});

PasswordField.displayName = 'PasswordField';

export default PasswordField;