import { posthog } from "@/lib/posthog";

const getAuthErrorCode = (error: unknown): string => {
  if (typeof error !== "object" || error === null) {
    return "unknown_error";
  }

  const code = (error as { code?: unknown }).code;

  return typeof code === "string" && code.length > 0
    ? code
    : "unknown_error";
};

export const logAuthError = (error: unknown, context: string) => {
  const code = getAuthErrorCode(error);

  const safeError = {
    context,
    code,
    message: "Authentication failed",
  };

  console.error("[AUTH_ERROR]", safeError);

  posthog.capture("auth_error", safeError);

  if (__DEV__) {
    console.debug("Full error (dev only):", error);
  }
};