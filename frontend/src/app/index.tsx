import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function TelaTutorial() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>Monitoramento do Processo CIPP</Text>
        <Text style={styles.headerTitle}>Guia do Sistema CIPP</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.introText}>
          Bem-vindo ao sistema de telemetria preditiva. Antes de iniciar, entenda os principais componentes do processo de cura UV:
        </Text>

        {/* Legenda do Trem UV */}
        <View style={styles.card}>
          <View style={styles.rowTitle}>
            <Ionicons name="sunny-outline" size={24} color="#6600FF" />
            <Text style={styles.cardTitle}>Módulo de Cura UV</Text>
          </View>
          <Text style={styles.cardDesc}>
            O robô possui um trem com 9 lâmpadas ultravioleta. Elas são acesas gradativamente e realizam a secagem (cura) da resina estrutural de dentro para fora.
          </Text>
        </View>

        {/* Legenda dos Sensores T1, T2, T3 */}
        <View style={styles.card}>
          <View style={styles.rowTitle}>
            <Ionicons name="thermometer-outline" size={24} color="#E63946" />
            <Text style={styles.cardTitle}>Zonas de Temperatura</Text>
          </View>
          <Text style={styles.cardDesc}>
            Os sensores acompanham a reação química em pontos distintos para garantir que o liner não queime ou fique cru:
          </Text>
          
          <View style={styles.sensorItem}>
            <Text style={styles.sensorBadge}>T1</Text>
            <Text style={styles.sensorText}><Text style={styles.bold}>Ambiente:</Text> Mede a temperatura frontal dentro do duto isolado.</Text>
          </View>

          <View style={styles.sensorItem}>
            <Text style={styles.sensorBadge}>T2</Text>
            <Text style={styles.sensorText}><Text style={styles.bold}>Mínima ({'>'} 80°C):</Text> Garante que a resina atingiu o calor necessário para iniciar o endurecimento químico.</Text>
          </View>

          <View style={styles.sensorItem}>
            <Text style={styles.sensorBadge}>T3</Text>
            <Text style={styles.sensorText}><Text style={styles.bold}>Pico (100° a 140°C):</Text> É a zona primária da cura. Se passar de 140°C, gera bolhas e arruína a tubulação.</Text>
          </View>
        </View>

        {/* Legenda de Cinemática */}
        <View style={styles.card}>
          <View style={styles.rowTitle}>
            <Ionicons name="speedometer-outline" size={24} color="#2E7DD7" />
            <Text style={styles.cardTitle}>Cinemática e Pressão</Text>
          </View>
          <Text style={styles.cardDesc}>
            O robô é puxado pelo seu cabo usando um carretel. A <Text style={styles.bold}>Velocidade de Tração</Text> (cm/min) determina o tempo de exposição à luz. A <Text style={styles.bold}>Pressão Interna</Text> mantém a manta colada na parede do esgoto velho até que ela se torne um cano rígido.
          </Text>
        </View>

      </ScrollView>

      {/* Botão de Ação Inferior */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => router.push('/sensores')}
        >
          <Text style={styles.buttonText}>Iniciar Simulador de Telemetria</Text>
          <Ionicons name="arrow-forward-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
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