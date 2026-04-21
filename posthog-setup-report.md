# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into Recurrly. The following changes were made:

- **`lib/posthog.ts`** — Created a PostHog client singleton that reads configuration from `expo-constants` extras (sourced from `app.config.js` which reads `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` from `.env`). Includes app lifecycle event capture, batching, and feature flag support.
- **`app/_layout.tsx`** — Added `PostHogProvider` wrapping the app, with autocapture enabled for touch events. Added a `RootLayoutNav` component that tracks screen changes via `usePathname` / `useGlobalSearchParams` and calls `posthog.screen()` on each navigation.
- **`app/Onboarding.tsx`** — Added `onboarding_viewed` event on mount.
- **`app/subscriptions/[id].tsx`** — Added `subscription_detail_viewed` event on mount, with `subscription_id` property.
- **`app/(tabs)/insights.tsx`** — Added `insights_viewed` event on mount.
- **`.env`** — Added `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` environment variables (already covered by `.gitignore`).

The following events were already implemented prior to this integration and were left untouched:
`user_signed_in`, `user_sign_in_failed`, `user_signed_up`, `user_sign_up_failed`, `user_signed_out` — all with PostHog `identify()` calls on auth events.

## Events

| Event | Description | File |
|---|---|---|
| `onboarding_viewed` | User lands on the onboarding screen — top of the acquisition funnel | `app/Onboarding.tsx` |
| `subscription_detail_viewed` | User opens a subscription detail page to review or manage a subscription | `app/subscriptions/[id].tsx` |
| `insights_viewed` | User navigates to the Insights tab — indicates engagement with spending analytics | `app/(tabs)/insights.tsx` |
| `user_signed_up` | User completes sign-up and email verification | `app/(auth)/sign-up.tsx` |
| `user_sign_up_failed` | Sign-up attempt failed | `app/(auth)/sign-up.tsx` |
| `user_signed_in` | User successfully signs in | `app/(auth)/sign-in.tsx` |
| `user_sign_in_failed` | Sign-in attempt failed | `app/(auth)/sign-in.tsx` |
| `user_signed_out` | User signs out | `app/(tabs)/settings.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](https://us.posthog.com/project/386062/dashboard/1479341)
- [Sign-up Funnel](https://us.posthog.com/project/386062/insights/duvDVuq9) — Conversion from onboarding to completed sign-up
- [Daily Sign-ins](https://us.posthog.com/project/386062/insights/JWB6LyCR) — Trend of successful sign-ins over time
- [User Churn (Sign-outs)](https://us.posthog.com/project/386062/insights/jot3HL4v) — Sign-out trends as a churn signal
- [Auth Failures](https://us.posthog.com/project/386062/insights/AOqVqqmB) — Sign-in and sign-up error rates
- [Feature Engagement](https://us.posthog.com/project/386062/insights/rcqKg9ZI) — Insights tab and subscription detail view usage

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
