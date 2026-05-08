import { View, Image } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { ImageSourcePropType } from "react-native";

interface SubscriptionIconProps {
  /** Traditional image source (png asset) */
  icon?: ImageSourcePropType;
  /** MaterialCommunityIcons glyph name */
  iconName?: string;
  /** Icon background color */
  iconColor?: string;
  /** Size class name, e.g. "sub-icon" or "upcoming-icon" */
  className?: string;
}

/**
 * Renders either a static image icon or a vector icon inside a coloured
 * rounded container, depending on which prop is provided.
 * Falls back to a generic "apps" vector icon if neither is set.
 */
const SubscriptionIcon = ({
  icon,
  iconName,
  iconColor = "#e8def8",
  className = "sub-icon",
}: SubscriptionIconProps) => {
  // If there's a real image source (existing subscriptions), render it.
  if (icon && !iconName) {
    return <Image source={icon} className={className} />;
  }

  // Vector icon path (user-created subscriptions).
  return (
    <View
      className={className}
      style={{
        backgroundColor: iconColor,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <MaterialCommunityIcons
        name={(iconName as any) || "apps"}
        size={28}
        color="#081126"
      />
    </View>
  );
};

export default SubscriptionIcon;
