import { Text } from 'react-native'
import { SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import { styled } from "nativewind";
import { useEffect } from 'react';
import { usePostHog } from 'posthog-react-native';

const SafeAreaView = styled(RNSafeAreaView)

const Insights = () => {
  const posthog = usePostHog()

  useEffect(() => {
    posthog.capture('insights_viewed')
  }, [posthog])

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text>Insights</Text>
    </SafeAreaView>
  )
}

export default Insights
