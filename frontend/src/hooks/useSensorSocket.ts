import { useEffect, useRef, useState } from 'react';
import { WS_URL } from '../services/websocket';

export interface LeituraSensor {
  minuto: number;
  time: string;
  velocidade_cm_min: number;
  pressao_mbar: number;
  temp1_c: number;
  temp2_c: number;
  temp3_c: number;
  uv_lamps: number[]; // Adicionado array de lâmpadas
  limite_teorico: number;
  desvio_cm_min: number;
  alerta: boolean;
}

export interface InteligenciaPred {
  ignicao_segura: { pronta: boolean; tempo_restante_min: number };
  anomalia_termica: string | null;
  recomendacao_acao: string;
  tempos_ignicao: { intervalo_lampada_seg: number; tempo_ocioso_seg: number };
}

export function useSensorSocket() {
  const [telemetria, setTelemetria] = useState<LeituraSensor | null>(null);
  const [inteligencia, setInteligencia] = useState<InteligenciaPred | null>(null);
  const [historico, setHistorico] = useState<LeituraSensor[]>([]); 
  
  const [finalizado, setFinalizado] = useState(false);
  const [conectado, setConectado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      setConectado(true);
      setErro(null);
    };

    ws.onmessage = (event) => {
      const dados = JSON.parse(event.data);

      if (dados.status === 'finalizado') {
        setFinalizado(true);
      } else if (dados.telemetria) {
        setTelemetria(dados.telemetria);
        setInteligencia(dados.inteligencia);
        // Histórico completo para renderizar o gráfico inteiro
        setHistorico((prev) => [...prev, dados.telemetria]); 
      }
    };

    ws.onerror = () => setErro('Não foi possível conectar ao simulador.');
    ws.onclose = () => setConectado(false);

    return () => ws.close();
  }, []);

  return { telemetria, inteligencia, historico, finalizado, conectado, erro };
}