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

  /**
   * Shared post-auth finalization.
   * On native we only identify/track here; navigation to (tabs) is triggered
   * by the `(auth)/_layout.tsx` <Redirect> when Clerk sets the session.
   */
  const finalizeAndTrack = useCallback(async () => {
    await signIn.finalize({
      navigate: ({ session, decorateUrl }) => {
        if (session?.currentTask) {
          console.log("[SignIn] pending session task:", session.currentTask);
          return;
        }

        const distinctId = session?.user?.id;
        if (distinctId) {
          posthog.identify(distinctId, {
            $set_once: { first_sign_in_date: new Date().toISOString() },
          });
        }
        posthog.capture("user_signed_in");

        // Native: no-op. Web: redirect via window.location for absolute URLs.
        navigateAfterAuth(decorateUrl);
      },
    });
  }, [signIn, posthog]);

  const handleSubmit = useCallback(async () => {
    setEmailTouched(true);
    setPasswordTouched(true);
    if (!formValid || loading) return;

    setFormError(null);

    try {
      const { error } = await signIn.password({ emailAddress, password });

      if (error) {
        console.error(
          "[SignIn] password step failed:",
          JSON.stringify(error, null, 2),
        );
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
          console.warn("[SignIn] MFA required but unsupported in this flow");
          setFormError(
            "Two-factor authentication is required but not yet supported.",
          );
          return;

        case "needs_client_trust": {
          const emailCodeFactor = signIn.supportedSecondFactors.find(
            (factor) => factor.strategy === "email_code",
          );
          if (!emailCodeFactor) {
            setFormError(
              "Verification is required but unavailable. Please contact support.",
            );
            return;
          }
          const { error: mfaError } = await signIn.mfa.sendEmailCode();
          if (mfaError) {
            console.error(
              "[SignIn] mfa sendEmailCode failed:",
              JSON.stringify(mfaError, null, 2),
            );
            setFormError(getFriendlyError(mfaError));
          }
          return;
        }

        default:
          console.error("[SignIn] unexpected status:", signIn.status);
          setFormError("Sign-in could not be completed. Please try again.");
      }
    } catch (err) {
      console.error("[SignIn] unexpected error:", err);
      posthog.capture("user_sign_in_failed", {
        error_message: err instanceof Error ? err.message : "unknown",
        step: "exception",
      });
      setFormError(getFriendlyError(err));
    }
  }, [
    emailAddress,
    password,
    formValid,
    loading,
    signIn,
    posthog,
    finalizeAndTrack,
  ]);

  const handleVerify = useCallback(
    async (code: string) => {
      setFormError(null);
      try {
        const result = await signIn.mfa.verifyEmailCode({ code });

        const verifyError = (
          result as { error?: { code?: string; message?: string } }
        )?.error;
        if (verifyError) {
          console.error(
            "[SignIn] verifyEmailCode failed:",
            JSON.stringify(verifyError, null, 2),
          );
          setFormError(getFriendlyError(verifyError));
          return;
        }

        if (signIn.status === "complete") {
          await finalizeAndTrack();
        } else {
          console.error("[SignIn] verify did not complete:", signIn.status);
          setFormError(
            "Verification could not be completed. Please try again.",
          );
        }
      } catch (err) {
        console.error("[SignIn] verify exception:", err);
        setFormError(getFriendlyError(err));
      }
    },
    [signIn, finalizeAndTrack],
  );

  const handleResend = useCallback(async (): Promise<boolean> => {
    setFormError(null);
    try {
      const { error } = await signIn.mfa.sendEmailCode();
      if (error) {
        console.error(
          "[SignIn] resend failed:",
          JSON.stringify(error, null, 2),
        );
        setFormError(getFriendlyError(error));
        return false;
      }
      return true;
    } catch (err) {
      console.error("[SignIn] resend exception:", err);
      setFormError(getFriendlyError(err));
      return false;
    }
  }, [signIn]);

  const handleReset = useCallback(() => {
    setFormError(null);
    signIn.reset();
  }, [signIn]);

  if (signIn.status === "needs_client_trust") {
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
            placeholder="Enter your password"
            onChangeText={(t) => {
              setPassword(t);
              if (formError) setFormError(null);
            }}
            onBlur={() => setPasswordTouched(true)}
            autoComplete="password"
            textContentType="password"
            editable={!loading}
            error={passwordFieldError ?? undefined}
          />

          <PrimaryButton
            label="Sign In"
            loadingLabel="Signing In..."
            onPress={handleSubmit}
            loading={loading}
            disabled={!formValid}
          />
        </View>
      </View>

      <View className="auth-link-row">
        <Text className="auth-link-copy">Don&apos;t have an account?</Text>
        <Link href="/(auth)/sign-up" asChild>
          <Pressable hitSlop={8}>
            <Text className="auth-link">Create Account</Text>
          </Pressable>
        </Link>
      </View>
    </AuthLayout>
  );
};

export default SignIn;
