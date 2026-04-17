import { View, Text } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useEffect } from 'react'
import { usePostHog } from 'posthog-react-native'

const SubscriptionDetail = () => {
    const { id } = useLocalSearchParams()
    const posthog = usePostHog()

    useEffect(() => {
        posthog.capture('subscription_detail_viewed', { subscription_id: id })
    }, [posthog, id])

  return (
    <View>
      <Text>{id}</Text>
    </View>
  )
}

export default SubscriptionDetail
