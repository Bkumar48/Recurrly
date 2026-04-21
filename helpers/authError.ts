import { Platform } from 'react-native';

/* ---------- Validation constants ---------- */

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;

/* ---------- Friendly error mapping ---------- */

type ClerkLikeError = {
    code?: string;
    message?: string;
    longMessage?: string;
};

/**
 * Maps Clerk error codes and messages to user-friendly strings.
 */
export const getFriendlyError = (error: unknown): string => {
    if (!error) return 'Something went wrong. Please try again.';

    const err = error as ClerkLikeError;

    switch (err.code) {
        case 'form_identifier_not_found':
            return 'No account found with this email.';
        case 'form_password_incorrect':
        case 'form_password_validation_failed':
            return 'Incorrect password. Please try again.';
        case 'form_identifier_exists':
            return 'An account with this email already exists.';
        case 'form_password_pwned':
            return 'This password has been found in a data breach. Please choose another.';
        case 'form_password_length_too_short':
            return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
        case 'form_code_incorrect':
        case 'verification_failed':
            return 'Invalid verification code. Please try again.';
        case 'verification_expired':
            return 'Verification code expired. Please request a new one.';
        case 'too_many_requests':
        case 'rate_limit_exceeded':
            return 'Too many attempts. Please wait a moment and try again.';
        case 'network_error':
            return 'Network error. Please check your connection.';
        default:
            return err.longMessage || err.message || 'Something went wrong. Please try again.';
    }
};

/* ---------- Post-auth navigation ---------- */

/**
 * Handles Clerk's decorateUrl result.
 *
 * Key insight: on NATIVE we do NOT call router.replace here.
 * After Clerk's session is set, <ClerkProvider> re-renders,
 * and the `(auth)/_layout.tsx` `<Redirect href="/(tabs)" />` fires automatically.
 * Calling router.replace from finalize() races that redirect and throws
 * "The action 'REPLACE' ... was not handled by any navigator" because only
 * the (auth) stack is mounted at that moment.
 *
 * On WEB, decorateUrl may return an absolute http(s) URL (SSO flows).
 * In that case we MUST navigate via window.location so Clerk's cookies
 * are set on the correct origin — the router can't handle it.
 */
export const navigateAfterAuth = (decorateUrl: (path: string) => string) => {
    const url = decorateUrl('/(tabs)');

    if (Platform.OS === 'web' && url.startsWith('http') && typeof window !== 'undefined') {
        window.location.href = url;
        return;
    }

    // Native: no-op. The (auth)/_layout.tsx Redirect handles navigation
    // once the Clerk session flips isSignedIn to true.
};