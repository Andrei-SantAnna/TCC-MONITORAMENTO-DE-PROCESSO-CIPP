/** Contrato do backend experimental FastAPI v2 (replay CIPP). */
export interface LeituraSensor {
  minuto: number;
  time: string | null;
  trecho_origem?: string;
  tempo_operacao_s?: number;
  tempo_trecho_s?: number;
  bloco_operacional?: number;
  distancia_m: number | null;
  velocidade_cm_min: number | null;
  pressao_mbar: number | null;
  temp1_c: number | null;
  temp2_c: number | null;
  temp3_c: number | null;
  temp_ambiente_c: number | null;
  temp_ambiente_bruta_c?: number | null;
  uv_lamps: number[];
  limite_teorico: number | null;
  desvio_cm_min: number | null;
  alerta: boolean;
  observacao_qualidade_ambiente?: string | null;
  temp_ambiente_valida_para_analise?: boolean;
  temp_ambiente_imputada?: boolean;
}
export interface InteligenciaPred {
  estimativa_ignicao?: {
    tempo_minimo_condicao_pressao_min: number | null;
    criterio_pressao_atendido: boolean;
    ignicao_segura_confirmada: boolean;
    momento_real_ignicao_previsto: boolean;
    status: string;
    observacao: string;
  };
  ignicao_segura: {
    pronta: boolean;
    tempo_restante_min: number | null;
    status?: string;
    observacao?: string;
    pressao_dentro_faixa?: boolean;
    duracao_observada_min?: number;
  };
  anomalia_termica: string | null;
  anomalias_termicas?: string[];
  anomalias_uv?: string[];
  recomendacao_acao: string;
  tempos_ignicao: {
    intervalo_lampada_seg: number; // Compatibilidade histórica. O intervalo é POR NÚCLEO.
    intervalo_nucleo_seg?: number;
    tempo_ocioso_seg: number;
  };
  fase_operacional_inferida?: string;
}
export interface PrevisaoCura {
  distancia_restante_m: number | null;
  tempo_estimado_min: number | null;
  tempo_texto: string;
  status_movimento: string;
  status_estimativa?: string;
  referencia_distancia_m?: number;
  referencia_validada?: boolean;
}
export interface MensagemLeitura {
  telemetria: LeituraSensor;
  inteligencia: InteligenciaPred;
  previsao_cura: PrevisaoCura;
  metadados_simulacao?: {
    tipo: 'replay_historico';
    perfil?: string;
    fator_aceleracao?: number;
    bloco_operacional?: number;
    inicio_em_andamento?: boolean;
    aviso_operacional?: string | null;
    lacuna_anterior_s?: number;
    descontinuidade?: {
      nova_janela: boolean;
      lacuna_s: number;
      mudanca_posicao_m: number | null;
      possivel_reinicio_referencia_posicao: boolean;
    } | null;
  };
}
export interface MensagemFinalizado { status: 'finalizado'; mensagem: string; }
export interface MensagemErro { status: 'erro'; mensagem: string; }
export type MensagemWS = MensagemLeitura | MensagemFinalizado | MensagemErro;


export type TrechoReplay = 'todos' | '85' | '86' | '88' | '89';

export const WS_URL = process.env.EXPO_PUBLIC_WS_URL?.trim() || 'ws://127.0.0.1:8000/ws/simulador';

/**
 * Uso EXCLUSIVAMENTE didático: variáveis EXPO_PUBLIC_ ficam visíveis no app.
 * Este token de demonstração não oferece segurança real contra extração.
 * Em produção, use autenticação de sessão no servidor e credenciais efêmeras.
 */
export function obterUrlWebSocket(trecho: TrechoReplay = 'todos'): string {
  const token = process.env.EXPO_PUBLIC_WS_TOKEN?.trim();
  const parametros: string[] = [];
  if (token) parametros.push(`token=${encodeURIComponent(token)}`);
  // O filtro é opcional: a URL habitual continua válida sem esta opção.
  if (trecho !== 'todos') parametros.push(`trecho=${encodeURIComponent(trecho)}`);
  if (parametros.length === 0) return WS_URL;
  return `${WS_URL}${WS_URL.includes('?') ? '&' : '?'}${parametros.join('&')}`;
}
