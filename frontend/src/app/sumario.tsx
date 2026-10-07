import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

type Topico = {
  icone: keyof typeof Ionicons.glyphMap;
  cor: string;
  titulo: string;
  descricao: string;
  itens?: { badge: string; texto: string }[];
};

const TOPICOS: Topico[] = [
  {
    icone: 'navigate-outline',
    cor: '#2E7DD7',
    titulo: 'Localização no trecho',
    descricao:
      'A Distância Atual indica quantos metros o conjunto de cura já percorreu no trecho do duto. Esse valor localiza o robô ao longo da obra e alimenta o cálculo de quanto falta para concluir a cura.',
  },
  {
    icone: 'water-outline',
    cor: '#2E7DD7',
    titulo: 'Pressão interna',
    descricao:
      'A pressão interna (em mbar) mostra se o liner permanece inflado contra a parede do duto. Pressão estável é condição de segurança antes da ignição UV: o liner precisa estar bem assentado para a resina curar no formato correto.',
  },
  {
    icone: 'git-compare-outline',
    cor: '#F5A623',
    titulo: 'Cinemática',
    descricao:
      'A Velocidade de Tração é o ritmo em que o módulo avança (exibido em m/min). Se o avanço sair da faixa prevista, o sistema marca DESVIO DETECTADO e mostra o Limite Teórico Excedido — o valor máximo de velocidade calculado para aquele instante, para evitar cura incompleta ou superaquecimento.',
  },
  {
    icone: 'thermometer-outline',
    cor: '#E63946',
    titulo: 'Temperaturas do liner e ambiente',
    descricao:
      'Os sensores acompanham a termodinâmica da reação química para garantir que o liner cure sem danos:',
    itens: [
      {
        badge: 'Amb.',
        texto: 'Ambiente (Ar): temperatura do ar no interior do duto isolado, usada como referência térmica.',
      },
      {
        badge: 'T1',
        texto: 'Liner Sensor 1: primeira leitura na parede do liner, indicando o início do aquecimento da resina.',
      },
      {
        badge: 'T2',
        texto: 'Liner Sensor 2: zona de trabalho. No gráfico, a referência mínima é 80 °C para endurecimento adequado.',
      },
      {
        badge: 'T3',
        texto: 'Liner Sensor 3: zona ideal entre 100 °C e 140 °C. Acima disso, o limite da velocidade de tração pode aumentar para evitar queima.',
      },
    ],
  },
  {
    icone: 'sunny-outline',
    cor: '#6600FF',
    titulo: 'Módulo de cura UV',
    descricao:
      'O robô usa um sistema Double-Core com 8 lâmpadas ultravioleta, divididas em dois núcleos. Cada bloco numerado na tela representa uma lâmpada: verde indica ligada e cinza indica desligada. Elas acendem em sequência segundo o esquema de ignição, curando a resina de dentro para fora.',
  },
  {
    icone: 'trending-up-outline',
    cor: '#1B3A6B',
    titulo: 'Evolução térmica completa',
    descricao:
      'O gráfico mostra o histórico de T2 (mínimo 80 °C) e T3 (faixa ideal 100–140 °C) ao longo dos minutos. Serve para conferir se o perfil de temperatura permanece dentro da janela de cura durante todo o trecho.',
  },
  {
    icone: 'checkmark-circle-outline',
    cor: '#1E8449',
    titulo: 'Cura finalizada',
    descricao:
      'Quando o processo CIPP termina, a telemetria encerra e a tela de sensores exibe um aviso de conclusão. A partir daí o streaming deixa de receber novas leituras.',
  },
];

export default function TelaSumario() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerLabel}>GUIA DO SISTEMA CIPP</Text>
        <Text style={styles.headerTitle}>Sumário dos sensores</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Este sumário explica cada bloco da página de Sensores (telemetria da cura UV) para apoiar a leitura operacional em campo.
        </Text>

        {TOPICOS.map((topico) => (
          <View key={topico.titulo} style={styles.card}>
            <View style={styles.rowTitle}>
              <Ionicons name={topico.icone} size={24} color={topico.cor} />
              <Text style={styles.cardTitle}>{topico.titulo}</Text>
            </View>
            <Text style={styles.cardDesc}>{topico.descricao}</Text>
            {topico.itens?.map((item) => (
              <View key={item.badge} style={styles.sensorItem}>
                <Text style={styles.sensorBadge}>{item.badge}</Text>
                <Text style={styles.sensorText}>{item.texto}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { backgroundColor: '#1B3A6B', paddingHorizontal: 20, paddingVertical: 18 },
  backButton: { marginBottom: 10, width: 32 },
  headerLabel: { color: '#9FB3D1', fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  content: { padding: 16, paddingBottom: 40 },
  intro: { fontSize: 16, color: '#4A5568', marginBottom: 20, lineHeight: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#1B3A6B',
  },
  rowTitle: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1B3A6B', flexShrink: 1 },
  cardDesc: { fontSize: 15, color: '#4A5568', lineHeight: 22, marginBottom: 8 },
  sensorItem: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 10, gap: 12 },
  sensorBadge: {
    backgroundColor: '#EAF2FC',
    color: '#1B3A6B',
    fontWeight: 'bold',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    overflow: 'hidden',
  },
  sensorText: { flex: 1, fontSize: 14, color: '#4A5568', lineHeight: 20 },
});