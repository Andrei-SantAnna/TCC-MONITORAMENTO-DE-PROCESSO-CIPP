import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
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
  temp_ambiente_c: number;
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

interface SensorContextType {
  telemetria: LeituraSensor | null;
  inteligencia: InteligenciaPred | null;
  previsaoCura: PrevisaoCura | null;
  historico: LeituraSensor[];
  finalizado: boolean;
  conectado: boolean;
  erro: string | null;
}

// Cria o contexto (inicialmente nulo)
const SensorContext = createContext<SensorContextType | null>(null);

// Variável global para guardar a conexão (Padrão Singleton)
let socketGlobal: WebSocket | null = null;

// O Provider deve ser um componente funcional React que retorna JSX
export function SensorProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [telemetria, setTelemetria] = useState<LeituraSensor | null>(null);
  const [inteligencia, setInteligencia] = useState<InteligenciaPred | null>(null);
  const [previsaoCura, setPrevisaoCura] = useState<PrevisaoCura | null>(null);
  const [historico, setHistorico] = useState<LeituraSensor[]>([]); 

  const [finalizado, setFinalizado] = useState(false);
  const [conectado, setConectado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  
  const { monitoramentoAtivo } = useMonitoramento();

  useEffect(() => {
    // Só inicia se o utilizador já tiver clicado no botão Iniciar
    if (!monitoramentoAtivo) return;

    // Se a conexão global já existe e está ativa, não abre outra!
    if (socketGlobal && (socketGlobal.readyState === WebSocket.CONNECTING || socketGlobal.readyState === WebSocket.OPEN)) {
      return;
    }

    // Caso contrário, abre a única conexão permitida
    socketGlobal = new WebSocket(WS_URL);

    socketGlobal.onopen = () => {
      setConectado(true);
      setErro(null);
    };

    socketGlobal.onmessage = (event) => {
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

    socketGlobal.onerror = () => setErro('Não foi possível conectar ao simulador.');
    
    socketGlobal.onclose = () => {
      setConectado(false);
      socketGlobal = null; 
    };

  }, [monitoramentoAtivo]);

const valorContexto = useMemo(() => ({
    telemetria,
    inteligencia,
    previsaoCura,
    historico,
    finalizado,
    conectado,
    erro
  }), [telemetria, inteligencia, previsaoCura, historico, finalizado, conectado, erro]);

  return (
    <SensorContext.Provider value={valorContexto}>
      {children}
    </SensorContext.Provider>
  );
}

// O Hook que as tuas telas (sensores.tsx e previsoes.tsx) vão continuar a chamar
export function useSensorSocket() {
  const context = useContext(SensorContext);
  if (!context) {
    throw new Error('useSensorSocket deve ser usado dentro de um SensorProvider');
  }
  return context;
}