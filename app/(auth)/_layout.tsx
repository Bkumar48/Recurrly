import { Stack, Redirect } from "expo-router";
import { useAuth } from '@clerk/expo';
import '@/global.css';

export default function AuthLayout() {
    const { isSignedIn, isLoaded } = useAuth();

    if (!isLoaded) {
        return null;
    }

    if (isSignedIn) {
        return <Redirect href="/(tabs)" />;
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}