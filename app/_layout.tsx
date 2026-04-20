import {
  Stack,
  SplashScreen,
  usePathname,
  useGlobalSearchParams,
} from "expo-router";
import { useFonts } from "expo-font";
import "@/global.css";
import { useEffect, useRef } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { PostHogProvider } from "posthog-react-native";
import { posthog } from "@/lib/posthog";
import Toast from "react-native-toast-message";

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error("Missing Clerk Publishable Key");
}

function RootLayoutContent() {
  const { isLoaded: authLoaded } = useAuth();
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const previousPathname = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      const sanitizedParams = Object.keys(params).reduce(
        (acc, key) => {
          if (["id", "tab", "view"].includes(key)) {
            acc[key] = params[key];
          }
          return acc;
        },
        {} as Record<string, string | string[]>,
      );

      posthog.screen(pathname, {
        previous_screen: previousPathname.current ?? null,
        ...sanitizedParams,
      });
      previousPathname.current = pathname;
    }
  }, [pathname, params]);

  const [fontsLoaded, fontError] = useFonts({
    "sans-light": require("../assets/fonts/PlusJakartaSans-Light.ttf"),
    "sans-regular": require("../assets/fonts/PlusJakartaSans-Regular.ttf"),
    "sans-medium": require("../assets/fonts/PlusJakartaSans-Medium.ttf"),
    "sans-semibold": require("../assets/fonts/PlusJakartaSans-SemiBold.ttf"),
    "sans-bold": require("../assets/fonts/PlusJakartaSans-Bold.ttf"),
    "sans-extrabold": require("../assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
  });

  useEffect(() => {
    if ((fontsLoaded || fontError) && authLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, authLoaded]);

  if ((!fontsLoaded && !fontError) || !authLoaded) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PostHogProvider
        client={posthog}
        autocapture={{
          captureScreens: false,
          captureTouches: true,
          propsToCapture: ["testID"],
        }}
      >
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
          <RootLayoutContent />
          <Toast />
        </ClerkProvider>
      </PostHogProvider>
    </SafeAreaProvider>
  );
}
