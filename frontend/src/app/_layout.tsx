import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { MonitoramentoProvider } from '../hooks/useMonitoramento';
import { SensorProvider } from '../hooks/useSensorSocket';

const renderHomeIcon = ({ color, size }: { color: string; size: number }) => (
  <Ionicons name="home-outline" size={size} color={color} />
);
const renderSensoresIcon = ({ color, size }: { color: string; size: number }) => (
  <Ionicons name="speedometer-outline" size={size} color={color} />
);
const renderSumarioIcon = ({ color, size }: { color: string; size: number }) => (
  <Ionicons name="book-outline" size={size} color={color} />
);
const renderPrevisoesIcon = ({ color, size }: { color: string; size: number }) => (
  <Ionicons name="analytics-outline" size={size} color={color} />
);

function LayoutPrincipal() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#2E7DD7', headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Início', 
          tabBarIcon: ({color, size}) =>(
            <Ionicons name='book-outline' size={size} color={color as string}></Ionicons>
          ),
          tabBarStyle:{display:'none'} 
        }}
      />
      <Tabs.Screen
        name="sensores"
        options={{ title: 'Sensores', tabBarIcon: renderSensoresIcon }}
      />
      <Tabs.Screen
        name="sumario"
        options={{
          title: 'Sumario',
          tabBarIcon: ({color, size}) => (
            <Ionicons name = "book-outline" size={size} color={color as string} />
          ),
          tabBarStyle: {display: 'none'},
        }}
      />
      <Tabs.Screen
        name="previsoes"
        options={{ title: 'Previsões', tabBarIcon: renderPrevisoesIcon }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return (
    <MonitoramentoProvider>
      <SensorProvider>
        <LayoutPrincipal />
      </SensorProvider>
    </MonitoramentoProvider>
  );
}
