import { Pressable, Text } from 'react-native';
import { memo } from 'react';

interface PrimaryButtonProps {
    label: string;
    loadingLabel?: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
}

export const PrimaryButton = memo(
    ({ label, loadingLabel, onPress, loading, disabled }: PrimaryButtonProps) => {
        const isDisabled = disabled || loading;
        return (
            <Pressable
                className={`auth-button ${isDisabled ? 'auth-button-disabled' : ''}`}
                onPress={onPress}
                disabled={isDisabled}
                accessibilityRole="button"
                accessibilityState={{ disabled: isDisabled, busy: loading }}
            >
                <Text className="auth-button-text">
                    {loading ? loadingLabel ?? 'Loading...' : label}
                </Text>
            </Pressable>
        );
    }
);
PrimaryButton.displayName = 'PrimaryButton';

interface SecondaryButtonProps {
    label: string;
    onPress: () => void;
    disabled?: boolean;
}

export const SecondaryButton = memo(({ label, onPress, disabled }: SecondaryButtonProps) => (
    <Pressable
        className="auth-secondary-button"
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
    >
        <Text className="auth-secondary-button-text">{label}</Text>
    </Pressable>
));
SecondaryButton.displayName = 'SecondaryButton';