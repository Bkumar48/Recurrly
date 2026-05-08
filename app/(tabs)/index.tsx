import "@/global.css";
import { View, Image, Text, FlatList, Pressable } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import images from "@/constants/images";
import {
  HOME_USER,
  HOME_BALANCE,
  UPCOMING_SUBSCRIPTIONS,
} from "@/constants/data";
import { icons } from "@/constants/icons";
import { formatCurrency, formatSubscriptionDateTime } from "@/lib/utils";
import ListHeading from "@/components/ListHeading";
import UpcomingSubscriptionCard from "@/components/UpcomingSubscriptionCard";
import SubscriptionCard from "@/components/SubscriptionCard";
import CreateSubscriptionModal from "@/components/CreateSubscriptionModal";
import { useSubscriptionStore } from "@/lib/subscriptionStore";
import { useState, useCallback } from "react";

const SafeAreaView = styled(RNSafeAreaView);

export default function App() {
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<
    string | null
  >(null);
  const { subscriptions, addSubscription } = useSubscriptionStore();
  const [modalVisible, setModalVisible] = useState(false);

  const handleCreate = useCallback(
    (newSub: Subscription) => {
      addSubscription(newSub);
    },
    [addSubscription],
  );

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <FlatList
        ListHeaderComponent={() => (
          <>
            <View className="home-header">
              <View className="home-user">
                <Image source={images.avatar} className="home-avatar" />
                <Text className="home-user-name" numberOfLines={1}>{HOME_USER.name}</Text>
              </View>
              <Pressable
                onPress={() => setModalVisible(true)}
                className="p-2 border border-gray-300 rounded-full"
              >
                <Image source={icons.add} className="size-6" />
              </Pressable>
            </View>

            <View className="home-balance-card">
              <Text className="home-balance-label">Balance</Text>
              <View className="home-balance-row">
                <Text className="home-balance-amount">
                  {formatCurrency(HOME_BALANCE.amount)}
                </Text>
                <Text className="home-balance-date">
                  {formatSubscriptionDateTime(HOME_BALANCE.nextRenewalDate)}
                </Text>
              </View>
            </View>

            <View>
              <ListHeading title="Upcoming" />
              <FlatList
                data={UPCOMING_SUBSCRIPTIONS}
                renderItem={({ item }) => (
                  <UpcomingSubscriptionCard data={item} />
                )}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12 }}
                ListEmptyComponent={
                  <Text className="home-empty-state">No upcoming renewals</Text>
                }
              />
            </View>

            <ListHeading title="Subscriptions" />
          </>
        )}
        data={subscriptions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SubscriptionCard
            {...item}
            expanded={expandedSubscriptionId === item.id}
            onPress={() =>
              setExpandedSubscriptionId((prev) =>
                prev === item.id ? null : item.id,
              )
            }
          />
        )}
        extraData={expandedSubscriptionId}
        ItemSeparatorComponent={() => <View className="h-4" />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text className="home-empty-state">No subscriptions found</Text>
        }
        contentContainerClassName="pb-18"
      />

      <CreateSubscriptionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreate={handleCreate}
      />
    </SafeAreaView>
  );
}

