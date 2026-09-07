import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, Dimensions, Modal, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { useSensorSocket } from '../hooks/useSensorSocket';

const screenWidth = Dimensions.get("window").width;

export default function TelaSensores() {
  const { telemetria, historico, finalizado, conectado, erro } = useSensorSocket();
  const [modalFechado, setModalFechado] = useState(false);

  if (!conectado && !erro) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color="#2E7DD7" />
        <Text style={styles.loadingText}>Conectando ao simulador...</Text>
      </SafeAreaView>
    );
  }

  if (erro) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <Ionicons name="alert-circle-outline" size={40} color="#E63946" />
        <Text style={styles.errorText}>{erro}</Text>
      </SafeAreaView>
    );
  }

  if (!telemetria) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color="#2E7DD7" />
        <Text style={styles.loadingText}>Aguardando primeira leitura...</Text>
      </SafeAreaView>
    );
  }

  const chartData = {
    labels: historico.map(h => `${h.minuto}m`),
    datasets: [
      {
        data: historico.map(h => h.temp2_c),
        color: (opacity = 1) => `rgba(245, 166, 35, ${opacity})`,
        strokeWidth: 2
      },
      {
        data: historico.map(h => h.temp3_c),
        color: (opacity = 1) => `rgba(230, 57, 70, ${opacity})`,
        strokeWidth: 2
      }
    ],
    legend: ["T2 (Mín 80°C)", "T3 (Ideal 100-140°C)"]
  };

  const chartWidth = Math.max(screenWidth - 40, historico.length * 60);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>MONITORAMENTO DA CURA</Text>
        <Text style={styles.headerTitle}>Sensores - Telemetria</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={[styles.card, styles.cardBorderBlue]}>
          <Text style={styles.cardLabel}>PRESSÃO INTERNA</Text>
          <Text style={styles.bigValue}>{telemetria.pressao_mbar.toFixed(2)} mbar</Text>
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
              {(telemetria.velocidade_cm_min / 100).toFixed(2)} m/min
            </Text>
          </View>

          {telemetria.alerta && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: '#E63946', fontWeight: 'bold' }]}>Limite Teórico Excedido</Text>
              <Text style={[styles.infoValue, { color: '#E63946' }]}>
                {(telemetria.limite_teorico / 100).toFixed(2)} m/min
              </Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>TEMPERATURAS DO LINER</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Sensor 1 (T1)</Text>
            <Text style={styles.infoValue}>{telemetria.temp1_c.toFixed(1)} °C</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Sensor 2 (T2)</Text>
            <Text style={styles.infoValue}>{telemetria.temp2_c.toFixed(1)} °C</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Sensor 3 (T3)</Text>
            <Text style={styles.infoValue}>{telemetria.temp3_c.toFixed(1)} °C</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>MÓDULO DE CURA UV</Text>
          <View style={styles.lampRow}>
            {telemetria.uv_lamps?.map((lamp, index) => (
              <View key={`lampada-${index + 1}`} style={[styles.lampBox, lamp > 0 ? styles.lampOn : styles.lampOff]}>
                <Text style={styles.lampText}>{index + 1}</Text>
              </View>
            ))}
          </View>
        </View>

        {historico.length > 1 && (
          <View style={[styles.card, { paddingRight: 0 }]}>
            <Text style={styles.cardLabel}>EVOLUÇÃO TÉRMICA COMPLETA</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <LineChart
                data={chartData}
                width={chartWidth}
                height={220}
                yAxisSuffix="°C"
                withDots={false}
                chartConfig={{
                  backgroundColor: "#ffffff",
                  backgroundGradientFrom: "#ffffff",
                  backgroundGradientTo: "#ffffff",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(27, 58, 107, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(136, 149, 167, ${opacity})`,
                  style: { borderRadius: 16 },
                  propsForDots: { r: "4", strokeWidth: "2", stroke: "#fff" }
                }}
                bezier
                style={{ marginVertical: 8, borderRadius: 16 }}
              />
            </ScrollView>
          </View>
        )}
      </ScrollView>

      <Modal visible={finalizado && !modalFechado} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="checkmark-circle" size={80} color="#1E8449" />
            <Text style={styles.modalTitle}>Cura Finalizada</Text>
            <Text style={styles.modalText}>O processo CIPP foi concluído com sucesso e o streaming de telemetria foi encerrado.</Text>
            
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={() => setModalFechado(true)}
            >
              <Text style={styles.modalButtonText}>Ver Relatório Final</Text>
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
  headerLabel: { color: '#9FB3D1', fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  content: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  center:{justifyContent: 'center', alignItems: 'center'},
  loadingText:{ marginTop: 12, fontSize: 16, color: '#1B3A6B'},
  errorText:{ marginTop: 12, fontSize: 16, color: '#E63946', textAlign: 'center', paddingHorizontal: 20 },
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
  lampBox: { width: 45, height: 45, borderRadius: 8, justifyContent: 'center', alignItems: 'center', elevation: 1 },
  lampOn: { backgroundColor: '#2ECC71' },
  lampOff: { backgroundColor: '#C4CCD6' },
  lampText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', padding: 30, borderRadius: 20, alignItems: 'center', width: '85%', elevation: 10 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#1B3A6B', marginTop: 15, marginBottom: 10 },
  modalText: { fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 22, marginBottom: 25 },
  modalButton: { backgroundColor: '#1B3A6B', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 10, width: '100%', alignItems: 'center' },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});