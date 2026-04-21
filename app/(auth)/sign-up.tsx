import { View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { useSignUp, useAuth } from '@clerk/expo';
import { useState, useCallback, useMemo } from 'react';
import { usePostHog } from 'posthog-react-native';

import AuthLayout from '@/components/auth/AuthLayout';
import BrandHeader from '@/components/auth/BrandHeader';
import FormField from '@/components/auth/FormField';
import PasswordField from '@/components/auth/PasswordField';
import FormErrorBanner from '@/components/auth/FormErrorBanner';
import VerificationScreen from '@/components/auth/VerificationScreen';
import { PrimaryButton } from '@/components/auth/Buttons';
import {
    EMAIL_REGEX,
    MIN_PASSWORD_LENGTH,
    getFriendlyError,
    navigateAfterAuth,
} from '@/helpers/authError';

const SignUp = () => {
    const { signUp, errors, fetchStatus } = useSignUp();
    const { isSignedIn } = useAuth();
    const posthog = usePostHog();

    const [emailAddress, setEmailAddress] = useState('');
    const [password, setPassword] = useState('');
    const [emailTouched, setEmailTouched] = useState(false);
    const [passwordTouched, setPasswordTouched] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const loading = fetchStatus === 'fetching';

    const { emailValid, passwordValid, formValid } = useMemo(() => {
        const eValid = emailAddress.length > 0 && EMAIL_REGEX.test(emailAddress);
        const pValid = password.length >= MIN_PASSWORD_LENGTH;
        return { emailValid: eValid, passwordValid: pValid, formValid: eValid && pValid };
    }, [emailAddress, password]);

    const emailFieldError =
        (emailTouched && emailAddress.length > 0 && !emailValid
            ? 'Please enter a valid email address'
            : null) || errors.fields.emailAddress?.message || null;

    const passwordFieldError =
        (passwordTouched && password.length > 0 && !passwordValid
            ? `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
            : null) || errors.fields.password?.message || null;

    const clearFormError = useCallback(() => setFormError(null), []);

    const handleSubmit = useCallback(async () => {
        setEmailTouched(true);
        setPasswordTouched(true);
        if (!formValid || loading) return;

        setFormError(null);

        try {
            const { error } = await signUp.password({ emailAddress, password });

            if (error) {
                console.error('[SignUp] password step failed:', JSON.stringify(error, null, 2));
                posthog.capture('user_sign_up_failed', {
                    error_code: error.code,
                    error_message: error.message,
                    step: 'password',
                });
                setFormError(getFriendlyError(error));
                return;
            }

            const { error: verificationError } = await signUp.verifications.sendEmailCode();

            if (verificationError) {
                console.error(
                    '[SignUp] sendEmailCode failed:',
                    JSON.stringify(verificationError, null, 2)
                );
                posthog.capture('user_sign_up_send_code_failed', {
                    error_code: verificationError.code,
                    error_message: verificationError.message,
                });
                setFormError(getFriendlyError(verificationError));
            }
        } catch (err) {
            console.error('[SignUp] unexpected error:', err);
            posthog.capture('user_sign_up_failed', {
                error_message: err instanceof Error ? err.message : 'unknown',
                step: 'exception',
            });
            setFormError(getFriendlyError(err));
        }
    }, [emailAddress, password, formValid, loading, signUp, posthog]);

    const handleVerify = useCallback(
        async (code: string) => {
            setFormError(null);
            try {
                const { error } = await signUp.verifications.verifyEmailCode({ code });

                if (error) {
                    console.error(
                        '[SignUp] verifyEmailCode failed:',
                        JSON.stringify(error, null, 2)
                    );
                    posthog.capture('user_sign_up_verify_failed', {
                        error_code: error.code,
                        error_message: error.message,
                    });
                    setFormError(getFriendlyError(error));
                    return;
                }

                if (signUp.status !== 'complete') {
                    console.error('[SignUp] unexpected status after verify:', signUp.status);
                    setFormError('Sign-up could not be completed. Please try again.');
                    return;
                }

                await signUp.finalize({
                    navigate: ({ session, decorateUrl }) => {
                        if (session?.currentTask) {
                            console.log('[SignUp] pending session task:', session.currentTask);
                            return;
                        }

                        const distinctId = session?.user?.id;
                        if (distinctId) {
                            posthog.identify(distinctId, {
                                $set_once: { sign_up_date: new Date().toISOString() },
                            });
                        }
                        posthog.capture('user_signed_up');

                        // Native: no-op. (auth)/_layout <Redirect> will kick in.
                        navigateAfterAuth(decorateUrl);
                    },
                });
            } catch (err) {
                console.error('[SignUp] verify exception:', err);
                posthog.capture('user_sign_up_verify_failed', {
                    error_message: err instanceof Error ? err.message : 'unknown',
                });
                setFormError(getFriendlyError(err));
            }
        },
        [signUp, emailAddress, posthog]
    );

    const handleResend = useCallback(async () => {
        setFormError(null);
        try {
            const { error } = await signUp.verifications.sendEmailCode();
            if (error) {
                console.error('[SignUp] resend failed:', JSON.stringify(error, null, 2));
                setFormError(getFriendlyError(error));
            }
        } catch (err) {
            console.error('[SignUp] resend exception:', err);
            setFormError(getFriendlyError(err));
        }
    }, [signUp]);

    if (signUp.status === 'complete' || isSignedIn) return null;

    const awaitingEmailVerification =
        signUp.status === 'missing_requirements' &&
        signUp.unverifiedFields.includes('email_address') &&
        signUp.missingFields.length === 0;

    if (awaitingEmailVerification) {
        return (
            <VerificationScreen
                title="Verify your email"
                subtitle={`We sent a verification code to ${emailAddress}`}
                onVerify={handleVerify}
                onResend={handleResend}
                loading={loading}
                error={formError || errors.fields.code?.message || null}
                clearError={clearFormError}
            />
        );
    }

    return (
        <AuthLayout>
            <BrandHeader
                title="Create your account"
                subtitle="Start tracking your subscriptions and never miss a payment"
            />

            <View className="auth-card">
                <View className="auth-form">
                    <FormErrorBanner message={formError} />

                    <FormField
                        label="Email Address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={emailAddress}
                        placeholder="name@example.com"
                        onChangeText={(t) => {
                            setEmailAddress(t);
                            if (formError) setFormError(null);
                        }}
                        onBlur={() => setEmailTouched(true)}
                        keyboardType="email-address"
                        autoComplete="email"
                        textContentType="emailAddress"
                        editable={!loading}
                        error={emailFieldError ?? undefined}
                    />

                    <PasswordField
                        label="Password"
                        value={password}
                        placeholder="Create a strong password"
                        onChangeText={(t) => {
                            setPassword(t);
                            if (formError) setFormError(null);
                        }}
                        onBlur={() => setPasswordTouched(true)}
                        autoComplete="password-new"
                        textContentType="newPassword"
                        editable={!loading}
                        error={passwordFieldError ?? undefined}
                        helper={
                            !passwordTouched && !passwordFieldError
                                ? `Minimum ${MIN_PASSWORD_LENGTH} characters required`
                                : undefined
                        }
                    />

                    <PrimaryButton
                        label="Create Account"
                        loadingLabel="Creating Account..."
                        onPress={handleSubmit}
                        loading={loading}
                        disabled={!formValid}
                    />
                </View>
            </View>

            <View className="auth-link-row">
                <Text className="auth-link-copy">Already have an account?</Text>
                <Link href="/(auth)/sign-in" asChild>
                    <Pressable hitSlop={8}>
                        <Text className="auth-link">Sign In</Text>
                    </Pressable>
                </Link>
            </View>

            <View nativeID="clerk-captcha" />
        </AuthLayout>
    );
};

export default SignUp;