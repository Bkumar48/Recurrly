import { Tabs, Redirect } from "expo-router";
import { tabs } from "@/constants/data";
import { View, Image } from "react-native";
import clsx from "clsx";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, components } from "@/constants/theme";
import { useAuth } from "@clerk/expo";


const tabBar = components.tabBar;

const TabIcon = ({ icon, focused }: TabIconProps) => {
  return (
    <View className={clsx("tabs-icon")}>
      <View className={clsx("tabs-pill", focused && "tabs-active")}>
        <Image source={icon} resizeMode="contain" className="tabs-glyph" />
      </View>
    </View>
  );
};

const TabLayout = () => {
  const insets = useSafeAreaInsets();
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          bottom: Math.max(insets.bottom, tabBar.horizontalInset),
          height: tabBar.height,
          marginHorizontal: tabBar.horizontalInset,
          backgroundColor: colors.primary,
          borderRadius: tabBar.radius,
          borderWidth: 1,
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarItemStyle: {
          paddingVertical: tabBar.height / 2 - tabBar.iconFrame / 1.6,
        },
        tabBarIconStyle: {
          width: tabBar.iconFrame,
          height: tabBar.iconFrame,
          alignItems: "center",
        },
      }}
    >
      {tabs.map((tab: AppTab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused }) => (
              <TabIcon icon={tab.icon} focused={focused} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
};

export default TabLayout;
