import { View, TextInput } from 'react-native';
import { useState, useEffect, useRef, useCallback } from 'react';

import AuthLayout from './AuthLayout';
import BrandHeader from './BrandHeader';
import FormField from './FormField';
import FormErrorBanner from './FormErrorBanner';
import { PrimaryButton, SecondaryButton } from './Buttons';

const RESEND_COOLDOWN_SECONDS = 30;
const CODE_LENGTH = 6;

interface VerificationScreenProps {
    title: string;
    subtitle: string;
    onVerify: (code: string) => Promise<void>;
    onResend: () => Promise<boolean>;
    onReset?: () => void;
    loading: boolean;
    error: string | null;
    clearError: () => void;
}

const VerificationScreen = ({
    title,
    subtitle,
    onVerify,
    onResend,
    onReset,
    loading,
    error,
    clearError,
}: VerificationScreenProps) => {
    const [code, setCode] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resending, setResending] = useState(false);
    const hasAutoSubmitted = useRef(false);
    const inputRef = useRef<TextInput>(null);

    // Cooldown ticker for resend button
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const id = setInterval(() => setResendCooldown((s) => s - 1), 1000);
        return () => clearInterval(id);
    }, [resendCooldown]);

    // Auto-focus for faster code entry
    useEffect(() => {
        const t = setTimeout(() => inputRef.current?.focus(), 100);
        return () => clearTimeout(t);
    }, []);

    const handleChangeCode = useCallback(
        (text: string) => {
            const digits = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
            setCode(digits);
            if (error) clearError();

            // Auto-submit when the full code is entered (fires once per code)
            if (digits.length === CODE_LENGTH && !hasAutoSubmitted.current && !loading) {
                hasAutoSubmitted.current = true;
                onVerify(digits);
            }
            if (digits.length < CODE_LENGTH) {
                hasAutoSubmitted.current = false;
            }
        },
        [error, clearError, loading, onVerify]
    );

    const handleVerifyPress = useCallback(() => {
        if (code.length === CODE_LENGTH) onVerify(code);
    }, [code, onVerify]);

    const handleResend = useCallback(async () => {
        if (resendCooldown > 0 || resending) return;
        setResending(true);
        try {
            const sent = await onResend();
            if (!sent) return;
            setResendCooldown(RESEND_COOLDOWN_SECONDS);
            setCode('');
            hasAutoSubmitted.current = false;
        } finally {
            setResending(false);
        }
    }, [onResend, resendCooldown, resending]);

    const resendLabel =
        resendCooldown > 0
            ? `Resend Code (${resendCooldown}s)`
            : resending
              ? 'Sending...'
              : 'Resend Code';

    return (
        <AuthLayout>
            <BrandHeader title={title} subtitle={subtitle} />

            <View className="auth-card">
                <View className="auth-form">
                    <FormErrorBanner message={error} />

                    <FormField
                        ref={inputRef}
                        label="Verification Code"
                        value={code}
                        placeholder={`Enter ${CODE_LENGTH}-digit code`}
                        onChangeText={handleChangeCode}
                        keyboardType="number-pad"
                        autoComplete="one-time-code"
                        textContentType="oneTimeCode"
                        maxLength={CODE_LENGTH}
                        editable={!loading}
                    />

                    <PrimaryButton
                        label="Verify"
                        loadingLabel="Verifying..."
                        onPress={handleVerifyPress}
                        loading={loading}
                        disabled={code.length !== CODE_LENGTH}
                    />

                    <SecondaryButton
                        label={resendLabel}
                        onPress={handleResend}
                        disabled={loading || resending || resendCooldown > 0}
                    />

                    {onReset && (
                        <SecondaryButton label="Start Over" onPress={onReset} disabled={loading} />
                    )}
                </View>
            </View>
        </AuthLayout>
    );
};

export default VerificationScreen;