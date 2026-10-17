import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { obterUrlWebSocket, type LeituraSensor, type InteligenciaPred, type PrevisaoCura, type MensagemLeitura, type MensagemWS } from '../services/websocket';
import { useMonitoramento } from './useMonitoramento';

export type { LeituraSensor, InteligenciaPred, PrevisaoCura } from '../services/websocket';

interface SensorContextType {
  telemetria: LeituraSensor | null;
  inteligencia: InteligenciaPred | null;
  previsaoCura: PrevisaoCura | null;
  historico: LeituraSensor[];
  finalizado: boolean;
  conectado: boolean;
  erro: string | null;
  trechoAtual: string | null;
  mensagemFinal: string | null;
  iniciando: boolean;
  avisoOperacional: string | null;
  blocoOperacional: number;
}
const SensorContext = createContext<SensorContextType | null>(null);
const MAX_PONTOS_GRAFICO = 120;

function mensagemValida(dado: unknown): dado is MensagemWS {
  if (!dado || typeof dado !== 'object') return false;
  const msg = dado as Record<string, unknown>;
  if (msg.status === 'finalizado' || msg.status === 'erro') return typeof msg.mensagem === 'string';
  if (!msg.telemetria || typeof msg.telemetria !== 'object') return false;
  const t = msg.telemetria as Record<string, unknown>;
  return Array.isArray(t.uv_lamps) && typeof t.minuto === 'number'
    && typeof msg.inteligencia === 'object' && !!msg.inteligencia
    && typeof msg.previsao_cura === 'object' && !!msg.previsao_cura;
}

export function SensorProvider({ children }: Readonly<{ children: ReactNode }>) {
  // Uma única atualização por pacote recebido: Sensores e Previsões exibem
  // sempre os campos produzidos a partir da MESMA leitura do WebSocket.
  const [pacoteAtual, setPacoteAtual] = useState<MensagemLeitura | null>(null);
  const telemetria = pacoteAtual?.telemetria ?? null;
  const inteligencia = pacoteAtual?.inteligencia ?? null;
  const previsaoCura = pacoteAtual?.previsao_cura ?? null;
  const [historico, setHistorico] = useState<LeituraSensor[]>([]);
  const [finalizado, setFinalizado] = useState(false);
  const [conectado, setConectado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [trechoAtual, setTrechoAtual] = useState<string | null>(null);
  const [mensagemFinal, setMensagemFinal] = useState<string | null>(null);
  const [iniciando, setIniciando] = useState(false);
  const [avisoOperacional, setAvisoOperacional] = useState<string | null>(null);
  const [blocoOperacional, setBlocoOperacional] = useState<number>(1);
  const trechoRef = useRef<string | null>(null);
  const blocoRef = useRef<number>(0);
  const { monitoramentoAtivo, sessaoMonitoramento, trechoSelecionado } = useMonitoramento();

  useEffect(() => {
    if (!monitoramentoAtivo) {
      setConectado(false);
      setIniciando(false);
      return;
    }
    let ativo = true;
    let terminou = false;
    let apresentouErro = false;
    let socket: WebSocket;
    setFinalizado(false); setMensagemFinal(null); setErro(null);
    setPacoteAtual(null);
    setAvisoOperacional(null); setBlocoOperacional(1);
    setHistorico([]); setTrechoAtual(null); trechoRef.current = null; blocoRef.current = 0;
    setConectado(false); setIniciando(true);

    try {
      socket = new WebSocket(obterUrlWebSocket(trechoSelecionado));
    } catch {
      setIniciando(false);
      setErro('URL do WebSocket inválida. Confira EXPO_PUBLIC_WS_URL.');
      return;
    }
    socket.onopen = () => {
      if (!ativo) return;
      setConectado(true); setIniciando(false); setErro(null);
    };
    socket.onmessage = event => {
      if (!ativo) return;
      try {
        const raw: unknown = JSON.parse(event.data);
        if (!mensagemValida(raw)) throw new Error('Formato de mensagem inválido');
        if ('status' in raw) {
          if (raw.status === 'finalizado') {
            terminou = true;
            setFinalizado(true); setMensagemFinal(raw.mensagem);
          } else {
            apresentouErro = true;
            setErro(raw.mensagem);
          }
          return;
        }
        const leitura = raw.telemetria;
        const trecho = leitura.trecho_origem || 'Trecho não identificado';
        const bloco = raw.metadados_simulacao?.bloco_operacional ?? leitura.bloco_operacional ?? 1;
        // Interrupção grande = novo bloco analítico, mesmo dentro do mesmo trecho.
        if (trechoRef.current !== trecho || blocoRef.current !== bloco) {
          trechoRef.current = trecho;
          blocoRef.current = bloco;
          setTrechoAtual(trecho);
          setBlocoOperacional(bloco);
          setHistorico([leitura]);
        } else {
          setHistorico(prev => [...prev, leitura].slice(-MAX_PONTOS_GRAFICO));
        }
        setAvisoOperacional(raw.metadados_simulacao?.aviso_operacional ?? null);
        setPacoteAtual(raw);
      } catch {
        apresentouErro = true;
        setErro('Mensagem WebSocket inválida ou incompatível com o backend.');
      }
    };
    socket.onerror = () => {
      if (!ativo || terminou) return;
      apresentouErro = true;
      setErro('Falha de conexão com o simulador. Verifique servidor e URL.');
    };
    socket.onclose = () => {
      if (!ativo) return;
      setConectado(false);
      setIniciando(false);
      if (!terminou && !apresentouErro) {
        setErro('Conexão interrompida. Use Reiniciar para iniciar um novo replay.');
      }
    };
    return () => {
      ativo = false;
      socket.onopen = null; socket.onmessage = null;
      socket.onerror = null; socket.onclose = null;
      socket.close();
    };
  }, [monitoramentoAtivo, sessaoMonitoramento, trechoSelecionado]);

  const value = useMemo(() => ({
    telemetria, inteligencia, previsaoCura, historico, finalizado,
    conectado, erro, trechoAtual, mensagemFinal, iniciando, avisoOperacional, blocoOperacional,
  }), [telemetria, inteligencia, previsaoCura, historico, finalizado,
    conectado, erro, trechoAtual, mensagemFinal, iniciando, avisoOperacional, blocoOperacional]);
  return <SensorContext.Provider value={value}>{children}</SensorContext.Provider>;
}

export function useSensorSocket() {
  const ctx = useContext(SensorContext);
  if (!ctx) throw new Error('useSensorSocket precisa de SensorProvider');
  return ctx;
}
