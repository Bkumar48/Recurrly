import { View, Text } from 'react-native';
import { memo } from 'react';

interface BrandHeaderProps {
    title: string;
    subtitle: string;
}

const BrandHeader = memo(({ title, subtitle }: BrandHeaderProps) => (
    <View className="auth-brand-block">
        <View className="auth-logo-wrap">
            <View className="auth-logo-mark">
                <Text className="auth-logo-mark-text">R</Text>
            </View>
            <View>
                <Text className="auth-wordmark">Recurrly</Text>
                <Text className="auth-wordmark-sub">SUBSCRIPTIONS</Text>
            </View>
        </View>
        <Text className="auth-title">{title}</Text>
        <Text className="auth-subtitle">{subtitle}</Text>
    </View>
));

BrandHeader.displayName = 'BrandHeader';

export default BrandHeader;