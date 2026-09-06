import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSensorSocket } from '../hooks/useSensorSocket';

export default function TelaPrevisoes() {
  const { inteligencia, conectado, erro } = useSensorSocket();

  if (!conectado && !erro) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color="#2E7DD7" />
        <Text style={styles.loadingText}>Conectando ao simulador...</Text>
      </SafeAreaView>
    );
  }

  if (erro || !inteligencia) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <Ionicons name="hourglass-outline" size={40} color="#8895A7" />
        <Text style={styles.loadingText}>Processando algoritmos preditivos...</Text>
      </SafeAreaView>
    );
  }

  const { ignicao_segura, anomalia_termica, recomendacao_acao, tempos_ignicao } = inteligencia;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>MONITORAMENTO DA CURA</Text>
        <Text style={styles.headerTitle}>Inteligência Preditiva</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={[styles.card, ignicao_segura.pronta ? styles.cardBorderGreen : styles.cardBorderOrange]}>
          <View style={styles.rowStart}>
            <Ionicons 
              name={ignicao_segura.pronta ? "checkmark-circle" : "timer-outline"} 
              size={24} 
              color={ignicao_segura.pronta ? "#1E8449" : "#F5A623"} 
            />
            <Text style={styles.infoValue}>
              {ignicao_segura.pronta ? 'Pressão Estabilizada' : 'Aguardando Estabilidade'}
            </Text>
          </View>
          <Text style={styles.infoLabel}>
            {ignicao_segura.pronta 
              ? 'A pressão de trabalho se manteve constante por 10 minutos. O manual autoriza o início da ignição.' 
              : 'O manual exige pressão constante por 10 min antes da ignição para evitar danos no liner.'}
          </Text>
        </View>

        {!ignicao_segura.pronta && (
          <View style={[styles.card, styles.center, { paddingVertical: 30 }]}>
            <Text style={styles.cardLabel}>TEMPO PARA ESTABILIDADE TÉRMICA</Text>
            <Text style={[styles.bigValue, { fontSize: 42, marginVertical: 10 }]}>
              0{ignicao_segura.tempo_restante_min}:00 min
            </Text>
          </View>
        )}

        {/* Diretrizes de Ignição do Manual */}
        <View style={[styles.card, styles.cardBorderBlue]}>
          <Text style={styles.cardLabel}>DIRETRIZ DE IGNIÇÃO UV (ANEXO 8)</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Intervalo por lâmpada</Text>
            <Text style={styles.infoValue}>{tempos_ignicao.intervalo_lampada_seg} seg</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tempo Ocioso (Idle)</Text>
            <Text style={styles.infoValue}>{tempos_ignicao.tempo_ocioso_seg} seg</Text>
          </View>
        </View>

        <View style={[styles.card, styles.cardBorderBlue]}>
          <Text style={styles.cardLabel}>RECOMENDAÇÃO OPERACIONAL</Text>
          <View style={styles.rowStart}>
            <Ionicons name="analytics-outline" size={24} color="#2E7DD7" />
            <Text style={[styles.infoValue, { flexShrink: 1 }]}>{recomendacao_acao}</Text>
          </View>
        </View>

        {anomalia_termica && (
          <View style={[styles.card, styles.cardBorderRed, { backgroundColor: '#FDECC8' }]}>
            <View style={styles.rowStart}>
              <Ionicons name="warning" size={24} color="#E63946" />
              <Text style={[styles.infoValue, { color: '#E63946' }]}>Alerta Crítico</Text>
            </View>
            <Text style={[styles.infoLabel, { color: '#E63946', marginTop: 4, fontWeight: 'bold' }]}>
              {anomalia_termica}
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { backgroundColor: '#1B3A6B', paddingHorizontal: 20, paddingVertical: 18 },
  headerLabel: { color: '#9FB3D1', fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  content: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  center:{justifyContent: 'center', alignItems: 'center', textAlign: 'center'},
  loadingText:{ marginTop: 12, fontSize: 16, color: '#1B3A6B'},
  cardBorderBlue: { borderLeftWidth: 4, borderLeftColor: '#2E7DD7' },
  cardBorderOrange: { borderLeftWidth: 4, borderLeftColor: '#F5A623' },
  cardBorderGreen: { borderLeftWidth: 4, borderLeftColor: '#1E8449' },
  cardBorderRed: { borderLeftWidth: 4, borderLeftColor: '#E63946' },
  cardLabel: { fontSize: 12, fontWeight: '700', color: '#8895A7', letterSpacing: 0.5 },
  rowStart: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bigValue: { fontSize: 30, fontWeight: 'bold', color: '#1B3A6B' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  infoLabel: { fontSize: 15, color: '#1B3A6B', flexShrink: 1 },
  infoValue: { fontSize: 16, fontWeight: '700', color: '#1B3A6B' },
});
