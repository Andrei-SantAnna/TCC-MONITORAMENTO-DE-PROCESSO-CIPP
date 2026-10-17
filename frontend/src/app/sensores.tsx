import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, Dimensions, Modal, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Line, Polyline } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useMonitoramento } from '../hooks/useMonitoramento';
import { useSensorSocket, type LeituraSensor } from '../hooks/useSensorSocket';

const screenWidth = Dimensions.get("window").width;

function formatarMedida(valor: number | null | undefined, casas: number, unidade: string): string {
  if (valor == null || !Number.isFinite(valor)) return 'Indisponível';
  return `${valor.toFixed(casas)} ${unidade}`;
}

function formatarVelocidade(valorCmMin: number | null | undefined): string {
  return formatarMedida(valorCmMin == null ? null : valorCmMin / 100, 2, 'm/min');
}

function exibirTemperaturaAmbiente(leitura: LeituraSensor): string {
  if (leitura.temp_ambiente_bruta_c === 500 ||
      (leitura.temp_ambiente_valida_para_analise === false && !leitura.temp_ambiente_imputada)) {
    return 'Leitura inválida';
  }
  const valor = formatarMedida(leitura.temp_ambiente_c, 1, '°C');
  return leitura.temp_ambiente_imputada ? `${valor} (estimada)` : valor;
}

function obterTituloConexao(finalizado: boolean, erro: string | null, conectado: boolean): string {
  if (finalizado) return 'Replay encerrado';
  if (erro) return 'Conexão interrompida';
  return conectado ? 'Conectado' : 'Sem conexão';
}

export default function TelaSensores() {
  const router = useRouter();
  const { iniciarMonitoramento, reiniciarMonitoramento } = useMonitoramento();
  const { telemetria, historico, previsaoCura, finalizado, conectado, erro, trechoAtual, mensagemFinal, iniciando, avisoOperacional, blocoOperacional } = useSensorSocket();
  const [modalFechado, setModalFechado] = useState(false);

  useEffect(() => {
    iniciarMonitoramento();
  }, [iniciarMonitoramento]);

  const voltar = () => router.replace('/');

  // Estados confirmados nos históricos: 0 = desligada; 2 = ligada.
  // 1 e 3 não têm significado confirmado: indicar estado desconhecido.
  const estiloLampada = (estado: number) => {
    if (estado === 2) return styles.lampOn;
    if (estado === 0) return styles.lampOff;
    return styles.lampUnknown;
  };
  const textoLampada = (estado: number) =>
    estado === 2 ? 'Acesa' : estado === 0 ? 'Apagada' : 'Estado não identificado';

  if (iniciando && !telemetria && !erro) {
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

  if (erro && !telemetria) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <TouchableOpacity style={styles.backButtonFloating} onPress={voltar}>
          <Ionicons name="arrow-back" size={24} color="#1B3A6B" />
        </TouchableOpacity>
        <Ionicons name="alert-circle-outline" size={40} color="#E63946" />
        <Text style={styles.errorText}>{erro}</Text>
        <TouchableOpacity onPress={reiniciarMonitoramento} style={styles.modalButton}><Text style={styles.modalButtonText}>Tentar novamente</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!telemetria || !previsaoCura) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <TouchableOpacity style={styles.backButtonFloating} onPress={voltar}>
          <Ionicons name="arrow-back" size={24} color="#1B3A6B" />
        </TouchableOpacity>
        <ActivityIndicator size="large" color="#2E7DD7" />
        <Text style={styles.loadingText}>Aguardando primeira leitura...</Text>
      </SafeAreaView>
    );
  }

  const historicoGrafico: LeituraSensor[] = historico.filter((h: LeituraSensor) => Number.isFinite(h.temp2_c) && Number.isFinite(h.temp3_c));
  // O gráfico SVG usa apenas linhas e polilinhas, sem elementos SVG de texto
  // nem transform-origin. Funciona no Expo Web e no React Native.
  const chartWidth = Math.max(screenWidth - 72, historicoGrafico.length * 15);
  const alturaGrafico = 210;
  const margemEsquerda = 40;
  const margemDireita = 16;
  const margemSuperior = 16;
  const margemInferior = 20;
  const valores = historicoGrafico.flatMap((h: LeituraSensor) => [h.temp2_c, h.temp3_c]);
  const tempMin = Math.floor((Math.min(...valores) - 5) / 10) * 10;
  const tempMax = Math.ceil((Math.max(...valores) + 5) / 10) * 10;
  const faixa = Math.max(1, tempMax - tempMin);
  const larguraUtil = chartWidth - margemEsquerda - margemDireita;
  const alturaUtil = alturaGrafico - margemSuperior - margemInferior;
  const xDoIndice = (i: number) => margemEsquerda + (i * larguraUtil) / Math.max(1, historicoGrafico.length - 1);
  const yDaTemperatura = (v: number) => margemSuperior + (tempMax - v) * alturaUtil / faixa;
  const pontosT2 = historicoGrafico.map((h: LeituraSensor, i: number) => `${xDoIndice(i).toFixed(2)},${yDaTemperatura(h.temp2_c).toFixed(2)}`).join(' ');
  const pontosT3 = historicoGrafico.map((h: LeituraSensor, i: number) => `${xDoIndice(i).toFixed(2)},${yDaTemperatura(h.temp3_c).toFixed(2)}`).join(' ');
  const grades = [0, 1, 2, 3, 4].map(i => ({
    valor: tempMax - i * faixa / 4,
    y: margemSuperior + i * alturaUtil / 4
  }));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={voltar}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerLabel}>MONITORAMENTO DA CURA</Text>
        <Text style={styles.headerTitle}>Sensores - Telemetria</Text>
        {trechoAtual && <Text style={styles.headerLabel} numberOfLines={2}>{trechoAtual}</Text>}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {(finalizado || erro || !conectado) && (
          <View style={[styles.card, styles.cardBorderOrange]}>
            <Text style={styles.infoValue}>{obterTituloConexao(finalizado, erro, conectado)}</Text>
            <Text style={styles.infoLabel}>{mensagemFinal ?? erro ?? 'Última leitura preservada para consulta.'}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={reiniciarMonitoramento}>
              <Text style={styles.modalButtonText}>Reiniciar simulação</Text>
            </TouchableOpacity>
          </View>
        )}

        {avisoOperacional && (
          <View style={[styles.card, styles.cardBorderOrange]}>
            <Text style={styles.cardLabel}>ATENÇÃO AO HISTÓRICO — BLOCO {blocoOperacional}</Text>
            <Text style={styles.infoLabel}>{avisoOperacional}</Text>
          </View>
        )}

        {/* CARD LOCALIZAÇÃO */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>LOCALIZAÇÃO NO TRECHO</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Distância Atual</Text>
            <Text style={styles.bigValue}>{formatarMedida(telemetria.distancia_m, 2, 'm')}</Text>
          </View>
        </View>

        <View style={[styles.card, styles.cardBorderBlue]}>
          <Text style={styles.cardLabel}>PRESSÃO INTERNA</Text>
          <Text style={styles.bigValue}>{formatarMedida(telemetria.pressao_mbar, 2, 'mbar')}</Text>
        </View>

        <View style={[styles.card, telemetria.alerta && styles.cardBorderOrange]}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardLabel}>CINEMÁTICA</Text>
            {telemetria.alerta && (
              <View style={styles.badgeCritico}>
                <Text style={styles.badgeCriticoText}>DESVIO DETECTADO</Text>
              </View>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Velocidade de Tração</Text>
            <Text style={[styles.infoValue, telemetria.alerta && styles.valueCritico]}>
              {formatarVelocidade(telemetria.velocidade_cm_min)}
            </Text>
          </View>
          {telemetria.alerta && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: '#E63946', fontWeight: 'bold' }]}>Limite Teórico Excedido</Text>
              <Text style={[styles.infoValue, { color: '#E63946' }]}>
                {formatarVelocidade(telemetria.limite_teorico)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>TEMPERATURAS DO LINER E AMBIENTE</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ambiente (Ar)</Text>
            <Text style={[styles.infoValue, { color: '#8895A7' }]}>
              {exibirTemperaturaAmbiente(telemetria)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Liner Sensor 1 (T1)</Text>
            <Text style={styles.infoValue}>{formatarMedida(telemetria.temp1_c, 1, '°C')}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Liner Sensor 2 (T2)</Text>
            <Text style={styles.infoValue}>{formatarMedida(telemetria.temp2_c, 1, '°C')}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Liner Sensor 3 (T3)</Text>
            <Text style={styles.infoValue}>{formatarMedida(telemetria.temp3_c, 1, '°C')}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>MÓDULO DE CURA UV</Text>
          <View style={styles.lampRow}>
            {telemetria.uv_lamps?.slice(0, 8).map((lamp: number, index: number) => (
              <View key={`lampada-${index + 1}`} accessible accessibilityLabel={`Lâmpada ${index + 1}: ${textoLampada(lamp)}`} style={[styles.lampBox, estiloLampada(lamp)]}>
                <Text style={styles.lampText}>{index + 1}</Text>
              </View>
            ))}
          </View>
        </View>

        {historicoGrafico.length > 1 && (
          <View style={[styles.card, { paddingRight: 0 }]}>
            <Text style={styles.cardLabel}>EVOLUÇÃO TÉRMICA (ÚLTIMAS 120 LEITURAS)</Text>
            <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap', marginVertical: 9 }}>
              <Text style={{ color: '#F5A623', fontWeight: '600' }}>● T2 (ref. ≥ 80°C)</Text>
              <Text style={{ color: '#E63946', fontWeight: '600' }}>● T3 (ref. 100–140°C)</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View style={{ width: chartWidth }}>
                <Svg width={chartWidth} height={alturaGrafico}>
                  {grades.map((g, i) => (
                    <Line
                      key={`linha-${i}`}
                      x1={margemEsquerda}
                      y1={g.y}
                      x2={chartWidth - margemDireita}
                      y2={g.y}
                      stroke="#D9E0E8"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                    />
                  ))}
                  <Polyline points={pontosT2} fill="none" stroke="#F5A623" strokeWidth={2.5} />
                  <Polyline points={pontosT3} fill="none" stroke="#E63946" strokeWidth={2.5} />
                </Svg>
                <View style={{ position: 'absolute', top: margemSuperior - 5, left: 0, justifyContent: 'space-between', height: alturaUtil + 10 }}>
                  {grades.map((g, i) => (
                    <Text key={`escala-${i}`} style={{ color: '#8895A7', fontSize: 10 }}>
                      {Math.round(g.valor)}°
                    </Text>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingLeft: margemEsquerda, paddingRight: margemDireita }}>
                  <Text style={{ color: '#8895A7', fontSize: 11 }}>{historicoGrafico[0]?.time ?? 'Início'}</Text>
                  <Text style={{ color: '#8895A7', fontSize: 11 }}>{historicoGrafico[historicoGrafico.length - 1]?.time ?? 'Atual'}</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        )}
      </ScrollView>

      <Modal visible={finalizado && !modalFechado} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="information-circle-outline" size={80} color="#2E7DD7" />
            <Text style={styles.modalTitle}>Reprodução Finalizada</Text>
            <Text style={styles.modalText}>{mensagemFinal ?? "A reprodução dos dados históricos foi concluída. Isso não certifica a cura física."}</Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setModalFechado(true)}
            >
              <Text style={styles.modalButtonText}>Fechar aviso</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#1B3A6B' },
  errorText: { marginTop: 12, fontSize: 16, color: '#E63946', textAlign: 'center', paddingHorizontal: 20 },
  cardBorderBlue: { borderLeftWidth: 4, borderLeftColor: '#2E7DD7' },
  cardBorderOrange: { borderLeftWidth: 4, borderLeftColor: '#F5A623' },
  cardLabel: { fontSize: 12, fontWeight: '700', color: '#8895A7', letterSpacing: 0.5 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  infoLabel: { fontSize: 15, color: '#1B3A6B' },
  infoValue: { fontSize: 16, fontWeight: '700', color: '#1B3A6B' },
  valueCritico: { color: '#E63946' },
  badgeCritico: { backgroundColor: '#FDECC8', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeCriticoText: { color: '#C77A00', fontSize: 10, fontWeight: '700' },
  bigValue: { fontSize: 30, fontWeight: 'bold', color: '#1B3A6B' },
  lampRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6, justifyContent: 'center' },
  lampBox: { width: 58, height: 45, borderRadius: 8, justifyContent: 'center', alignItems: 'center', elevation: 1 },
  lampOn: { backgroundColor: '#2ECC71' },
  lampOff: { backgroundColor: '#C4CCD6' },
  lampUnknown: { backgroundColor: '#F5A623' },
  lampText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', padding: 30, borderRadius: 20, alignItems: 'center', width: '85%', elevation: 10 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#1B3A6B', marginTop: 15, marginBottom: 10 },
  modalText: { fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 22, marginBottom: 25 },
  modalButton: { backgroundColor: '#1B3A6B', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 10, width: '100%', alignItems: 'center' },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});