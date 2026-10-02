import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMonitoramento } from '../hooks/useMonitoramento';

export default function TelaHome() {
  const { iniciarMonitoramento } = useMonitoramento();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>MONITORAMENTO DO PROCESSO CIPP</Text>
        <Text style={styles.headerTitle}>Início</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.intro}>
          Escolha uma das opções para acompanhar a telemetria da cura UV ou consultar o significado de cada informação da tela de sensores.
        </Text>

        <Link href="/sensores" asChild>
          <TouchableOpacity
            style={styles.buttonCard}
            onPress={iniciarMonitoramento}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Abrir tela de sensores"
          >
            <View style={[styles.iconCircle, { backgroundColor: '#EAF2FC' }]}>
              <Ionicons name="speedometer-outline" size={28} color="#2E7DD7" />
            </View>
            <View style={styles.buttonTextWrap}>
              <Text style={styles.buttonTitle}>Sensores</Text>
              <Text style={styles.buttonDesc}>Telemetria em tempo real da cura, pressão, temperaturas e lâmpadas UV.</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#8895A7" />
          </TouchableOpacity>
        </Link>

        <Link href="/sumario" asChild>
          <TouchableOpacity
            style={styles.buttonCard}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Abrir sumário dos sensores"
          >
            <View style={[styles.iconCircle, { backgroundColor: '#E8F6EE' }]}>
              <Ionicons name="book-outline" size={28} color="#1E8449" />
            </View>
            <View style={styles.buttonTextWrap}>
              <Text style={styles.buttonTitle}>Sumário</Text>
              <Text style={styles.buttonDesc}>Explicação dos indicadores apresentados na página de sensores.</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#8895A7" />
          </TouchableOpacity>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { backgroundColor: '#1B3A6B', paddingHorizontal: 20, paddingVertical: 18 },
  headerLabel: { color: '#9FB3D1', fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  content: { padding: 16, gap: 12 },
  intro: { fontSize: 16, color: '#4A5568', lineHeight: 24, marginBottom: 8 },
  buttonCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  buttonTextWrap: { flex: 1, gap: 4 },
  buttonTitle: { fontSize: 18, fontWeight: 'bold', color: '#1B3A6B' },
  buttonDesc: { fontSize: 14, color: '#4A5568', lineHeight: 20 },
});
