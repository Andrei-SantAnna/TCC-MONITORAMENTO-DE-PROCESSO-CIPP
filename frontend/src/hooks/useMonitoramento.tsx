// hooks/useMonitoramento.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MonitoramentoContextType {
  monitoramentoAtivo: boolean;
  iniciarMonitoramento: () => void;
}

const MonitoramentoContext = createContext<MonitoramentoContextType>({
  monitoramentoAtivo: false,
  iniciarMonitoramento: () => {},
});

export const MonitoramentoProvider = ({ children }: { children: ReactNode }) => {
  // Começa como false, impedindo o websocket de ligar
  const [monitoramentoAtivo, setMonitoramentoAtivo] = useState(false);

  const iniciarMonitoramento = () => {
    setMonitoramentoAtivo(true);
  };

  return (
    <MonitoramentoContext.Provider value={{ monitoramentoAtivo, iniciarMonitoramento }}>
      {children}
    </MonitoramentoContext.Provider>
  );
};

// Hook para facilitar o uso nos outros arquivos
export const useMonitoramento = () => useContext(MonitoramentoContext);