import { Stack } from "expo-router";
import "@/glocal.css";

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
