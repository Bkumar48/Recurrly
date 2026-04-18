import { posthog } from "@/lib/posthog";

export const logAuthError = (error: any, context: string) => {
  const safeError = {
    context,
    code: error?.code ?? "unknown_error",
    message: error?.message ?? "Something went wrong",
  };

  console.error("[AUTH_ERROR]", safeError);

  posthog.capture("auth_error", safeError);

  if (__DEV__) {
    console.debug("Full error (dev only):", error);
  }
};
