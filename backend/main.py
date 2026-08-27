# main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import asyncio
from predictor import avaliar_leitura

app = FastAPI()

# ---------------------------------------------------------
# SETUP DO REPLAY (Simulador de Telemetria)
# Fator 1.0  -> Tempo real da obra (delay real de 60s entre linhas do log)
# Fator 60.0 -> Acelerado pra não perder tempo rodando teste na apresentação da banca
# ---------------------------------------------------------
FATOR_ACELERACAO = 60.0  

# Mock temporário do cenário da obra. 
# WIP: Depois puxar isso dinamicamente do BD ou do Front.
ESPESSURA_OBRA = 6.5
DIAMETRO_OBRA = 800

# Dados mockados pra testar o fluxo de WS antes de plugar o parser final dos PDFs
log_extraido = [
    {"minuto": 1, "velocidade_cm_min": 15, "pressao_bar": 0.25},
    {"minuto": 2, "velocidade_cm_min": 85, "pressao_bar": 0.28},
    {"minuto": 3, "velocidade_cm_min": 94, "pressao_bar": 0.27}, # Forcei esse acima de 90 pra testar o alerta
    {"minuto": 4, "velocidade_cm_min": 88, "pressao_bar": 0.26},
]

@app.websocket("/ws/simulador")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Dashboard conectado. Iniciando disparo da telemetria...")
    
    try:
        for leitura_bruta in log_extraido:
            # Aplica a inteligência do TCC validando o momento atual
            leitura_processada = avaliar_leitura(
                leitura=leitura_bruta, 
                espessura=ESPESSURA_OBRA, 
                diametro=DIAMETRO_OBRA
            )
            
            # Dispara via socket pro front consumir
            await websocket.send_json(leitura_processada)
            
            # Clock da máquina simulado
            tempo_espera = 60 / FATOR_ACELERACAO
            await asyncio.sleep(tempo_espera) 
            
        await websocket.send_json({"status": "finalizado", "mensagem": "Processo de cura finalizado."})
        print("Replay do log finalizado.")
        
    except WebSocketDisconnect:
        print("Dashboard perdeu conexão com o simulador.")