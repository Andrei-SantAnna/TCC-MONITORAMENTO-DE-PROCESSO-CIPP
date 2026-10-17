import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSensorSocket } from '../hooks/useSensorSocket';
import { useMonitoramento } from '../hooks/useMonitoramento';

function obterTituloConexao(finalizado: boolean, erro: string | null, conectado: boolean): string {
  if (finalizado) return 'Replay encerrado';
  if (erro) return 'Conexão interrompida';
  return conectado ? 'Conectado' : 'Sem conexão';
}

export default function TelaPrevisoes() {
  const router = useRouter();
  const { inteligencia, previsaoCura, conectado, erro, finalizado, mensagemFinal, iniciando, avisoOperacional, blocoOperacional } = useSensorSocket();
  const { reiniciarMonitoramento } = useMonitoramento();

  const voltar = () => router.replace('/');

  if (iniciando && !inteligencia && !erro) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <TouchableOpacity style={styles.backButtonFloating} onPress={voltar}>
          <Ionicons name="arrow-back" size={24} color="#1B3A6B" />
        </TouchableOpacity>
        <ActivityIndicator size="large" color="#2E7DD7" />
        <Text style={styles.loadingText}>Conectando ao simulador...</Text>
      </SafeAreaView>
    );
  }

  if (!inteligencia || !previsaoCura) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <TouchableOpacity style={styles.backButtonFloating} onPress={voltar}>
          <Ionicons name="arrow-back" size={24} color="#1B3A6B" />
        </TouchableOpacity>
        <Ionicons name="hourglass-outline" size={40} color="#8895A7" />
        <Text style={styles.loadingText}>{erro ?? 'Processando algoritmos preditivos...'}</Text>
        {erro && <TouchableOpacity onPress={reiniciarMonitoramento} style={styles.card}><Text style={styles.infoValue}>Tentar novamente</Text></TouchableOpacity>}
      </SafeAreaView>
    );
  }

  const { ignicao_segura, estimativa_ignicao, anomalia_termica, recomendacao_acao, tempos_ignicao } = inteligencia;
  const formatarMinutos = (valor: number | null | undefined) =>
    valor == null ? 'Indisponível' : `${Math.floor(valor)}min ${String(Math.round((valor % 1) * 60)).padStart(2, '0')}s`;


  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={voltar}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerLabel}>MONITORAMENTO DA CURA</Text>
        <Text style={styles.headerTitle}>Inteligência Preditiva</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {(finalizado || erro || !conectado) && (
          <View style={[styles.card, styles.cardBorderOrange]}>
            <Text style={styles.infoValue}>{obterTituloConexao(finalizado, erro, conectado)}</Text>
            <Text style={styles.infoLabel}>{mensagemFinal ?? erro ?? 'Últimos resultados preservados.'}</Text>
            <TouchableOpacity onPress={reiniciarMonitoramento} style={styles.card}>
              <Text style={styles.infoValue}>Reiniciar simulação</Text>
            </TouchableOpacity>
          </View>
        )}

        {avisoOperacional && (
          <View style={[styles.card, styles.cardBorderOrange]}>
            <Text style={styles.cardLabel}>CONTEXTO DO HISTÓRICO — BLOCO {blocoOperacional}</Text>
            <Text style={styles.infoLabel}>{avisoOperacional}</Text>
            <Text style={styles.infoLabel}>
              O contador de pressão mede somente as leituras deste bloco; não reconstitui o momento da ignição anterior.
            </Text>
          </View>
        )}

        {/* NOVO CARD PREVISÃO FÍSICA */}
        <View style={[styles.card, styles.cardBorderGreen]}>
          <Text style={styles.cardLabel}>PREVISÃO DE TÉRMINO DA CURA</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Distância Restante:</Text>
            <Text style={styles.infoValue}>{previsaoCura.distancia_restante_m == null ? 'Indisponível' : `${previsaoCura.distancia_restante_m.toFixed(2)} m`}</Text>
          </View>

          <View style={{ marginTop: 15, alignItems: 'center' }}>
            <Text style={styles.cardLabel}>FINALIZAÇÃO ESTIMADA EM:</Text>
            <Text style={[styles.bigValue, { color: '#1E8449', fontSize: 36, marginTop: 5 }]}>
              {previsaoCura.tempo_estimado_min == null ? 'Indisponível' : previsaoCura.tempo_texto}
            </Text>
          </View>
        </View>

        <View style={[styles.card, ignicao_segura.pronta ? styles.cardBorderGreen : styles.cardBorderOrange]}>
          <Text style={styles.cardLabel}>ESTIMATIVA DE ESTABILIZAÇÃO DA PRESSÃO</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tempo observado na faixa de 200–300 mbar (mínimo 10 min)</Text>
            <Text style={styles.infoValue}>{ignicao_segura.duracao_observada_min?.toFixed(1).replace('.', ',') ?? '0,0'} min</Text>
          </View>
          <Text style={[styles.bigValue, { textAlign: 'center', color: ignicao_segura.pronta ? '#1E8449' : '#1B3A6B' }]}>
            {ignicao_segura.pronta ? 'Critério atendido' : formatarMinutos(ignicao_segura.tempo_restante_min)}
          </Text>
          <Text style={styles.infoLabel}>{ignicao_segura.status ?? 'Verificando histórico de pressão'}</Text>
        </View>

        <View style={[styles.card, styles.cardBorderOrange]}>
          <Text style={styles.cardLabel}>ESTIMATIVA PARA O REQUISITO DE PRESSÃO DA IGNIÇÃO UV</Text>
          <Text style={[styles.bigValue, { textAlign: 'center' }]}>
            {estimativa_ignicao?.criterio_pressao_atendido
              ? 'Condição atendida'
              : formatarMinutos(estimativa_ignicao?.tempo_minimo_condicao_pressao_min)}
          </Text>
          <Text style={styles.infoLabel}>
            {estimativa_ignicao?.status ?? 'Estimativa de ignição não disponibilizada pelo backend.'}
          </Text>
          <Text style={[styles.infoLabel, { marginTop: 4 }]}>
            O aplicativo não confirma o momento seguro de ignição. Outras verificações previstas no procedimento são necessárias.
          </Text>
        </View>

        <View style={[styles.card, styles.cardBorderBlue]}>
          <Text style={styles.cardLabel}>DIRETRIZ DE IGNIÇÃO UV (ANEXO 8)</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Intervalo por núcleo</Text>
            <Text style={styles.infoValue}>{tempos_ignicao.intervalo_nucleo_seg ?? tempos_ignicao.intervalo_lampada_seg} seg</Text>
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
  backButton: { marginBottom: 10, width: 32 },
  backButtonFloating: { position: 'absolute', top: 16, left: 16, padding: 4, zIndex: 10 },
  headerLabel: { color: '#9FB3D1', fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  content: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  center: { justifyContent: 'center', alignItems: 'center', textAlign: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#1B3A6B' },
  cardBorderBlue: { borderLeftWidth: 4, borderLeftColor: '#2E7DD7' },
  cardBorderOrange: { borderLeftWidth: 4, borderLeftColor: '#F5A623' },
  cardBorderGreen: { borderLeftWidth: 4, borderLeftColor: '#1E8449' },
  cardBorderRed: { borderLeftWidth: 4, borderLeftColor: '#E63946' },
  cardLabel: { fontSize: 12, fontWeight: '700', color: '#8895A7', letterSpacing: 0.5 },
  rowStart: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bigValue: { fontSize: 30, fontWeight: 'bold', color: '#1B3A6B' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  infoLabel: { fontSize: 15, color: '#1B3A6B', flexShrink: 1 },
  infoValue: { fontSize: 16, fontWeight: '700', color: '#1B3A6B' }
});