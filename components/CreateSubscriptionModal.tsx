import { useState, useCallback } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  SlideInDown,
  SlideOutDown,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePostHog } from "posthog-react-native";
import clsx from "clsx";
import dayjs from "dayjs";
import { resolveIconName } from "@/helpers/resolveIcon";

const CATEGORIES = [
  "Entertainment",
  "AI Tools",
  "Developer Tools",
  "Design",
  "Productivity",
  "Cloud",
  "Music",
  "Other",
] as const;

type Frequency = "Monthly" | "Yearly";
type Category = (typeof CATEGORIES)[number];

const CATEGORY_COLORS: Record<Category, string> = {
  Entertainment: "#f5c542",
  "AI Tools": "#b8d4e3",
  "Developer Tools": "#e8def8",
  Design: "#b8e8d0",
  Productivity: "#ffd6a5",
  Cloud: "#a5c8ff",
  Music: "#f0b4c8",
  Other: "#d4d4d4",
};

interface CreateSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (subscription: Subscription) => void;
}

const CreateSubscriptionModal = ({
  visible,
  onClose,
  onCreate,
}: CreateSubscriptionModalProps) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("Monthly");
  const [category, setCategory] = useState<Category>("Entertainment");

  const posthog = usePostHog();
  const insets = useSafeAreaInsets();

  const isValid = name.trim().length > 0 && Number.parseFloat(price) > 0;

  const resetForm = useCallback(() => {
    setName("");
    setPrice("");
    setFrequency("Monthly");
    setCategory("Entertainment");
  }, []);

  const handleClose = useCallback(() => {
    posthog.capture("create_subscription_cancelled");
    resetForm();
    onClose();
  }, [onClose, resetForm, posthog]);

  const handleSubmit = useCallback(() => {
    if (!isValid) return;

    const now = dayjs();
    const renewalDate =
      frequency === "Monthly"
        ? now.add(1, "month")
        : now.add(1, "year");

    const subscription: Subscription = {
      id: `sub-${Date.now()}`,
      name: name.trim(),
      price: Number.parseFloat(price),
      currency: "USD",
      billing: frequency,
      category,
      status: "active",
      startDate: now.toISOString(),
      renewalDate: renewalDate.toISOString(),
      iconName: resolveIconName(name.trim(), category),
      iconColor: CATEGORY_COLORS[category],
      color: CATEGORY_COLORS[category],
    };

    onCreate(subscription);

    posthog.capture("subscription_created", {
      category,
      billing_frequency: frequency,
      price: Number.parseFloat(price),
    });

    resetForm();
    onClose();
  }, [
    isValid,
    name,
    price,
    frequency,
    category,
    onCreate,
    onClose,
    resetForm,
    posthog,
  ]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <Pressable
          className="modal-overlay"
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            justifyContent: "flex-end",
          }}
          onPress={handleClose}
        >
          <Animated.View
            entering={SlideInDown.duration(350).easing(
              Easing.out(Easing.cubic)
            )}
            exiting={SlideOutDown.duration(200).easing(
              Easing.in(Easing.cubic)
            )}
            style={{
              width: "100%",
              maxHeight: "85%",
            }}
          >
            <Pressable
              className="modal-container"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 10,
                maxHeight: "100%",
                paddingBottom: insets.bottom || 16,
              }}
              onPress={() => {
                /* Prevent modal close when tapping inside */
              }}
            >
              {/* Header */}
              <View className="modal-header">
                <Text className="modal-title">
                  New Subscription
                </Text>

                <Pressable
                  className="modal-close"
                  onPress={handleClose}
                >
                  <Text className="modal-close-text">✕</Text>
                </Pressable>
              </View>

              {/* Body */}
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View className="modal-body">
                  {/* Name */}
                  <View className="auth-field">
                    <Text className="auth-label">Name</Text>

                    <TextInput
                      className="auth-input"
                      placeholder="e.g. Netflix, Spotify..."
                      placeholderTextColor="rgba(0,0,0,0.35)"
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                      returnKeyType="next"
                    />
                  </View>

                  {/* Price */}
                  <View className="auth-field">
                    <Text className="auth-label">
                      Price (USD)
                    </Text>

                    <TextInput
                      className="auth-input"
                      placeholder="0.00"
                      placeholderTextColor="rgba(0,0,0,0.35)"
                      value={price}
                      onChangeText={setPrice}
                      keyboardType="decimal-pad"
                      returnKeyType="done"
                    />
                  </View>

                  {/* Frequency */}
                  <View className="auth-field">
                    <Text className="auth-label">
                      Frequency
                    </Text>

                    <View className="picker-row">
                      {(["Monthly", "Yearly"] as const).map(
                        (option) => (
                          <Pressable
                            key={option}
                            className={clsx(
                              "picker-option",
                              frequency === option &&
                                "picker-option-active"
                            )}
                            onPress={() =>
                              setFrequency(option)
                            }
                          >
                            <Text
                              className={clsx(
                                "picker-option-text",
                                frequency === option &&
                                  "picker-option-text-active"
                              )}
                            >
                              {option}
                            </Text>
                          </Pressable>
                        )
                      )}
                    </View>
                  </View>

                  {/* Categories */}
                  <View className="auth-field">
                    <Text className="auth-label">
                      Category
                    </Text>

                    <View className="category-scroll">
                      {CATEGORIES.map((cat) => (
                        <Pressable
                          key={cat}
                          className={clsx(
                            "category-chip",
                            category === cat &&
                              "category-chip-active"
                          )}
                          onPress={() =>
                            setCategory(cat)
                          }
                        >
                          <Text
                            className={clsx(
                              "category-chip-text",
                              category === cat &&
                                "category-chip-text-active"
                            )}
                          >
                            {cat}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {/* Submit */}
                  <Pressable
                    className={clsx(
                      "auth-button",
                      !isValid &&
                        "auth-button-disabled"
                    )}
                    onPress={handleSubmit}
                    disabled={!isValid}
                  >
                    <Text className="auth-button-text">
                      Add Subscription
                    </Text>
                  </Pressable>
                </View>
              </ScrollView>
            </Pressable>
          </Animated.View>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CreateSubscriptionModal;