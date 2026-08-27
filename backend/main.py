# main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import asyncio
import json
import os
from predictor import avaliar_leitura

app = FastAPI()

# ---------------------------------------------------------
# SETUP DO REPLAY (Simulador de Telemetria)
# Fator 1.0  -> Tempo real da obra (delay real de 60s entre linhas do log)
# Fator 60.0 -> Acelerado para testes da banca (1 segundo = 1 minuto no log)
# ---------------------------------------------------------
FATOR_ACELERACAO = 60.0  

# Variáveis do trecho (depois o frontend pode enviar isso dinamicamente)
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
    
    try:
        for index, leitura_bruta in enumerate(log_bruto):
            
            # Normalização de grandezas: O JSON traz speed_m_min, mas nossa regra usa cm/min
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
                "temp3_c": leitura_bruta.get("temp3_c")
            }
            
            # Aplica a inteligência do TCC
            leitura_processada = avaliar_leitura(
                leitura=leitura_adaptada, 
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