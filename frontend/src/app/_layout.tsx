import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { MonitoramentoProvider } from '../hooks/useMonitoramento';
import { SensorProvider } from '../hooks/useSensorSocket';

function LayoutPrincipal() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#2E7DD7', headerShown: false }}>
      {/* Fora da barra: rotas acessadas só pelos botões */}
      <Tabs.Screen
        name="index"
        options={{ title: 'Início', href: null, tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen
        name="sumario"
        options={{ title: 'Sumário', href: null, tabBarStyle: { display: 'none' } }}
      />

      {/* Únicas abas visíveis na barra */}
      <Tabs.Screen
        name="sensores"
        options={{
          title: 'Sensores',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="speedometer-outline" size={size} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="previsoes"
        options={{
          title: 'Previsões',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="analytics-outline" size={size} color={color as string} />
          ),
        }}
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