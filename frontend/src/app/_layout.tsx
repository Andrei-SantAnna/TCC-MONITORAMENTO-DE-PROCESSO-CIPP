import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#2E7DD7', headerShown: false }}>
      <Tabs.Screen
        name="camera"
        options={{ title: 'Câmera', tabBarIcon: ({ color, size }) => <Ionicons name="videocam-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="sensores"
        options={{ title: 'Sensores', tabBarIcon: ({ color, size }) => <Ionicons name="speedometer-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="previsoes"
        options={{ title: 'Previsões', tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} /> }}
      />
    </Tabs>
  );
}