import { useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
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

  const isValid = name.trim().length > 0 && Number.parseFloat(price) > 0;

  const resetForm = useCallback(() => {
    setName("");
    setPrice("");
    setFrequency("Monthly");
    setCategory("Entertainment");
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleSubmit = useCallback(() => {
    if (!isValid) return;

    const now = dayjs();
    const renewalDate =
      frequency === "Monthly" ? now.add(1, "month") : now.add(1, "year");

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
    resetForm();
    onClose();
  }, [isValid, name, price, frequency, category, onCreate, onClose, resetForm]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <Pressable className="modal-overlay" onPress={handleClose}>
          <Pressable
            className="modal-container"
            onPress={() => {
              /* prevent close when tapping inside */
            }}
          >
            {/* Header */}
            <View className="modal-header">
              <Text className="modal-title">New Subscription</Text>
              <Pressable className="modal-close" onPress={handleClose}>
                <Text className="modal-close-text">✕</Text>
              </Pressable>
            </View>

            {/* Body */}
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View className="modal-body">
                {/* Name field */}
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

                {/* Price field */}
                <View className="auth-field">
                  <Text className="auth-label">Price (USD)</Text>
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

                {/* Frequency picker */}
                <View className="auth-field">
                  <Text className="auth-label">Frequency</Text>
                  <View className="picker-row">
                    {(["Monthly", "Yearly"] as const).map((option) => (
                      <Pressable
                        key={option}
                        className={clsx(
                          "picker-option",
                          frequency === option && "picker-option-active",
                        )}
                        onPress={() => setFrequency(option)}
                      >
                        <Text
                          className={clsx(
                            "picker-option-text",
                            frequency === option && "picker-option-text-active",
                          )}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Category chips */}
                <View className="auth-field">
                  <Text className="auth-label">Category</Text>
                  <View className="category-scroll">
                    {CATEGORIES.map((cat) => (
                      <Pressable
                        key={cat}
                        className={clsx(
                          "category-chip",
                          category === cat && "category-chip-active",
                        )}
                        onPress={() => setCategory(cat)}
                      >
                        <Text
                          className={clsx(
                            "category-chip-text",
                            category === cat && "category-chip-text-active",
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
                    !isValid && "auth-button-disabled",
                  )}
                  onPress={handleSubmit}
                  disabled={!isValid}
                >
                  <Text className="auth-button-text">Add Subscription</Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CreateSubscriptionModal;
