import { View, Text } from 'react-native';
import { memo } from 'react';

interface FormErrorBannerProps {
    message: string | null;
}

const FormErrorBanner = memo(({ message }: FormErrorBannerProps) => {
    if (!message) return null;
    return (
        <View
            className="auth-error-banner"
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
        >
            <Text className="auth-error-banner-text">{message}</Text>
        </View>
    );
});

FormErrorBanner.displayName = 'FormErrorBanner';

export default FormErrorBanner;