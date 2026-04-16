import { View, Text, Image } from "react-native";
import { formatCurrency, formatSubscriptionDateTime } from "@/lib/utils";

const UpcomingSubscriptionCard = ({
  data: { name, price, daysLeft, icon },
}: {
  data: UpcomingSubscription;
}) => {
  return (
    <View className="upcoming-card">
      <View className="upcoming-row">
        <Image source={icon} className="upcoming-icon" />
        <View>
          <Text className="upcoming-price">{formatCurrency(price)}</Text>
          <Text className="upcoming-meta" numberOfLines={1}>
            {daysLeft > 1 ? `${daysLeft} days left` : `Last day`}
          </Text>
        </View>
      </View>
      <Text className="upcoming-name" numberOfLines={1}>{name}</Text>
    </View>
  );
};

export default UpcomingSubscriptionCard;
