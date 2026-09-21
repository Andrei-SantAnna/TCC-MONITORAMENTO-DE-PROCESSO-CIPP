import { useEffect, useState } from 'react';
import { WS_URL } from '../services/websocket';
import { useMonitoramento } from './useMonitoramento';

export interface LeituraSensor {
  minuto: number;
  time: string;
  distancia_m: number;
  velocidade_cm_min: number;
  pressao_mbar: number;
  temp1_c: number;
  temp2_c: number;
  temp3_c: number;
  uv_lamps: number[]; 
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


export interface PrevisaoCura {
  distancia_restante_m: number;
  tempo_estimado_min: number;
  tempo_texto: string;
  status_movimento: string;
}

export function useSensorSocket() {
  const [telemetria, setTelemetria] = useState<LeituraSensor | null>(null);
  const [inteligencia, setInteligencia] = useState<InteligenciaPred | null>(null);
  const [previsaoCura, setPrevisaoCura] = useState<PrevisaoCura | null>(null); // NOVO ESTADO
  const [historico, setHistorico] = useState<LeituraSensor[]>([]); 

  const [finalizado, setFinalizado] = useState(false);
  const [conectado, setConectado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  
  const { monitoramentoAtivo } = useMonitoramento();

  useEffect(() => {
    if (!monitoramentoAtivo) {
      return;
    }

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
        setPrevisaoCura(dados.previsao_cura); 
        setHistorico((prev) => [...prev, dados.telemetria]); 
      }
    };

    ws.onerror = () => setErro('Não foi possível conectar ao simulador.');
    ws.onclose = () => setConectado(false);

    return () => ws.close();
  }, [monitoramentoAtivo]);

  
  return { telemetria, inteligencia, previsaoCura, historico, finalizado, conectado, erro };
}