import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";
import { useSignIn } from "@clerk/expo";
import { useState, useCallback, useMemo } from "react";
import { usePostHog } from "posthog-react-native";

import AuthLayout from "@/components/auth/AuthLayout";
import BrandHeader from "@/components/auth/BrandHeader";
import FormField from "@/components/auth/FormField";
import PasswordField from "@/components/auth/PasswordField";
import FormErrorBanner from "@/components/auth/FormErrorBanner";
import VerificationScreen from "@/components/auth/VerificationScreen";
import { PrimaryButton } from "@/components/auth/Buttons";
import {
  EMAIL_REGEX,
  getFriendlyError,
  navigateAfterAuth,
} from "@/helpers/authError";

const SignIn = () => {
  const { signIn, errors, fetchStatus } = useSignIn();
  const posthog = usePostHog();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [mfaEmailSent, setMfaEmailSent] = useState(false);

  const loading = fetchStatus === "fetching";

  const { emailValid, formValid } = useMemo(() => {
    const eValid = emailAddress.length > 0 && EMAIL_REGEX.test(emailAddress);
    return { emailValid: eValid, formValid: eValid && password.length > 0 };
  }, [emailAddress, password]);

  const emailFieldError =
    (emailTouched && emailAddress.length > 0 && !emailValid
      ? "Please enter a valid email address"
      : null) ||
    errors.fields.identifier?.message ||
    null;

  const passwordFieldError =
    (passwordTouched && password.length === 0
      ? "Password is required"
      : null) ||
    errors.fields.password?.message ||
    null;

  const clearFormError = useCallback(() => setFormError(null), []);


  const sendMfaEmailCode = useCallback(async (): Promise<boolean> => {
    if (!signIn) return false;

    const emailFactor = signIn.supportedSecondFactors?.find(
      (factor) => factor.strategy === "email_code",
    );

    if (!emailFactor) {
      setFormError(
        "Email verification is required but unavailable. Please contact support.",
      );
      return false;
    }

    const { error } = await signIn.mfa.sendEmailCode();

    if (error) {
      setFormError(getFriendlyError(error));
      return false;
    }

    // ✅ Let Clerk update status first, then UI reacts naturally
    setMfaEmailSent(true);

    return true;
  }, [signIn]);

  const finalizeAndTrack = useCallback(async () => {
    if (!signIn) return;

    await signIn.finalize({
      navigate: ({ session, decorateUrl }) => {
        if (session?.currentTask) return;

        const distinctId = session?.user?.id;
        if (distinctId) {
          posthog.identify(distinctId, {
            $set_once: { first_sign_in_date: new Date().toISOString() },
          });
        }

        posthog.capture("user_signed_in");
        navigateAfterAuth(decorateUrl);
      },
    });
  }, [signIn, posthog]);

  const handleSubmit = useCallback(async () => {
    if (!signIn) return;

    setEmailTouched(true);
    setPasswordTouched(true);
    if (!formValid || loading) return;

    setFormError(null);

    try {
      const { error } = await signIn.password({
        emailAddress,
        password,
      });

      if (error) {
        posthog.capture("user_sign_in_failed", {
          error_code: error.code,
          error_message: error.message,
          step: "password",
        });
        setFormError(getFriendlyError(error));
        return;
      }

      switch (signIn.status) {
        case "complete":
          await finalizeAndTrack();
          return;

        case "needs_second_factor":
        case "needs_client_trust":
          await sendMfaEmailCode();
          return;

        default:
          setFormError("Sign-in could not be completed. Please try again.");
      }
    } catch (err) {
      setFormError(getFriendlyError(err));
    }
  }, [
    signIn,
    emailAddress,
    password,
    formValid,
    loading,
    posthog,
    finalizeAndTrack,
    sendMfaEmailCode,
  ]);

  const handleVerify = useCallback(
    async (code: string) => {
      if (!signIn) return;

      setFormError(null);

      try {
        const result = await signIn.mfa.verifyEmailCode({ code });

        const verifyError = (result as any)?.error;
        if (verifyError) {
          setFormError(getFriendlyError(verifyError));
          return;
        }

        if (signIn.status === "complete") {
          await finalizeAndTrack();
        } else {
          setFormError("Verification could not be completed.");
        }
      } catch (err) {
        setFormError(getFriendlyError(err));
      }
    },
    [signIn, finalizeAndTrack],
  );

  const handleResend = useCallback(async () => {
    setFormError(null);
    return await sendMfaEmailCode();
  }, [sendMfaEmailCode]);

  const handleReset = useCallback(() => {
    if (!signIn) return;

    setFormError(null);
    setMfaEmailSent(false);
    signIn.reset();
  }, [signIn]);

  // ✅ FIXED: strict UI gate (no race condition)
  const isMfaState =
    signIn?.status === "needs_client_trust" ||
    signIn?.status === "needs_second_factor";

  if (mfaEmailSent && isMfaState) {
    return (
      <VerificationScreen
        title="Verify your identity"
        subtitle="We sent a verification code to your email"
        onVerify={handleVerify}
        onResend={handleResend}
        onReset={handleReset}
        loading={loading}
        error={formError || errors.fields.code?.message || null}
        clearError={clearFormError}
      />
    );
  }

  return (
    <AuthLayout>
      <BrandHeader
        title="Welcome back"
        subtitle="Sign in to continue managing your subscriptions"
      />

      <View className="auth-card">
        <View className="auth-form">
          <FormErrorBanner message={formError} />

          <FormField
            label="Email Address"
            value={emailAddress}
            onChangeText={(t) => setEmailAddress(t)}
            onBlur={() => setEmailTouched(true)}
            editable={!loading}
            error={emailFieldError ?? undefined}
          />

          <PasswordField
            label="Password"
            value={password}
            onChangeText={(t) => setPassword(t)}
            onBlur={() => setPasswordTouched(true)}
            editable={!loading}
            error={passwordFieldError ?? undefined}
          />

          <PrimaryButton
            label="Sign In"
            onPress={handleSubmit}
            loading={loading}
            disabled={!formValid}
          />
        </View>
      </View>

      <View className="auth-link-row">
        <Text>Don't have an account?</Text>
        <Link href="/(auth)/sign-up" asChild>
          <Pressable>
            <Text>Create Account</Text>
          </Pressable>
        </Link>
      </View>
    </AuthLayout>
  );
};

export default SignIn;
