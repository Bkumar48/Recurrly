import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";
import { useSignIn } from "@clerk/expo";
import { useState, useCallback, useMemo, useEffect } from "react";
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
  navigateAfterAuth,
} from "@/helpers/authError";

const getSafeErrorMessage = (error: any): string => {
  const code = error?.code;

  switch (code) {
    case "form_identifier_not_found":
    case "form_password_incorrect":
      return "Invalid email or password";

    case "too_many_requests":
      return "Too many attempts. Please try again later.";

    case "verification_failed":
      return "Invalid or expired verification code";

    default:
      return "Something went wrong. Please try again.";
  }
};

const SignIn = () => {
  const { signIn, errors, fetchStatus } = useSignIn();
  const posthog = usePostHog();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [mfaEmailSent, setMfaEmailSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const loading = fetchStatus === "fetching";

  // ⏱️ Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const { formValid } = useMemo(() => {
    const eValid = emailAddress.length > 0 && EMAIL_REGEX.test(emailAddress);
    return { formValid: eValid && password.length > 0 };
  }, [emailAddress, password]);

  const clearFormError = useCallback(() => setFormError(null), []);

  const sendMfaEmailCode = useCallback(async (): Promise<boolean> => {
    if (!signIn || !signIn.mfa) {
      setFormError("Authentication not ready. Please try again.");
      return false;
    }

    const hasEmailFactor = signIn.supportedSecondFactors?.some(
      (f) => f.strategy === "email_code"
    );

    if (!hasEmailFactor) {
      setFormError("Email verification unavailable.");
      return false;
    }

    try {
      const { error } = await signIn.mfa.sendEmailCode();

      if (error) {
        console.error("[MFA send error]", error);
        posthog.capture("mfa_send_failed", {
          error_code: error.code,
          error_message: error.message,
        });

        setFormError(getSafeErrorMessage(error));
        return false;
      }

      setMfaEmailSent(true);
      return true;
    } catch (err: any) {
      console.error("[MFA send exception]", err);
      posthog.capture("mfa_send_exception", {
        error_message: err?.message,
      });

      setFormError(getSafeErrorMessage(err));
      return false;
    }
  }, [signIn, signIn?.mfa, signIn?.supportedSecondFactors, posthog]);

  const finalizeAndTrack = useCallback(async () => {
    if (!signIn) {
      setFormError("Authentication failed.");
      return;
    }

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
  }, [signIn, signIn?.finalize, posthog]);

  const handleSubmit = useCallback(async () => {
    if (!signIn) {
      setFormError("Authentication not ready.");
      return;
    }

    if (!formValid || loading) return;

    setFormError(null);

    try {
      const { error } = await signIn.password({
        emailAddress,
        password,
      });

      if (error) {
        console.error("[SignIn error]", error);

        posthog.capture("user_sign_in_failed", {
          error_code: error.code,
          error_message: error.message,
        });

        setFormError(getSafeErrorMessage(error));
        return;
      }

      switch (signIn.status) {
        case "complete":
          await finalizeAndTrack();
          return;

        case "needs_client_trust":
          await sendMfaEmailCode();
          return;

        case "needs_second_factor":
          const hasEmailFactor = signIn.supportedSecondFactors?.some(
            (f) => f.strategy === "email_code"
          );

          if (hasEmailFactor) {
            await sendMfaEmailCode();
          } else {
            setFormError("Please complete two-factor authentication.");
          }
          return;

        default:
          setFormError("Sign-in could not be completed.");
      }
    } catch (err: any) {
      console.error("[SignIn exception]", err);

      posthog.capture("user_sign_in_exception", {
        error_message: err?.message,
      });

      setFormError(getSafeErrorMessage(err));
    }
  }, [
    signIn,
    signIn?.password,
    signIn?.status,
    signIn?.supportedSecondFactors,
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
      if (!signIn || !signIn.mfa) {
        setFormError("Verification not ready.");
        return;
      }

      setFormError(null);

      try {
        const result = await signIn.mfa.verifyEmailCode({ code });

        const verifyError = (result as any)?.error;
        if (verifyError) {
          console.error("[Verify error]", verifyError);

          posthog.capture("mfa_verify_failed", {
            error_message: verifyError.message,
          });

          setFormError(getSafeErrorMessage(verifyError));
          return;
        }

        if (signIn.status === "complete") {
          await finalizeAndTrack();
        } else {
          setFormError("Verification failed.");
        }
      } catch (err: any) {
        console.error("[Verify exception]", err);

        posthog.capture("mfa_verify_exception", {
          error_message: err?.message,
        });

        setFormError(getSafeErrorMessage(err));
      }
    },
    [signIn, signIn?.mfa, signIn?.status, finalizeAndTrack, posthog]
  );

  const handleResend = useCallback(async () => {
    if (cooldown > 0) return false;

    const success = await sendMfaEmailCode();

    if (success) {
      setCooldown(30);
    }

    return success;
  }, [sendMfaEmailCode, cooldown]);

  const handleReset = useCallback(() => {
    if (!signIn) {
      setFormError("Reset failed.");
      return;
    }

    setFormError(null);
    setMfaEmailSent(false);
    setCooldown(0);
    signIn.reset();
  }, [signIn, signIn?.reset]);

  const isMfaState =
    signIn?.status === "needs_client_trust" ||
    signIn?.status === "needs_second_factor";

  if (isMfaState) {
    return (
      <VerificationScreen
        title="Verify your identity"
        subtitle={
          mfaEmailSent
            ? "We sent a verification code to your email"
            : "Preparing verification..."
        }
        onVerify={handleVerify}
        onResend={handleResend}
        onReset={handleReset}
        loading={loading}
        error={formError || errors.fields.code?.message || null}
        clearError={clearFormError}
        resendDisabled={cooldown > 0}
        resendTimer={cooldown}
      />
    );
  }

  return (
    <AuthLayout>
      <BrandHeader
        title="Welcome back"
        subtitle="Sign in to continue"
      />

      <View className="auth-card">
        <View className="auth-form">
          <FormErrorBanner message={formError} />

          <FormField
            label="Email Address"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            placeholder="name@example.com"
            value={emailAddress}
            onChangeText={(t) => {
              setEmailAddress(t);
              if (formError) setFormError(null);
            }}
            editable={!loading}
          />

          <PasswordField
            label="Password"
            autoComplete="password"
            textContentType="password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (formError) setFormError(null);
            }}
            editable={!loading}
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
        <Text>Don&apos;t have an account?</Text>
        <Link href="/(auth)/sign-up" asChild>
          <Pressable hitSlop={8}>
            <Text>Create Account</Text>
          </Pressable>
        </Link>
      </View>
    </AuthLayout>
  );
};

export default SignIn;