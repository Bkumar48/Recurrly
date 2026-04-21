import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import { styled } from 'nativewind';
import { memo, type ReactNode } from 'react';

const SafeAreaView = styled(RNSafeAreaView);

const AuthLayout = memo(({ children }: { children: ReactNode }) => (
    <SafeAreaView className="auth-safe-area">
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="auth-screen"
        >
            <ScrollView
                className="auth-scroll"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View className="auth-content">{children}</View>
            </ScrollView>
        </KeyboardAvoidingView>
    </SafeAreaView>
));

AuthLayout.displayName = 'AuthLayout';

export default AuthLayout;