export interface LeituraSensor {
  minuto: number;
  time: string;
  velocidade_cm_min: number;
  pressao_mbar: number;
  temp1_c: number;
  temp2_c: number;
  temp3_c: number;
  limite_teorico: number;
  desvio_cm_min: number;
  alerta: boolean;
}

export interface InteligenciaPred {
  ignicao_segura: { pronta: boolean; tempo_restante_min: number };
  anomalia_termica: string | null;
  recomendacao_acao: string;
}

export interface MensagemFinalizado {
  status: 'finalizado';
  mensagem: string;
}

export type MensagemWS = { telemetria: LeituraSensor; inteligencia: InteligenciaPred } | MensagemFinalizado;

// Puxa a URL do .env. Se não achar, faz fallback para o localhost
export const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://127.0.0.1:8000/ws/simulador';