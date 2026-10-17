import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMonitoramento } from '../hooks/useMonitoramento';
import type { TrechoReplay } from '../services/websocket';

// TEMPORÁRIO — após os testes, alterar para false (e reiniciar o Expo).
// O backend não precisa ser modificado para remover o seletor visual.
const MOSTRAR_SELETOR_DE_TESTE = true;

const HISTORICOS: { codigo: TrechoReplay; titulo: string }[] = [
  { codigo: 'todos', titulo: 'Todos os históricos (modo normal)' },
  { codigo: '85', titulo: '85 — PV ICM1-17 ao PV ICM1-18' },
  { codigo: '86', titulo: '86 — PV ICM1-16 ao PV ICM1-17' },
  { codigo: '88', titulo: '88 — IPP5-12 ao IPP5-10' },
  { codigo: '89', titulo: '89 — IPP5-09 ao IPP5-10' },
];

export default function TelaHome() {
  const { iniciarMonitoramento, monitoramentoAtivo, reiniciarMonitoramento, trechoSelecionado, selecionarTrecho } = useMonitoramento();
  const nomeTrecho = HISTORICOS.find(h => h.codigo === trechoSelecionado)?.titulo ?? 'Todos os históricos';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>MONITORAMENTO DO PROCESSO CIPP</Text>
        <Text style={styles.headerTitle}>Início</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Escolha uma das opções para acompanhar a telemetria da cura UV ou consultar o significado de cada informação da tela de sensores.
        </Text>

        {MOSTRAR_SELETOR_DE_TESTE && (
          <View style={styles.testeCard}>
            <Text style={styles.testeTitulo}>MODO DE TESTE — SELECIONAR HISTÓRICO</Text>
            <Text style={styles.testeDescricao}>Escolha um dos quatro trechos para verificar as leituras sem esperar o replay completo.</Text>
            <View style={styles.opcoesTrecho}>
              {HISTORICOS.map(item => {
                const selecionado = trechoSelecionado === item.codigo;
                return (
                  <TouchableOpacity
                    key={item.codigo}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: selecionado }}
                    accessibilityLabel={item.titulo}
                    onPress={() => selecionarTrecho(item.codigo)}
                    style={[styles.opcaoTrecho, selecionado && styles.opcaoTrechoAtiva]}
                  >
                    <Text style={[styles.opcaoTexto, selecionado && styles.opcaoTextoAtivo]}>
                      {item.codigo === 'todos' ? 'Todos' : item.codigo}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.testeDescricao}>Selecionado: {nomeTrecho}</Text>
            {monitoramentoAtivo && (
              <Text style={styles.testeAviso}>Alterar a seleção reinicia o replay com o novo histórico.</Text>
            )}
          </View>
        )}

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
              <Text style={styles.buttonTitle}>Monitoramento</Text>
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
        {MOSTRAR_SELETOR_DE_TESTE && monitoramentoAtivo && (
          <TouchableOpacity style={styles.reiniciarButton} onPress={reiniciarMonitoramento}>
            <Ionicons name="refresh-outline" size={18} color="#2E7DD7" />
            <Text style={styles.reiniciarTexto}>Reiniciar o histórico selecionado</Text>
          </TouchableOpacity>
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
  intro: { fontSize: 16, color: '#4A5568', lineHeight: 24, marginBottom: 8 },
  testeCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 10, borderLeftWidth: 4, borderLeftColor: '#F5A623' },
  testeTitulo: { fontSize: 12, fontWeight: '700', color: '#1B3A6B', letterSpacing: 0.4 },
  testeDescricao: { fontSize: 13, color: '#4A5568', lineHeight: 18 },
  testeAviso: { fontSize: 12, color: '#A06000' },
  opcoesTrecho: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcaoTrecho: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#E9EEF5', borderRadius: 9, minWidth: 58, alignItems: 'center' },
  opcaoTrechoAtiva: { backgroundColor: '#1B3A6B' },
  opcaoTexto: { color: '#1B3A6B', fontWeight: '700', fontSize: 14 },
  opcaoTextoAtivo: { color: '#fff' },
  reiniciarButton: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', padding: 12 },
  reiniciarTexto: { color: '#2E7DD7', fontWeight: '600' },
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
