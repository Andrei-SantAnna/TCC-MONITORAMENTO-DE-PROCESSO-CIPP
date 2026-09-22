import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MonitoramentoProvider, useMonitoramento } from '../hooks/useMonitoramento';
import { SensorProvider } from '../hooks/useSensorSocket'; 
// Funções para renderizar os ícones das abas
const renderCameraIcon = ({ color, size }: { color: any, size: number }) => <Ionicons name="videocam-outline" size={size} color={color} />;
const renderSensoresIcon = ({ color, size }: { color: any, size: number }) => <Ionicons name="speedometer-outline" size={size} color={color} />;
const renderPrevisoesIcon = ({ color, size }: { color: any, size: number }) => <Ionicons name="settings-outline" size={size} color={color} />;


function LayoutPrincipal() {
  const { monitoramentoAtivo, iniciarMonitoramento } = useMonitoramento();

  const handleIniciar = () => {
    iniciarMonitoramento(); 
    router.replace('/sensores');
  };

  return (
    <>
      <Tabs screenOptions={{ tabBarActiveTintColor: '#2E7DD7', headerShown: false }}>
        <Tabs.Screen
          name="camera"
          options={{ title: 'Câmera', tabBarIcon: renderCameraIcon }}
        />
        <Tabs.Screen
          name="sensores"
          options={{ title: 'Sensores', tabBarIcon: renderSensoresIcon }}
        />
        <Tabs.Screen
          name="previsoes"
          options={{ title: 'Previsões', tabBarIcon: renderPrevisoesIcon }}
        />
        <Tabs.Screen name="index" options={{ href: null }} />
      </Tabs>

      <Modal visible={!monitoramentoAtivo} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.safeContainer}>
            <View style={styles.header}>
              <Text style={styles.headerSubtitle}>Monitoramento do Processo CIPP</Text>
              <Text style={styles.headerTitle}>Guia do Sistema CIPP</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
              <Text style={styles.introText}>
                Bem-vindo ao sistema de telemetria preditiva. Antes de iniciar, entenda os parâmetros operacionais de segurança do processo de cura UV:
              </Text>

              <View style={styles.card}>
                <View style={styles.rowTitle}>
                  <Ionicons name="sunny-outline" size={24} color="#6600FF" />
                  <Text style={styles.cardTitle}>Módulo de Cura UV</Text>
                </View>
                <Text style={styles.cardDesc}>
                  O robô utiliza um sistema Double-Core com <Text style={styles.bold}>8 lâmpadas ultravioleta</Text> (divididas em 2 núcleos). Elas são acionadas em blocos seguindo o Esquema de Ignição, realizando a cura da resina estrutural de dentro para fora.
                </Text>
              </View>

              <View style={styles.card}>
                <View style={styles.rowTitle}>
                  <Ionicons name="thermometer-outline" size={24} color="#E63946" />
                  <Text style={styles.cardTitle}>Zonas de Temperatura</Text>
                </View>
                <Text style={styles.cardDesc}>
                  Os sensores acompanham a termodinâmica da reação química para garantir que o liner cure perfeitamente sem danos:
                </Text>
                <View style={styles.sensorItem}>
                  <Text style={styles.sensorBadge}>T1</Text>
                  <Text style={styles.sensorText}><Text style={styles.bold}>Ambiente:</Text> Mede a temperatura frontal dentro do duto isolado.</Text>
                </View>
                <View style={styles.sensorItem}>
                  <Text style={styles.sensorBadge}>T2</Text>
                  <Text style={styles.sensorText}><Text style={styles.bold}>Trabalho (80°C a 120°C):</Text> Faixa ideal da superfície. Garante que a resina atingiu o calor necessário para o endurecimento.</Text>
                </View>
                <View style={styles.sensorItem}>
                  <Text style={styles.sensorBadge}>T3</Text>
                  <Text style={styles.sensorText}><Text style={styles.bold}>Alerta ({'>'} 120°C):</Text> Limite superior. Acima desta média, o limite da Velocidade de Tração sofrerá acréscimo de 10% para evitar a queima.</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.button}
                onPress={handleIniciar}
              >
                <Text style={styles.buttonText}>Iniciar Monitoramento</Text>
                <Ionicons name="arrow-forward-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

// O COMPONENTE EXPORTADO AGORA INCLUI O SENSOR PROVIDER
export default function TabLayout() {
  return (
    <MonitoramentoProvider>
      <SensorProvider>
        <LayoutPrincipal />
      </SensorProvider>
    </MonitoramentoProvider>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center' },
  safeContainer: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { backgroundColor: '#1B3A6B', paddingHorizontal: 20, paddingVertical: 25, borderBottomWidth: 4, borderBottomColor: '#2E7DD7' },
  headerSubtitle: { color: '#9FB3D1', fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 4 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  content: { padding: 16, paddingBottom: 40 },
  introText: { fontSize: 16, color: '#4A5568', marginBottom: 20, lineHeight: 24 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2, borderLeftWidth: 4, borderLeftColor: '#1B3A6B' },
  rowTitle: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1B3A6B' },
  cardDesc: { fontSize: 15, color: '#4A5568', lineHeight: 22, marginBottom: 8 },
  sensorItem: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 12, paddingRight: 30 },
  sensorBadge: { backgroundColor: '#EAF2FC', color: '#1B3A6B', fontWeight: 'bold', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, overflow: 'hidden' },
  sensorText: { fontSize: 14, color: '#4A5568', lineHeight: 20 },
  bold: { fontWeight: 'bold', color: '#1B3A6B' },
  footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#E2E8F0' },
  button: { backgroundColor: '#1E8449', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 12, gap: 10, elevation: 2 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});