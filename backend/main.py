# main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
import os
from predictor import avaliar_leitura, gerar_inteligencia_preditiva

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# SETUP DO REPLAY (Simulador de Telemetria)
# Fator 1.0  -> Tempo real da obra (delay real de 60s entre linhas do log)
# Fator 60.0 -> Acelerado para testes da banca (1 segundo = 1 minuto no log)
# ---------------------------------------------------------
FATOR_ACELERACAO = 60.0  

# Variáveis do trecho da obra que estamos simulando
ESPESSURA_OBRA = 6.5
DIAMETRO_OBRA = 800

def carregar_log_real(nome_arquivo):
    """Lê o JSON estruturado pelo parser na pasta 'data'."""
    caminho = os.path.join("..", "data", nome_arquivo)
    try:
        with open(caminho, "r", encoding="utf-8") as f:
            dados = json.load(f)
            return dados.get("readings", [])
    except FileNotFoundError:
        print(f"Erro: Arquivo {nome_arquivo} não encontrado na pasta data/")
        return []

@app.websocket("/ws/simulador")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Dashboard conectado. Iniciando disparo da telemetria real...")
    
    # Carrega um dos 4 logs extraídos
    log_bruto = carregar_log_real("89_TRECHO_IPP5-09_AO_IPP5-10.json")

    historico_local = []
    
    try:
        for index, leitura_bruta in enumerate(log_bruto):
            
            
            velocidade_m_min = leitura_bruta.get("speed_m_min")
            velocidade_cm = (velocidade_m_min * 100) if velocidade_m_min is not None else 0
            
            # Criamos um dicionário adaptado para o motor de regras
            leitura_adaptada = {
                "minuto": index + 1,
                "time": leitura_bruta.get("time"),
                "velocidade_cm_min": round(velocidade_cm, 2),
                "pressao_mbar": leitura_bruta.get("pressure_mbar"),
                "temp1_c": leitura_bruta.get("temp1_c"),
                "temp2_c": leitura_bruta.get("temp2_c"),
                "temp3_c": leitura_bruta.get("temp3_c"),
                "uv_lamps": leitura_bruta.get("uv_lamps", [])
            }

            historico_local.append(leitura_adaptada)

            fisica = avaliar_leitura(
                leitura=leitura_adaptada, 
                espessura=ESPESSURA_OBRA, 
                diametro=DIAMETRO_OBRA
            )

            preditiva = gerar_inteligencia_preditiva(leitura_adaptada, historico_local, DIAMETRO_OBRA)

            payload_final = {
                "telemetria": fisica,
                "inteligencia": preditiva
            }
            
            await websocket.send_json(payload_final)
            
            tempo_espera = 60 / FATOR_ACELERACAO
            await asyncio.sleep(tempo_espera) 
            
        await websocket.send_json({"status": "finalizado", "mensagem": "Processo de cura finalizado."})
        print("Replay do log finalizado.")
        
    except WebSocketDisconnect:
        print("Dashboard perdeu conexão com o simulador.")