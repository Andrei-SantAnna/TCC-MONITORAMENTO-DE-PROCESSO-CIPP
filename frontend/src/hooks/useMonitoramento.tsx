import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { TrechoReplay } from '../services/websocket';

interface MonitoramentoContextType {
  monitoramentoAtivo: boolean;
  sessaoMonitoramento: number;
  trechoSelecionado: TrechoReplay;
  selecionarTrecho: (trecho: TrechoReplay) => void;
  iniciarMonitoramento: () => void;
  reiniciarMonitoramento: () => void;
  pararMonitoramento: () => void;
}

const MonitoramentoContext = createContext<MonitoramentoContextType | null>(null);

export function MonitoramentoProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [monitoramentoAtivo, setMonitoramentoAtivo] = useState(false);
  const [sessaoMonitoramento, setSessaoMonitoramento] = useState(0);
  const [trechoSelecionado, setTrechoSelecionado] = useState<TrechoReplay>('todos');
  // A troca de trecho durante uma execução abre uma nova sessão e limpa
  // o histórico anterior, sem misturar dados de operações diferentes.
  const selecionarTrecho = useCallback((trecho: TrechoReplay) => {
    if (trecho === trechoSelecionado) return;
    setTrechoSelecionado(trecho);
    if (monitoramentoAtivo) setSessaoMonitoramento(v => v + 1);
  }, [trechoSelecionado, monitoramentoAtivo]);
  const iniciarMonitoramento = useCallback(() => {
    setMonitoramentoAtivo(true); // Idempotente: alternar de tela não reinicia o replay.
  }, []);
  const reiniciarMonitoramento = useCallback(() => {
    setSessaoMonitoramento(v => v + 1); // Força nova sessão, mesmo já ativa.
    setMonitoramentoAtivo(true);
  }, []);
  const pararMonitoramento = useCallback(() => setMonitoramentoAtivo(false), []);
  const value = useMemo(() => ({
    monitoramentoAtivo, sessaoMonitoramento, trechoSelecionado, selecionarTrecho,
    iniciarMonitoramento, reiniciarMonitoramento, pararMonitoramento,
  }), [monitoramentoAtivo, sessaoMonitoramento, trechoSelecionado, selecionarTrecho,
    iniciarMonitoramento, reiniciarMonitoramento, pararMonitoramento]);
  return <MonitoramentoContext.Provider value={value}>{children}</MonitoramentoContext.Provider>;
}

export function useMonitoramento() {
  const context = useContext(MonitoramentoContext);
  if (!context) throw new Error('useMonitoramento precisa de MonitoramentoProvider');
  return context;
}
